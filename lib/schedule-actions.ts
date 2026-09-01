"use server";

import { prisma } from "@/lib/db";
import { safeRevalidate } from "@/lib/safe-revalidate";

export interface ScheduleValidationResult {
  isValid: boolean;
  issues: string[];
}

/**
 * Create a new round for a tournament
 */
export async function createRoundAction(
  tournamentId: string,
  gameweek: number,
  name?: string,
  roundNumber?: number
) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { rounds: { orderBy: { roundNumber: "asc" } } },
    });

    if (!tournament) {
      return { success: false, error: "Tournament not found" };
    }

    if (gameweek < 1 || gameweek > 38) {
      return { success: false, error: "Gameweek must be between 1 and 38" };
    }

    const nextRoundNumber =
      roundNumber || (tournament.rounds.length > 0
        ? Math.max(...tournament.rounds.map((r) => r.roundNumber)) + 1
        : 1);

    // Check unique round number
    const existing = tournament.rounds.find((r) => r.roundNumber === nextRoundNumber);
    if (existing) {
      return { success: false, error: `Round number ${nextRoundNumber} already exists` };
    }

    const round = await prisma.round.create({
      data: {
        tournamentId,
        roundNumber: nextRoundNumber,
        gameweek,
        name: name?.trim() || `Round ${nextRoundNumber}`,
      },
    });

    safeRevalidate(`/admin/tournaments/${tournamentId}`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/schedule`);

    return { success: true, round };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create round",
    };
  }
}

/**
 * Update a round
 */
export async function updateRoundAction(
  roundId: string,
  tournamentId: string,
  data: {
    name?: string;
    gameweek?: number;
    roundNumber?: number;
  }
) {
  try {
    if (data.gameweek && (data.gameweek < 1 || data.gameweek > 38)) {
      return { success: false, error: "Gameweek must be between 1 and 38" };
    }

    const round = await prisma.round.update({
      where: { id: roundId },
      data: {
        name: data.name?.trim(),
        gameweek: data.gameweek,
        roundNumber: data.roundNumber,
      },
    });

    safeRevalidate(`/admin/tournaments/${tournamentId}`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/schedule`);

    return { success: true, round };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update round",
    };
  }
}

/**
 * Delete a round and its matches
 */
export async function deleteRoundAction(roundId: string, tournamentId: string) {
  try {
    await prisma.round.delete({
      where: { id: roundId },
    });

    safeRevalidate(`/admin/tournaments/${tournamentId}`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/schedule`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete round",
    };
  }
}

/**
 * Create a match inside a round
 */
export async function createMatchAction(
  roundId: string,
  tournamentId: string,
  data: {
    homeGroupId?: string | null;
    awayGroupId?: string | null;
    homeWinnerOfMatchId?: string | null;
    awayWinnerOfMatchId?: string | null;
    matchNumber?: number;
  }
) {
  try {
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: { matches: true },
    });

    if (!round) {
      return { success: false, error: "Round not found" };
    }

    // Validation: Home and Away cannot be identical group
    if (
      data.homeGroupId &&
      data.awayGroupId &&
      data.homeGroupId === data.awayGroupId
    ) {
      return { success: false, error: "Home and Away cannot be the same group" };
    }

    const nextMatchNumber =
      data.matchNumber ||
      (await prisma.match.count({
        where: { round: { tournamentId } },
      })) + 1;

    const match = await prisma.match.create({
      data: {
        roundId,
        matchNumber: nextMatchNumber,
        status: "SCHEDULED",
        homeGroupId: data.homeGroupId || null,
        awayGroupId: data.awayGroupId || null,
        homeWinnerOfMatchId: data.homeWinnerOfMatchId || null,
        awayWinnerOfMatchId: data.awayWinnerOfMatchId || null,
      },
    });

    safeRevalidate(`/admin/tournaments/${tournamentId}`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/schedule`);

    return { success: true, match };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create match",
    };
  }
}

/**
 * Update match details
 */
