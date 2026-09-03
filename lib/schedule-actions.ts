"use server";

import { prisma } from "@/lib/db";
import { safeRevalidate } from "@/lib/safe-revalidate";
import { requireAdminSession } from "@/lib/auth-server";

export interface ScheduleValidationResult {
  isValid: boolean;
  issues: string[];
}

/**
 * Automatically generate a complete Round-Robin schedule where every group plays against every other group.
 * Uses standard polygon/circle algorithm.
 */
export async function generateRoundRobinScheduleAction(
  tournamentId: string,
  startingGameweek: number = 1
) {
  try {
    await requireAdminSession();
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        groups: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!tournament) {
      return { success: false, error: "Tournament not found" };
    }

    if (tournament.groups.length < 2) {
      return {
        success: false,
        error: "Tournament must have at least 2 groups to generate a schedule",
      };
    }

    if (startingGameweek < 1 || startingGameweek > 38) {
      return {
        success: false,
        error: "Starting Gameweek must be between 1 and 38",
      };
    }

    const groupIds = tournament.groups.map((g) => g.id);
    const isOdd = groupIds.length % 2 !== 0;
    // If odd number of teams, add a dummy/bye placeholder (represented as null)
    const teams: (string | null)[] = isOdd ? [...groupIds, null] : [...groupIds];
    const n = teams.length;
    const numRounds = n - 1;
    const matchesPerRound = n / 2;

    if (startingGameweek + numRounds - 1 > 38) {
      return {
        success: false,
        error: `Schedule requires ${numRounds} rounds, which exceeds Gameweek 38 (max available from GW${startingGameweek} is ${39 - startingGameweek})`,
      };
    }

    // Delete existing rounds and matches for this tournament in a transaction
    await prisma.$transaction(async (tx) => {
      // Find existing rounds
      const existingRounds = await tx.round.findMany({
        where: { tournamentId },
        select: { id: true },
      });
      const roundIds = existingRounds.map((r) => r.id);

      if (roundIds.length > 0) {
        // Delete match scores first
        await tx.matchMemberScore.deleteMany({
          where: { match: { roundId: { in: roundIds } } },
        });
        // Delete matches
        await tx.match.deleteMany({
          where: { roundId: { in: roundIds } },
        });
        // Delete rounds
        await tx.round.deleteMany({
          where: { tournamentId },
        });
      }

      // Generate rounds and matches using round-robin circle algorithm
      let matchCounter = 1;
      const currentTeams = [...teams];

      for (let r = 0; r < numRounds; r++) {
        const roundGw = startingGameweek + r;
        const roundNumber = r + 1;

        const round = await tx.round.create({
          data: {
            tournamentId,
            roundNumber,
            gameweek: roundGw,
            name: `Round ${roundNumber}`,
          },
        });

        for (let m = 0; m < matchesPerRound; m++) {
          const home = currentTeams[m];
          const away = currentTeams[n - 1 - m];

          // Skip matches involving the bye/dummy placeholder (when odd number of teams)
          if (home !== null && away !== null) {
            // Alternate home/away sides for balance
            const homeGroupId = r % 2 === 0 ? home : away;
            const awayGroupId = r % 2 === 0 ? away : home;

            await tx.match.create({
              data: {
                roundId: round.id,
                matchNumber: matchCounter++,
                status: "SCHEDULED",
                homeGroupId,
                awayGroupId,
              },
            });
          }
        }

        // Rotate teams (keep first team fixed, rotate the rest clockwise)
        const fixed = currentTeams[0];
        const last = currentTeams[currentTeams.length - 1];
        const rest = currentTeams.slice(1, currentTeams.length - 1);
        currentTeams.splice(0, currentTeams.length, fixed, last, ...rest);
      }
    });

    safeRevalidate(`/admin/tournaments/${tournamentId}`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/schedule`);
    safeRevalidate(`/tournaments/${tournamentId}`);

    return {
      success: true,
      message: `Successfully generated ${numRounds} rounds of round-robin fixtures!`,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate round-robin schedule",
    };
  }
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
    await requireAdminSession();
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
      roundNumber ||
      (tournament.rounds.length > 0
        ? Math.max(...tournament.rounds.map((r) => r.roundNumber)) + 1
        : 1);

    // Check unique round number
    const existing = tournament.rounds.find(
      (r) => r.roundNumber === nextRoundNumber
    );
    if (existing) {
      return {
        success: false,
        error: `Round number ${nextRoundNumber} already exists`,
      };
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
    safeRevalidate(`/tournaments/${tournamentId}`);

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
    await requireAdminSession();
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
    safeRevalidate(`/tournaments/${tournamentId}`);

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
    await requireAdminSession();
    await prisma.round.delete({
      where: { id: roundId },
    });

    safeRevalidate(`/admin/tournaments/${tournamentId}`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/schedule`);
    safeRevalidate(`/tournaments/${tournamentId}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete round",
    };
  }
}

/**
 * Create a match inside a round (direct group vs group)
 */
export async function createMatchAction(
  roundId: string,
  tournamentId: string,
  data: {
    homeGroupId?: string | null;
    awayGroupId?: string | null;
    matchNumber?: number;
  }
) {
  try {
    await requireAdminSession();
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
      return {
        success: false,
        error: "Home and Away cannot be the same group",
      };
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
      },
    });

    safeRevalidate(`/admin/tournaments/${tournamentId}`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/schedule`);
    safeRevalidate(`/tournaments/${tournamentId}`);

    return { success: true, match };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create match",
    };
  }
}

