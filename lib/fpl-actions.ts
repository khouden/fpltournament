"use server";

import {
  getManager,
  getManagerLeagues,
  verifyManagerInLeague,
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
}> {
  try {
    await requireAdminSession();
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
  leagues?: FPLLeague[];
  error?: string;
}> {
  try {
    await requireAdminSession();
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
    await requireAdminSession();
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
