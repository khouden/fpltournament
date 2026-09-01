"use server";

import { prisma } from "@/lib/db";
import { safeRevalidate } from "@/lib/safe-revalidate";

export async function deleteTournamentAction(id: string) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        rounds: { include: { matches: true } },
        groups: true,
      },
    });

    if (!tournament) {
      return { success: false, error: "Tournament not found" };
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

    safeRevalidate("/admin");
    safeRevalidate("/tournaments");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete tournament",
    };
  }
}

export async function publishTournamentAction(id: string) {
  try {
    const tournament = await prisma.tournament.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });

    safeRevalidate("/admin");
    safeRevalidate("/tournaments");

    return { success: true, tournament };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to publish tournament",
    };
  }
}

export async function unpublishTournamentAction(id: string) {
  try {
    const tournament = await prisma.tournament.update({
      where: { id },
      data: { status: "DRAFT" },
    });

    safeRevalidate("/admin");
    safeRevalidate("/tournaments");

    return { success: true, tournament };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to unpublish tournament",
    };
  }
}
