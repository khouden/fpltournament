"use server";

import { prisma } from "@/lib/db";
import {
  calculateMatchScore,
  recalculateTournamentScores,
  recalculateRoundScores,
  determineMatchResult,
} from "@/lib/scoring";
import { isFPLDeadlineActive, FPLDeadlineError, getGameweekStatus } from "@/lib/fpl";
import { validateScheduleAction } from "@/lib/schedule-actions";
import { safeRevalidate } from "@/lib/safe-revalidate";
import { requireAdminSession } from "@/lib/auth-server";

/**
 * Server action to calculate / recalculate a single match
 */
export async function recalculateMatchAction(matchId: string, tournamentId: string) {
  try {
    await requireAdminSession();

    if (isFPLDeadlineActive()) {
      return {
        success: false,
        error:
          "Score calculation is disabled during the FPL Gameweek deadline. Fantasy Premier League points are not finalized while the game is updating. Please try again after the deadline window.",
        isDeadline: true,
      };
    }

    const result = await calculateMatchScore(matchId, true);
    safeRevalidate(`/admin/tournaments/${tournamentId}`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/matches`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/schedule`);
    safeRevalidate(`/tournaments/${tournamentId}`);
    safeRevalidate(`/matches/${matchId}`);
    return { success: true, result };
  } catch (error) {
    const isDeadline =
      error instanceof FPLDeadlineError ||
      (error as { isDeadline?: boolean })?.isDeadline;
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to calculate match score",
      isDeadline: !!isDeadline,
    };
  }
}

/**
 * Server action to recalculate all tournament scores
 */
export async function recalculateAllScoresAction(tournamentId: string) {
  try {
    await requireAdminSession();

    if (isFPLDeadlineActive()) {
      return {
        success: false,
        error:
          "Bulk score recalculation is paused during the FPL Gameweek deadline. Please wait until the deadline window completes.",
        isDeadline: true,
      };
    }

    const results = await recalculateTournamentScores(tournamentId, true);
    safeRevalidate(`/admin/tournaments/${tournamentId}`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/matches`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/schedule`);
    safeRevalidate(`/tournaments/${tournamentId}`);
    return { success: true, count: results.length };
  } catch (error) {
    const isDeadline =
      error instanceof FPLDeadlineError ||
      (error as { isDeadline?: boolean })?.isDeadline;
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to recalculate scores",
      isDeadline: !!isDeadline,
    };
  }
}

/**
 * Server action to recalculate all match scores in a single round
 */
export async function recalculateRoundScoresAction(
  roundId: string,
  tournamentId: string
) {
  try {
    await requireAdminSession();

    if (isFPLDeadlineActive()) {
      return {
        success: false,
        error:
          "Score calculation is disabled during the official FPL Gameweek deadline. Fantasy Premier League points are not finalized while the game is updating. Please try again after the deadline window.",
        isDeadline: true,
      };
    }

    const results = await recalculateRoundScores(roundId, true);
    safeRevalidate(`/admin/tournaments/${tournamentId}`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/matches`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/schedule`);
    safeRevalidate(`/tournaments/${tournamentId}`);
    return { success: true, count: results.length };
  } catch (error) {
    const isDeadline =
      error instanceof FPLDeadlineError ||
      (error as { isDeadline?: boolean })?.isDeadline;
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to recalculate round scores",
      isDeadline: !!isDeadline,
    };
  }
}

/**
 * Server action to finalize a match result
 */
