import { prisma } from "@/lib/db";
import { getManager } from "@/lib/fpl";
import { recalculateTournamentScores } from "@/lib/scoring";
import { safeRevalidate } from "@/lib/safe-revalidate";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        groups: {
          include: { members: true },
          orderBy: { createdAt: "asc" },
        },
        rounds: {
          include: {
            matches: {
              include: {
                homeGroup: true,
                awayGroup: true,
              },
              orderBy: { matchNumber: "asc" },
            },
          },
          orderBy: { roundNumber: "asc" },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ tournament });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch tournament";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await request.json();

    if (body.adminFplId) {
      await getManager(Number(body.adminFplId));
    }

    const tournament = await prisma.tournament.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        season: body.season !== undefined ? body.season : undefined,
        adminFplId: body.adminFplId !== undefined ? Number(body.adminFplId) : undefined,
        allowBenchBoost:
          body.allowBenchBoost !== undefined
            ? Boolean(body.allowBenchBoost)
            : undefined,
        allowTripleCaptain:
          body.allowTripleCaptain !== undefined
            ? Boolean(body.allowTripleCaptain)
            : undefined,
        status: body.status !== undefined ? body.status : undefined,
      },
    });

    if (
      (body.allowBenchBoost !== undefined || body.allowTripleCaptain !== undefined) &&
      (tournament.status === "PUBLISHED" || tournament.status === "FINISHED")
    ) {
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

    return NextResponse.json({ tournament });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update tournament";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        rounds: { include: { matches: true } },
        groups: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
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
