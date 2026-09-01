import { prisma } from "@/lib/db";
import { getManager, verifyManagerInLeague } from "@/lib/fpl";
import { NextRequest, NextResponse } from "next/server";

async function validateTournament(data: {
  name: string;
  season: number;
  adminFplId: number;
}) {
  if (!data.name || data.name.trim().length === 0) {
    throw new Error("Tournament name is required");
  }

  if (data.season < 2020 || data.season > 2100) {
    throw new Error("Invalid season year");
  }

  if (!data.adminFplId || data.adminFplId <= 0) {
    throw new Error("Valid admin FPL ID is required");
  }

  // Verify FPL manager exists
  try {
    await getManager(data.adminFplId);
  } catch (error) {
    throw new Error(
      "Invalid admin FPL ID or FPL API unavailable. Please verify your entry ID."
    );
  }
}

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
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

    const tournament = await prisma.tournament.create({
      data: {
        name: body.name,
        season: body.season,
        adminFplId: body.adminFplId,
        allowChips: body.allowChips ?? true,
        status: "DRAFT",
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

    const tournament = await prisma.tournament.update({
      where: { id: body.id },
      data: {
        name: body.name,
        season: body.season,
        adminFplId: body.adminFplId,
        allowChips: body.allowChips ?? true,
      },
    });

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
