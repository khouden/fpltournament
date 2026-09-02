"use server";

import { prisma } from "@/lib/db";
import { getLeague, getManagerLeagues, verifyManagerInLeague } from "@/lib/fpl";
import { safeRevalidate } from "@/lib/safe-revalidate";
import { suggestLogoForTeamName } from "@/lib/team-logos";

export interface GroupMemberView {
  id: string;
  fplName: string;
  fplTeamName: string | null;
  fplId: number;
  isAdmin: boolean;
}

export interface GroupView {
  id: string;
  name: string;
  logo: string | null;
  fplLeagueId: number | null;
  tournamentId: string;
  members: GroupMemberView[];
}

/**
 * Fetch all available FPL classic leagues for the tournament's admin
 */
export async function getAdminLeaguesForTournamentAction(tournamentId: string) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { groups: true },
    });

    if (!tournament) {
      return { success: false, error: "Tournament not found" };
    }

    const leagues = await getManagerLeagues(tournament.adminFplId);
    const existingLeagueIds = new Set(
      tournament.groups.map((g) => g.fplLeagueId).filter(Boolean)
    );

    // Sort private leagues (league_type === 'x') first, then by name
    const sortedLeagues = [...leagues].sort((a, b) => {
      const aIsPrivate = a.league_type === "x" ? 0 : 1;
      const bIsPrivate = b.league_type === "x" ? 0 : 1;
      if (aIsPrivate !== bIsPrivate) return aIsPrivate - bIsPrivate;
      return a.name.localeCompare(b.name);
    });

    const mappedLeagues = sortedLeagues.map((l) => ({
      ...l,
      isAlreadyImported: existingLeagueIds.has(l.id),
      isPrivate: l.league_type === "x",
    }));

    return {
      success: true,
      leagues: mappedLeagues,
      adminFplId: tournament.adminFplId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch admin leagues",
    };
  }
}

/**
 * Import an FPL classic league as a tournament group with all its members
 */
export async function importLeagueAsGroupAction(
  tournamentId: string,
  leagueId: number,
  customName?: string,
  logo?: string | null
) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { groups: true },
    });

    if (!tournament) {
      return { success: false, error: "Tournament not found" };
    }

    if (tournament.status === "FINISHED") {
      return { success: false, error: "Cannot add groups to a finished tournament" };
    }

    // 1. Verify Admin is a member of the selected league
    const verification = await verifyManagerInLeague(tournament.adminFplId, leagueId);
    if (!verification.isValid) {
      return {
        success: false,
        error: verification.error || "Admin is not a verified member of this league",
      };
    }

    // 2. Fetch league info and member list
    const { league, standings } = await getLeague(leagueId);
    if (!standings || standings.length === 0) {
      return { success: false, error: "No members found in this FPL league" };
    }

    // 3. Determine Group display name
    const groupName = customName?.trim() || league.name.trim();

    // Check if group already exists in tournament
    const existingGroup = tournament.groups.find(
      (g) => g.fplLeagueId === leagueId || g.name.toLowerCase() === groupName.toLowerCase()
    );
    if (existingGroup) {
      return { success: false, error: `Group "${groupName}" is already in this tournament` };
    }

    // Determine logo (passed explicitly or auto-suggested)
    const finalLogo =
      logo !== undefined ? logo : (suggestLogoForTeamName(groupName)?.path || null);

    // 4. Create Group & GroupMembers inside a transaction
    const group = await prisma.group.create({
      data: {
        tournamentId: tournament.id,
        name: groupName,
        logo: finalLogo,
        fplLeagueId: leagueId,
        members: {
          create: standings.map((m) => ({
            fplName: m.player_name,
            fplTeamName: m.entry_name,
            fplId: m.entry,
            isAdmin: m.entry === tournament.adminFplId,
          })),
        },
      },
      include: {
        members: true,
      },
    });

    safeRevalidate(`/admin/tournaments/${tournamentId}`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/groups`);

    return { success: true, group };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to import group",
    };
  }
}

/**
 * Update an existing group's name and/or logo
 */
export async function updateGroupAction(
  groupId: string,
  tournamentId: string,
  data: { name?: string; logo?: string | null }
) {
  try {
    const updatePayload: { name?: string; logo?: string | null } = {};

    if (data.name !== undefined) {
      const trimmed = data.name.trim();
      if (!trimmed) {
        return { success: false, error: "Group name cannot be empty" };
      }
      updatePayload.name = trimmed;
    }

    if (data.logo !== undefined) {
      updatePayload.logo = data.logo;
    }

    const group = await prisma.group.update({
      where: { id: groupId },
      data: updatePayload,
    });

    safeRevalidate(`/admin/tournaments/${tournamentId}`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/groups`);

    return { success: true, group };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update group",
    };
  }
}

/**
 * Update an existing group's logo
 */
export async function updateGroupLogoAction(
  groupId: string,
  tournamentId: string,
  logo: string | null
) {
  return updateGroupAction(groupId, tournamentId, { logo });
}

/**
 * Rename an existing group
 */
export async function renameGroupAction(
  groupId: string,
  tournamentId: string,
  newName: string,
  logo?: string | null
) {
  return updateGroupAction(groupId, tournamentId, {
    name: newName,
    ...(logo !== undefined ? { logo } : {}),
  });
}

/**
 * Delete a group from a tournament
 */
export async function deleteGroupAction(groupId: string, tournamentId: string) {
  try {
    // Check if group is referenced in matches
    const matchesCount = await prisma.match.count({
      where: {
        OR: [{ homeGroupId: groupId }, { awayGroupId: groupId }],
      },
    });

    if (matchesCount > 0) {
      return {
        success: false,
        error: "Cannot delete group because it is scheduled in matches. Remove the matches first.",
      };
    }

    await prisma.group.delete({
      where: { id: groupId },
    });

    safeRevalidate(`/admin/tournaments/${tournamentId}`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/groups`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete group",
    };
  }
}