export async function finalizeMatchAction(matchId: string, tournamentId: string) {
  try {
    await requireAdminSession();

    if (isFPLDeadlineActive()) {
      return {
        success: false,
        error:
          "Cannot finalize match during the FPL Gameweek deadline while official points are updating.",
        isDeadline: true,
      };
    }

    // 1. Check if match's gameweek has started
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { round: true },
    });
    if (!match) {
      return { success: false, error: "Match not found" };
    }

    const gwInfo = await getGameweekStatus(match.round.gameweek);
    if (gwInfo.status === "UPCOMING") {
      return {
        success: false,
        error: `Cannot finalize match: Gameweek ${match.round.gameweek} has not started yet.`,
      };
    }

    // 2. Calculate score to ensure latest values are saved
    await calculateMatchScore(matchId, true);

    // 3. Mark match and scores as finalized
    await prisma.$transaction([
      prisma.match.update({
        where: { id: matchId },
        data: { status: "FINALIZED" },
      }),
      prisma.matchMemberScore.updateMany({
        where: { matchId },
        data: { isFinal: true },
      }),
    ]);

    // 3. Recalculate downstream matches to forward winner
    await recalculateTournamentScores(tournamentId);

    safeRevalidate(`/admin/tournaments/${tournamentId}`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/matches`);
    safeRevalidate(`/tournaments/${tournamentId}`);
    safeRevalidate(`/matches/${matchId}`);

    return { success: true };
  } catch (error) {
    const isDeadline =
      error instanceof FPLDeadlineError ||
      (error as { isDeadline?: boolean })?.isDeadline;
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to finalize match",
      isDeadline: !!isDeadline,
    };
  }
}

/**
 * Server action to publish a tournament with validation checks
 */
export async function publishTournamentWithValidationAction(tournamentId: string) {
  try {
    await requireAdminSession();
    // Run full schedule validation
    const validation = await validateScheduleAction(tournamentId);
    if (!validation.isValid) {
      return {
        success: false,
        error: "Cannot publish tournament. Please resolve schedule issues first.",
        issues: validation.issues,
      };
    }

    // Attempt to calculate initial scores for past/live rounds, but do not block publishing if external API fails
    try {
      await recalculateTournamentScores(tournamentId);
    } catch (scoreErr) {
      console.warn("Non-fatal error recalculating scores on publish:", scoreErr);
    }

    const tournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "PUBLISHED" },
    });

    safeRevalidate("/admin");
    safeRevalidate(`/admin/tournaments/${tournamentId}`);
    safeRevalidate("/tournaments");
    safeRevalidate(`/tournaments/${tournamentId}`);
    safeRevalidate("/");

    return { success: true, tournament };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to publish tournament",
    };
  }
}

/**
 * Mark a tournament as FINISHED
 */
export async function finishTournamentAction(tournamentId: string) {
  try {
    await requireAdminSession();
    const tournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "FINISHED" },
    });

    safeRevalidate("/admin");
    safeRevalidate(`/admin/tournaments/${tournamentId}`);
    safeRevalidate("/tournaments");
    safeRevalidate(`/tournaments/${tournamentId}`);
    safeRevalidate("/");

    return { success: true, tournament };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to finish tournament",
    };
  }
}

export interface ManualMemberScoreInput {
  memberId: string;
  gameweekPoints: number;
  activeChip?: string | null;
}

export interface SaveManualMatchScoresInput {
  matchId: string;
  tournamentId: string;
  scores: ManualMemberScoreInput[];
  status?: "COMPLETED" | "IN_PROGRESS" | "SCHEDULED";
}

/**
 * Server action to save / update manual player scores for a fixture
 */
export async function saveManualMatchScoresAction(
  input: SaveManualMatchScoresInput
) {
  try {
    await requireAdminSession();
    const { matchId, tournamentId, scores, status = "COMPLETED" } = input;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        round: { include: { tournament: { include: { admins: true } } } },
        homeGroup: { include: { members: true } },
        awayGroup: { include: { members: true } },
        scores: true,
      },
    });

    if (!match) {
      return { success: false, error: "Match not found" };
    }

    if (match.status === "FINALIZED") {
      return {
        success: false,
        error: "Cannot edit scores for a finalized match. It is permanently locked.",
      };
    }

    const adminFplIds = Array.from(
      new Set([
        match.round.tournament.adminFplId,
        ...(match.round.tournament.admins?.map((a) => a.fplId) || []),
      ])
    );

    await prisma.$transaction(async (tx) => {
      // 1. Upsert or update each submitted member score
      for (const s of scores) {
        const member =
          match.homeGroup?.members.find((m) => m.id === s.memberId) ||
          match.awayGroup?.members.find((m) => m.id === s.memberId);

        const isExcluded = Boolean(
          member?.isAdmin || (member && adminFplIds.includes(member.fplId))
        );

        const points = Math.max(
          -100,
          Math.min(1000, Number(s.gameweekPoints) || 0)
        );

        await tx.matchMemberScore.upsert({
          where: {
            matchId_memberId: {
              matchId: match.id,
              memberId: s.memberId,
            },
          },
          update: {
            gameweekPoints: points,
            activeChip: s.activeChip || null,
            isExcluded,
          },
          create: {
            matchId: match.id,
            memberId: s.memberId,
            gameweekPoints: points,
            activeChip: s.activeChip || null,
            isExcluded,
          },
        });
      }

      // 2. Fetch all current scores for this match to compute group totals
      const allScores = await tx.matchMemberScore.findMany({
        where: { matchId: match.id },
        include: { member: true },
      });

      let homeScore = 0;
      let awayScore = 0;

      for (const s of allScores) {
        if (!s.isExcluded) {
          if (match.homeGroupId && s.member.groupId === match.homeGroupId) {
            homeScore += s.gameweekPoints;
          } else if (match.awayGroupId && s.member.groupId === match.awayGroupId) {
            awayScore += s.gameweekPoints;
          }
        }
      }

      const result = determineMatchResult(homeScore, awayScore);
      const winnerId =
        result === "HOME_WIN"
          ? match.homeGroupId
          : result === "AWAY_WIN"
            ? match.awayGroupId
            : null;

      await tx.match.update({
        where: { id: match.id },
        data: {
          homeScore,
          awayScore,
          result,
          winnerId,
          status,
        },
      });
    });

    // 3. Recalculate downstream bracket / standings
    try {
      await recalculateTournamentScores(tournamentId);
    } catch (e) {
      console.warn("Recalculate tournament non-fatal error:", e);
    }

    safeRevalidate(`/admin/tournaments/${tournamentId}`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/matches`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/schedule`);
    safeRevalidate(`/tournaments/${tournamentId}`);
    safeRevalidate(`/matches/${matchId}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to save manual scores",
    };
  }
}

