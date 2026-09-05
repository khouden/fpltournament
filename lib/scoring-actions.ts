"use server";

import { prisma } from "@/lib/db";
import { calculateMatchScore, recalculateTournamentScores } from "@/lib/scoring";
import { isFPLDeadlineActive, FPLDeadlineError } from "@/lib/fpl";
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

    // 1. Calculate score to ensure latest values are saved
    await calculateMatchScore(matchId, true);

    // 2. Mark match and scores as finalized
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

    // Recalculate all scores
    await recalculateTournamentScores(tournamentId);

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

    return { success: true, tournament };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to finish tournament",
    };
  }
}
