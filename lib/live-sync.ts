import { prisma } from "@/lib/db";
import { isFPLDeadlineActive, getGameweekStatus } from "@/lib/fpl";
import { recalculateRoundScores } from "@/lib/scoring";
import { safeRevalidate } from "@/lib/safe-revalidate";

export const LIVE_SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

// In-memory set to prevent parallel executions inside the same server process
const activeSyncLocks = new Set<string>();

export interface LiveSyncResult {
  triggered: boolean;
  reason?: "in_progress" | "deadline_active" | "cooldown_active" | "not_found" | "no_active_rounds" | "success" | "error";
  syncedRoundIds?: string[];
  error?: string;
}

/**
 * Triggers background live score synchronization for a tournament with an atomic 5-minute cooldown.
 * Designed to be called inside Next.js `after()` on page views (e.g. /tournaments/[id], /matches/[id]).
 *
 * Guarantees:
 * 1. Zero visitor delay (runs non-blockingly after response stream completes).
 * 2. Atomic lock: Only 1 sync execution every 5 minutes across all server instances / concurrent visitors.
 * 3. FPL Deadline safety: Skips safely without throwing during FPL maintenance windows.
 * 4. Minimal execution time: Only recalculates rounds that are LIVE or newly FINISHED with pending matches.
 */
export async function triggerTournamentScoreSync(
  tournamentId: string,
  options: { bypassCooldown?: boolean } = {}
): Promise<LiveSyncResult> {
  // 1. Guard against local concurrent executions
  if (activeSyncLocks.has(tournamentId)) {
    return { triggered: false, reason: "in_progress" };
  }

  // 2. Guard against FPL deadline window (FPL API is updating / HTML maintenance page)
  if (isFPLDeadlineActive()) {
    return { triggered: false, reason: "deadline_active" };
  }

  const now = new Date();
  const cooldownThreshold = new Date(Date.now() - LIVE_SYNC_COOLDOWN_MS);

  try {
    activeSyncLocks.add(tournamentId);

    // 3. Atomically check and acquire the 5-minute lock in PostgreSQL
    if (!options.bypassCooldown) {
      const claimResult = await prisma.tournament.updateMany({
        where: {
          id: tournamentId,
          status: "PUBLISHED",
          OR: [
            { lastScoreSyncAt: null },
            { lastScoreSyncAt: { lte: cooldownThreshold } },
          ],
        },
        data: {
          lastScoreSyncAt: now,
        },
      });

      // If count is 0, another request already claimed this 5-minute window or tournament is not published
      if (claimResult.count === 0) {
        return { triggered: false, reason: "cooldown_active" };
      }
    } else {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { lastScoreSyncAt: now },
      });
    }

    // 4. Fetch tournament rounds to identify which round(s) actually need score updates
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        rounds: {
          include: {
            matches: {
              select: { id: true, status: true },
            },
          },
          orderBy: { roundNumber: "asc" },
        },
      },
    });

    if (!tournament) {
      return { triggered: false, reason: "not_found" };
    }

    const syncedRoundIds: string[] = [];

    // 5. Evaluate each round's Gameweek status
    for (const round of tournament.rounds) {
      const gwInfo = await getGameweekStatus(round.gameweek);

      // Determine if round requires recalculation:
      // A. Gameweek is actively LIVE (matches currently playing)
      const isLive = gwInfo.status === "LIVE";

      // B. Gameweek recently FINISHED, but round still has matches marked SCHEDULED or IN_PROGRESS
      const hasPendingMatches = round.matches.some(
        (m) => m.status === "SCHEDULED" || m.status === "IN_PROGRESS"
      );
      const isRecentlyFinished = gwInfo.isFinished && hasPendingMatches;

      if (isLive || isRecentlyFinished) {
        try {
          await recalculateRoundScores(round.id, true);
          syncedRoundIds.push(round.id);
        } catch (roundError) {
          console.error(
            `[live-sync] Error recalculating round ${round.id} (GW${round.gameweek}):`,
            roundError
          );
        }
      }
    }

    // 6. If any round scores were updated, revalidate the public & admin pages
    if (syncedRoundIds.length > 0) {
      safeRevalidate(`/tournaments/${tournamentId}`);
      safeRevalidate(`/admin/tournaments/${tournamentId}`);
      safeRevalidate(`/admin/tournaments/${tournamentId}/matches`);
      safeRevalidate(`/admin/tournaments/${tournamentId}/schedule`);
      return { triggered: true, reason: "success", syncedRoundIds };
    }

    return { triggered: false, reason: "no_active_rounds" };
  } catch (error) {
    console.error(`[live-sync] Unexpected error syncing tournament ${tournamentId}:`, error);
    return {
      triggered: false,
      reason: "error",
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    activeSyncLocks.delete(tournamentId);
  }
}
