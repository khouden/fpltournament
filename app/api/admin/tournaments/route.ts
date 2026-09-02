import { prisma } from "@/lib/db";
import { getManager, verifyManagerInLeague } from "@/lib/fpl";
import { recalculateTournamentScores } from "@/lib/scoring";
import { safeRevalidate } from "@/lib/safe-revalidate";
import { NextRequest, NextResponse } from "next/server";

interface AdminInput {
  fplId: number;
  name?: string | null;
  teamName?: string | null;
  isPrimary?: boolean;
}

async function validateTournament(data: {
  name: string;
  season: number;
  adminFplId?: number;
  admins?: AdminInput[];
}) {
  if (!data.name || data.name.trim().length === 0) {
    throw new Error("Tournament name is required");
  }

  if (data.season < 2020 || data.season > 2100) {
    throw new Error("Invalid season year");
  }

  const adminList = data.admins && data.admins.length > 0
    ? data.admins
    : data.adminFplId
      ? [{ fplId: data.adminFplId, isPrimary: true }]
      : [];

  if (adminList.length === 0) {
    throw new Error("At least one verified admin FPL account is required");
  }

  // Verify each FPL admin manager exists
  for (const admin of adminList) {
    if (!admin.fplId || admin.fplId <= 0) {
      throw new Error("Valid admin FPL ID is required");
    }
    try {
      await getManager(admin.fplId);
    } catch {
      throw new Error(
        `Invalid admin FPL ID (${admin.fplId}) or FPL API unavailable. Please verify all admin entry IDs.`
      );
    }
  }
}

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        admins: true,
        groups: true,
        rounds: {
          include: { matches: true },
          orderBy: { roundNumber: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ tournaments });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch tournaments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    await validateTournament(body);

    const admins: AdminInput[] =
      body.admins && body.admins.length > 0
        ? body.admins
        : [{ fplId: Number(body.adminFplId), isPrimary: true }];

    // Ensure exactly one primary admin
    const hasPrimary = admins.some((a) => a.isPrimary);
    const normalizedAdmins = admins.map((a, idx) => ({
      ...a,
      isPrimary: hasPrimary ? !!a.isPrimary : idx === 0,
    }));

    const primaryAdmin =
      normalizedAdmins.find((a) => a.isPrimary) || normalizedAdmins[0];

    const tournament = await prisma.tournament.create({
      data: {
        name: body.name,
        season: body.season,
        adminFplId: primaryAdmin.fplId,
        allowBenchBoost: body.allowBenchBoost ?? true,
        allowTripleCaptain: body.allowTripleCaptain ?? true,
        status: "DRAFT",
        admins: {
          create: normalizedAdmins.map((a) => ({
            fplId: a.fplId,
            name: a.name || null,
            teamName: a.teamName || null,
            isPrimary: a.isPrimary ?? false,
          })),
        },
      },
      include: {
        admins: true,
      },
    });

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create tournament";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      throw new Error("Tournament ID is required");
    }

    await validateTournament(body);

    const admins: AdminInput[] =
      body.admins && body.admins.length > 0
        ? body.admins
        : body.adminFplId
          ? [{ fplId: Number(body.adminFplId), isPrimary: true }]
          : [];

    const hasPrimary = admins.some((a) => a.isPrimary);
    const normalizedAdmins = admins.map((a, idx) => ({
      ...a,
      isPrimary: hasPrimary ? !!a.isPrimary : idx === 0,
    }));

    const primaryAdmin =
      normalizedAdmins.find((a) => a.isPrimary) ||
      (body.adminFplId ? { fplId: Number(body.adminFplId) } : null);

    const tournament = await prisma.$transaction(async (tx) => {
      if (normalizedAdmins.length > 0) {
        await tx.tournamentAdmin.deleteMany({
          where: { tournamentId: body.id },
        });

        await tx.tournamentAdmin.createMany({
          data: normalizedAdmins.map((a) => ({
            tournamentId: body.id,
            fplId: a.fplId,
            name: a.name || null,
            teamName: a.teamName || null,
            isPrimary: a.isPrimary ?? false,
          })),
        });
      }

      return tx.tournament.update({
        where: { id: body.id },
        data: {
          name: body.name,
          season: body.season,
          adminFplId: primaryAdmin ? primaryAdmin.fplId : undefined,
          allowBenchBoost: body.allowBenchBoost ?? true,
          allowTripleCaptain: body.allowTripleCaptain ?? true,
        },
        include: {
          admins: true,
        },
      });
    });

    // If tournament has started or is published, recalculate scores to reflect updated chip settings
    if (tournament.status === "PUBLISHED" || tournament.status === "FINISHED") {
      try {
        await recalculateTournamentScores(tournament.id, true);
      } catch (err) {
        console.error("Auto-recalculating tournament scores failed:", err);
      }
    }

    safeRevalidate("/admin");
    safeRevalidate(`/admin/tournaments/${tournament.id}`);
    safeRevalidate(`/admin/tournaments/${tournament.id}/schedule`);
    safeRevalidate(`/tournaments/${tournament.id}`);
    safeRevalidate("/tournaments");

    return NextResponse.json(tournament);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update tournament";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      throw new Error("Tournament ID is required");
    }

    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        rounds: { include: { matches: true } },
        groups: true,
      },
    });

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    const matchIds = tournament.rounds.flatMap((r) => r.matches.map((m) => m.id));

    await prisma.$transaction([
      prisma.matchMemberScore.deleteMany({
        where: { matchId: { in: matchIds } },
      }),
      prisma.match.deleteMany({
        where: { id: { in: matchIds } },
      }),
      prisma.round.deleteMany({
        where: { tournamentId: id },
      }),
      prisma.groupMember.deleteMany({
        where: { group: { tournamentId: id } },
      }),
      prisma.group.deleteMany({
        where: { tournamentId: id },
      }),
      prisma.tournament.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete tournament";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