export async function updateMatchAction(
  matchId: string,
  tournamentId: string,
  data: {
    homeGroupId?: string | null;
    awayGroupId?: string | null;
    homeWinnerOfMatchId?: string | null;
    awayWinnerOfMatchId?: string | null;
  }
) {
  try {
    if (
      data.homeGroupId &&
      data.awayGroupId &&
      data.homeGroupId === data.awayGroupId
    ) {
      return { success: false, error: "Home and Away cannot be the same group" };
    }

    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        homeGroupId: data.homeGroupId === undefined ? undefined : data.homeGroupId,
        awayGroupId: data.awayGroupId === undefined ? undefined : data.awayGroupId,
        homeWinnerOfMatchId:
          data.homeWinnerOfMatchId === undefined ? undefined : data.homeWinnerOfMatchId,
        awayWinnerOfMatchId:
          data.awayWinnerOfMatchId === undefined ? undefined : data.awayWinnerOfMatchId,
      },
    });

    safeRevalidate(`/admin/tournaments/${tournamentId}`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/schedule`);

    return { success: true, match };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update match",
    };
  }
}

/**
 * Delete a match
 */
export async function deleteMatchAction(matchId: string, tournamentId: string) {
  try {
    await prisma.match.delete({
      where: { id: matchId },
    });

    safeRevalidate(`/admin/tournaments/${tournamentId}`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/schedule`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete match",
    };
  }
}

/**
 * Validate schedule integrity for publishing
 */
export async function validateScheduleAction(
  tournamentId: string
): Promise<ScheduleValidationResult> {
  const issues: string[] = [];

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      groups: {
        include: { members: true },
      },
      rounds: {
        include: {
          matches: true,
        },
        orderBy: { roundNumber: "asc" },
      },
    },
  });

  if (!tournament) {
    return { isValid: false, issues: ["Tournament not found"] };
  }

  // 1. Group checks
  if (tournament.groups.length < 2) {
    issues.push("Tournament must have at least 2 groups to play matches");
  }

  for (const g of tournament.groups) {
    const hasAdmin = g.members.some((m) => m.isAdmin || m.fplId === tournament.adminFplId);
    if (!hasAdmin) {
      issues.push(`Admin is not recorded as a member in group "${g.name}"`);
    }
    const nonAdminCount = g.members.filter((m) => !m.isAdmin && m.fplId !== tournament.adminFplId).length;
    if (nonAdminCount === 0) {
      issues.push(`Group "${g.name}" has no scoring members`);
    }
  }

  // 2. Round checks
  if (tournament.rounds.length === 0) {
    issues.push("Tournament must have at least 1 round configured");
  }

  const allMatchIds = new Set<string>();
  tournament.rounds.forEach((r) => {
    r.matches.forEach((m) => allMatchIds.add(m.id));
  });

  for (const round of tournament.rounds) {
    if (!round.gameweek || round.gameweek < 1 || round.gameweek > 38) {
      issues.push(`Round ${round.roundNumber} (${round.name || "unnamed"}) has no valid Gameweek assigned`);
    }

    if (round.matches.length === 0) {
      issues.push(`Round ${round.roundNumber} has no matches configured`);
    }

    for (const match of round.matches) {
      // Check participants
      const hasHome = Boolean(match.homeGroupId || match.homeWinnerOfMatchId);
      const hasAway = Boolean(match.awayGroupId || match.awayWinnerOfMatchId);

      if (!hasHome || !hasAway) {
        issues.push(
          `Match ${match.matchNumber} in Round ${round.roundNumber} is missing ${!hasHome ? "home" : "away"} participant`
        );
      }

      if (match.homeGroupId && match.awayGroupId && match.homeGroupId === match.awayGroupId) {
        issues.push(`Match ${match.matchNumber} has the same group on both sides`);
      }

      // Check winner references
      if (match.homeWinnerOfMatchId && !allMatchIds.has(match.homeWinnerOfMatchId)) {
        issues.push(`Match ${match.matchNumber} references a non-existent match for Home winner`);
      }
      if (match.awayWinnerOfMatchId && !allMatchIds.has(match.awayWinnerOfMatchId)) {
        issues.push(`Match ${match.matchNumber} references a non-existent match for Away winner`);
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
