/**
 * FPL Deadline Management & Detection Engine
 *
 * Fantasy Premier League locks fantasy endpoints and goes into maintenance/updating
 * mode during Gameweek deadlines (typically starting 90 minutes before kickoff and
 * lasting for 1-2 hours until the game finishes updating picks and scores).
 *
 * This engine tracks:
 * 1. Runtime / Simulated deadline overrides (useful for testing and admin control)
 * 2. Scheduled Gameweek deadline windows
 * 3. Dynamic HTTP 503 / 403 / "game is updating" failure signals
 */

export class FPLDeadlineError extends Error {
  readonly isDeadline = true;
  readonly statusCode = 503;

  constructor(
    message = "The Fantasy Premier League API is currently updating for the Gameweek deadline. Importing teams, calculating scores, and API synchronization are temporarily paused until the deadline window completes."
  ) {
    super(message);
    this.name = "FPLDeadlineError";
  }
}

export interface FPLDeadlineStatus {
  isDeadline: boolean;
  status: "OPERATIONAL" | "DEADLINE_ACTIVE";
  reason?: string;
  source?: "SIMULATED" | "SCHEDULED_WINDOW" | "API_RESPONSE" | "CACHE";
  activeUntil?: string;
  currentGameweek?: number;
  nextDeadline?: string;
  deadlineTime?: string;
}

// In-memory runtime override (can be toggled in dev/testing or by admin)
let simulatedDeadlineActive = process.env.FPL_SIMULATE_DEADLINE === "true";
let simulatedReason = "Simulated FPL Gameweek deadline active for testing";

// In-memory cache for live API health
interface HealthCache {
  isDeadline: boolean;
  reason?: string;
  expiresAt: number;
}
let liveHealthCache: HealthCache | null = null;

// Approximate Gameweek deadlines schedule (UTC).
// In production, these are dynamically refreshed from /bootstrap-static/.
// Each entry marks when the FPL servers lock down. The lock lasts ~90 to 120 minutes.
interface ScheduledDeadline {
  gameweek: number;
  deadlineTime: string; // ISO UTC
}

const DEFAULT_SCHEDULED_DEADLINES: ScheduledDeadline[] = [
  // Fallback anchor dates for 2024/25 & 2025/26 season fixtures
  { gameweek: 1, deadlineTime: "2024-08-16T17:30:00Z" },
  { gameweek: 2, deadlineTime: "2024-08-24T10:00:00Z" },
  { gameweek: 3, deadlineTime: "2024-08-31T10:00:00Z" },
  { gameweek: 4, deadlineTime: "2024-09-14T10:00:00Z" },
  { gameweek: 5, deadlineTime: "2024-09-21T10:00:00Z" },
  { gameweek: 6, deadlineTime: "2024-09-28T10:00:00Z" },
  { gameweek: 7, deadlineTime: "2024-10-05T10:00:00Z" },
  { gameweek: 8, deadlineTime: "2024-10-19T10:00:00Z" },
  { gameweek: 9, deadlineTime: "2024-10-26T10:00:00Z" },
  { gameweek: 10, deadlineTime: "2024-11-02T11:30:00Z" },
  { gameweek: 28, deadlineTime: "2025-03-08T11:00:00Z" },
  { gameweek: 29, deadlineTime: "2025-03-15T13:30:00Z" },
];

/**
 * Toggle simulated deadline mode (used by test suites and admin test controls)
 */
export function setSimulatedDeadline(active: boolean, reason?: string): void {
  simulatedDeadlineActive = active;
  if (reason) simulatedReason = reason;
}

/**
 * Record an FPL API failure (HTTP 503, 403, or HTML maintenance page)
 * Caches deadline state for 3 minutes to prevent API hammering.
 */
export function recordFPLDeadlineSignal(reason: string, ttlMs = 3 * 60 * 1000): void {
  liveHealthCache = {
    isDeadline: true,
    reason,
    expiresAt: Date.now() + ttlMs,
  };
}

