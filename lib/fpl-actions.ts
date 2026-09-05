"use server";

import {
  getManager,
  getManagerLeagues,
  verifyManagerInLeague,
  isFPLDeadlineActive,
  FPLDeadlineError,
  type FPLManager,
  type FPLLeague,
} from "@/lib/fpl";
import { requireAdminSession } from "@/lib/auth-server";

export async function verifyFPLEntryAction(
  entryId: string
): Promise<{
  success: boolean;
  manager?: FPLManager;
  error?: string;
  isDeadline?: boolean;
}> {
  try {
    await requireAdminSession();

    if (isFPLDeadlineActive()) {
      return {
        success: false,
        error:
          "Manager verification is paused during the FPL Gameweek deadline. Official FPL endpoints are temporarily updating.",
        isDeadline: true,
      };
    }

    const id = parseInt(entryId, 10);
    if (isNaN(id)) {
      return { success: false, error: "Invalid entry ID" };
    }

    const manager = await getManager(id);
    return { success: true, manager };
  } catch (error) {
    const isDeadline =
      error instanceof FPLDeadlineError ||
      (error as { isDeadline?: boolean })?.isDeadline;
    return {
      success: false,
      error: `Failed to verify entry: ${error instanceof Error ? error.message : String(error)}`,
      isDeadline: !!isDeadline,
    };
  }
}

export async function getManagerLeaguesAction(
  entryId: string
): Promise<{
  success: boolean;
  leagues?: FPLLeague[];
  error?: string;
  isDeadline?: boolean;
}> {
  try {
    await requireAdminSession();

    if (isFPLDeadlineActive()) {
      return {
        success: false,
        error:
          "FPL leagues cannot be retrieved during the Gameweek deadline. The Premier League game is updating.",
        isDeadline: true,
      };
    }

    const id = parseInt(entryId, 10);
    if (isNaN(id)) {
      return { success: false, error: "Invalid entry ID" };
    }

    const leagues = await getManagerLeagues(id);
    return {
      success: true,
      leagues,
    };
  } catch (error) {
    const isDeadline =
      error instanceof FPLDeadlineError ||
      (error as { isDeadline?: boolean })?.isDeadline;
    return {
      success: false,
      error: `Failed to fetch leagues: ${error instanceof Error ? error.message : String(error)}`,
      isDeadline: !!isDeadline,
    };
  }
}

export async function validateManagerInLeagueAction(
  entryId: string,
  leagueId: string
): Promise<{
  success: boolean;
  error?: string;
  isDeadline?: boolean;
}> {
  try {
    await requireAdminSession();

    if (isFPLDeadlineActive()) {
      return {
        success: false,
        error:
          "League membership validation is paused during the FPL Gameweek deadline.",
        isDeadline: true,
      };
    }

    const id = parseInt(entryId, 10);
    const lId = parseInt(leagueId, 10);

    if (isNaN(id) || isNaN(lId)) {
      return { success: false, error: "Invalid entry or league ID" };
    }

    const verification = await verifyManagerInLeague(id, lId);
    return {
      success: verification.isValid,
      error: verification.error,
    };
  } catch (error) {
    const isDeadline =
      error instanceof FPLDeadlineError ||
      (error as { isDeadline?: boolean })?.isDeadline;
    return {
      success: false,
      error: `Verification failed: ${error instanceof Error ? error.message : String(error)}`,
      isDeadline: !!isDeadline,
    };
  }
}
