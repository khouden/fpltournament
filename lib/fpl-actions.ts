"use server";

import {
  getManager,
  getLeague,
  verifyManagerInLeague,
  type FPLManager,
  type FPLLeague,
  type FPLLeagueEntry,
} from "@/lib/fpl";

export async function verifyFPLEntryAction(
  entryId: string
): Promise<{
  success: boolean;
  manager?: FPLManager;
  error?: string;
}> {
  try {
    const id = parseInt(entryId, 10);
    if (isNaN(id)) {
      return { success: false, error: "Invalid entry ID" };
    }

    const manager = await getManager(id);
    return { success: true, manager };
  } catch (error) {
    return {
      success: false,
      error: `Failed to verify entry: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function getManagerLeaguesAction(
  entryId: string
): Promise<{
  success: boolean;
  leagues?: (FPLLeague & { members: FPLLeagueEntry[] })[];
  error?: string;
}> {
  try {
    const id = parseInt(entryId, 10);
    if (isNaN(id)) {
      return { success: false, error: "Invalid entry ID" };
    }

    const manager = await getManager(id);
    const leaguesData = await getLeague(id as any);

    return {
      success: true,
      leagues: [leaguesData.league as any],
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch leagues: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function validateManagerInLeagueAction(
  entryId: string,
  leagueId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
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
    return {
      success: false,
      error: `Verification failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