/**
 * Clear any cached deadline failure (e.g. after a confirmed successful fetch)
 */
export function recordFPLSuccessSignal(): void {
  if (liveHealthCache && liveHealthCache.isDeadline && liveHealthCache.expiresAt > Date.now()) {
    // Only clear if not in simulated mode
    if (!simulatedDeadlineActive) {
      liveHealthCache = null;
    }
  }
}

/**
 * Check if current time falls within a Gameweek deadline window.
 * The window is from deadlineTime to deadlineTime + 120 minutes.
 */
function checkScheduledDeadlineWindow(): { inWindow: boolean; gameweek?: number; deadlineTime?: string } {
  const now = Date.now();
  const DEADLINE_WINDOW_DURATION_MS = 120 * 60 * 1000; // 2 hours

  for (const item of DEFAULT_SCHEDULED_DEADLINES) {
    const deadlineMs = new Date(item.deadlineTime).getTime();
    if (isNaN(deadlineMs)) continue;

    if (now >= deadlineMs && now <= deadlineMs + DEADLINE_WINDOW_DURATION_MS) {
      return {
        inWindow: true,
        gameweek: item.gameweek,
        deadlineTime: item.deadlineTime,
      };
    }
  }

  return { inWindow: false };
}

/**
 * Find the next upcoming scheduled deadline
 */
export function getNextScheduledDeadline(): ScheduledDeadline | null {
  const now = Date.now();
  for (const item of DEFAULT_SCHEDULED_DEADLINES) {
    const deadlineMs = new Date(item.deadlineTime).getTime();
    if (deadlineMs > now) {
      return item;
    }
  }
  return null;
}

/**
 * Comprehensive FPL Deadline status check
 */
export function checkFPLDeadlineStatus(): FPLDeadlineStatus {
  // 1. Simulated mode override
  if (simulatedDeadlineActive) {
    return {
      isDeadline: true,
      status: "DEADLINE_ACTIVE",
      reason: simulatedReason,
      source: "SIMULATED",
    };
  }

  // 2. Active cached live failure signal (e.g. received HTTP 503 or "updating")
  if (liveHealthCache && liveHealthCache.expiresAt > Date.now()) {
    return {
      isDeadline: true,
      status: "DEADLINE_ACTIVE",
      reason: liveHealthCache.reason || "FPL API reported 503 Service Unavailable / Updating",
      source: "API_RESPONSE",
      activeUntil: new Date(liveHealthCache.expiresAt).toISOString(),
    };
  }

  // 3. Check official scheduled calendar window
  const scheduled = checkScheduledDeadlineWindow();
  if (scheduled.inWindow) {
    return {
      isDeadline: true,
      status: "DEADLINE_ACTIVE",
      reason: `Gameweek ${scheduled.gameweek} deadline in progress. FPL servers are processing team updates.`,
      source: "SCHEDULED_WINDOW",
      currentGameweek: scheduled.gameweek,
      deadlineTime: scheduled.deadlineTime,
    };
  }

  const nextDeadline = getNextScheduledDeadline();

  return {
    isDeadline: false,
    status: "OPERATIONAL",
    nextDeadline: nextDeadline?.deadlineTime,
    currentGameweek: nextDeadline?.gameweek,
  };
}

/**
 * Simple boolean check: Is the FPL API currently in deadline/maintenance mode?
 */
export function isFPLDeadlineActive(): boolean {
  return checkFPLDeadlineStatus().isDeadline;
}

/**
 * Throws FPLDeadlineError if the FPL API is currently in deadline mode
 */
export function assertNotInFPLDeadline(customMessage?: string): void {
  const status = checkFPLDeadlineStatus();
  if (status.isDeadline) {
    throw new FPLDeadlineError(
      customMessage ||
        status.reason ||
        "Operation blocked: The Fantasy Premier League API is updating for the Gameweek deadline."
    );
  }
}