/**
 * Update match details (direct group vs group)
 */
export async function updateMatchAction(
  matchId: string,
  tournamentId: string,
  data: {
    homeGroupId?: string | null;
    awayGroupId?: string | null;
  }
) {
  try {
    await requireAdminSession();
    if (
      data.homeGroupId &&
      data.awayGroupId &&
      data.homeGroupId === data.awayGroupId
    ) {
      return {
        success: false,
        error: "Home and Away cannot be the same group",
      };
    }

    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        homeGroupId:
          data.homeGroupId === undefined ? undefined : data.homeGroupId,
        awayGroupId:
          data.awayGroupId === undefined ? undefined : data.awayGroupId,
      },
    });

    safeRevalidate(`/admin/tournaments/${tournamentId}`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/schedule`);
    safeRevalidate(`/tournaments/${tournamentId}`);

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
    await requireAdminSession();
    await prisma.match.delete({
      where: { id: matchId },
    });

    safeRevalidate(`/admin/tournaments/${tournamentId}`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/schedule`);
    safeRevalidate(`/tournaments/${tournamentId}`);

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
      admins: true,
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

  const adminFplIds = Array.from(
    new Set([
      tournament.adminFplId,
      ...(tournament.admins?.map((a) => a.fplId) || []),
    ])
  );

  // 1. Group checks
  if (tournament.groups.length < 2) {
    issues.push("Tournament must have at least 2 groups to play matches");
  }

  for (const g of tournament.groups) {
    const hasAdmin = g.members.some(
      (m) => m.isAdmin || adminFplIds.includes(m.fplId)
    );
    if (!hasAdmin) {
      issues.push(`Admin is not recorded as a member in group "${g.name}"`);
    }
    const nonAdminCount = g.members.filter(
      (m) => !m.isAdmin && !adminFplIds.includes(m.fplId)
    ).length;
    if (nonAdminCount === 0) {
      issues.push(`Group "${g.name}" has no scoring members`);
    }
  }

  // 2. Round checks
  if (tournament.rounds.length === 0) {
    issues.push("Tournament must have at least 1 round configured");
  }

  for (const round of tournament.rounds) {
    if (!round.gameweek || round.gameweek < 1 || round.gameweek > 38) {
      issues.push(
        `Round ${round.roundNumber} (${round.name || "unnamed"}) has no valid Gameweek assigned`
      );
    }

    if (round.matches.length === 0) {
      issues.push(`Round ${round.roundNumber} has no matches configured`);
    }

    for (const match of round.matches) {
      if (!match.homeGroupId || !match.awayGroupId) {
        issues.push(
          `Match ${match.matchNumber} in Round ${round.roundNumber} is missing ${!match.homeGroupId ? "home" : "away"} team`
        );
      }

      if (
        match.homeGroupId &&
        match.awayGroupId &&
        match.homeGroupId === match.awayGroupId
      ) {
        issues.push(
          `Match ${match.matchNumber} has the same group on both sides`
        );
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

