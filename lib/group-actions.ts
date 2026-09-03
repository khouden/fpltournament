"use server";

import { prisma } from "@/lib/db";
import { getLeague, getManagerLeagues, verifyManagerInLeague } from "@/lib/fpl";
import { safeRevalidate } from "@/lib/safe-revalidate";
import { suggestLogoForTeamName } from "@/lib/team-logos";
import { requireAdminSession } from "@/lib/auth-server";

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

export interface TournamentAdminView {
  fplId: number;
  name: string | null;
  teamName: string | null;
  isPrimary: boolean;
}

export interface LeagueView {
  id: number;
  name: string;
  isAlreadyImported: boolean;
  isPrivate?: boolean;
  adminFplId?: number;
  adminName?: string | null;
}

/**
 * Fetch all available FPL classic leagues for all tournament admins
 */
export async function getAdminLeaguesForTournamentAction(
  tournamentId: string,
  filterAdminFplId?: number
) {
  try {
    await requireAdminSession();
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        admins: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
        groups: true,
      },
    });

    if (!tournament) {
      return { success: false, error: "Tournament not found" };
    }

    const allAdmins: TournamentAdminView[] =
      tournament.admins.length > 0
        ? tournament.admins.map((a) => ({
            fplId: a.fplId,
            name: a.name,
            teamName: a.teamName,
            isPrimary: a.isPrimary,
          }))
        : [
            {
              fplId: tournament.adminFplId,
              name: "Primary Admin",
              teamName: "Admin FC",
              isPrimary: true,
            },
          ];

    const targetAdmins = filterAdminFplId
      ? allAdmins.filter((a) => a.fplId === filterAdminFplId)
      : allAdmins;

    const existingLeagueIds = new Set(
      tournament.groups.map((g) => g.fplLeagueId).filter(Boolean)
    );

    // Fetch leagues for each admin
    const leagueMap = new Map<number, LeagueView>();

    for (const admin of targetAdmins) {
      try {
        const leagues = await getManagerLeagues(admin.fplId);
        for (const l of leagues) {
          if (!leagueMap.has(l.id)) {
            leagueMap.set(l.id, {
              ...l,
              isAlreadyImported: existingLeagueIds.has(l.id),
              isPrivate: l.league_type === "x",
              adminFplId: admin.fplId,
              adminName: admin.name || `Admin #${admin.fplId}`,
            });
          }
        }
      } catch (err) {
        console.error(`Failed to fetch leagues for admin ${admin.fplId}:`, err);
      }
    }

    // Sort private leagues first, then by name
    const sortedLeagues = Array.from(leagueMap.values()).sort((a, b) => {
      const aIsPrivate = a.isPrivate ? 0 : 1;
      const bIsPrivate = b.isPrivate ? 0 : 1;
      if (aIsPrivate !== bIsPrivate) return aIsPrivate - bIsPrivate;
      return a.name.localeCompare(b.name);
    });

    return {
      success: true,
      leagues: sortedLeagues,
      admins: allAdmins,
      adminFplId: tournament.adminFplId,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch admin leagues",
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
  logo?: string | null,
  importingAdminFplId?: number
) {
  try {
    await requireAdminSession();
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        admins: true,
        groups: true,
      },
    });

    if (!tournament) {
      return { success: false, error: "Tournament not found" };
    }

    if (tournament.status === "FINISHED") {
      return {
        success: false,
        error: "Cannot add groups to a finished tournament",
      };
    }

    // Collect all admin IDs configured for this tournament
    const tournamentAdminIds = Array.from(
      new Set([
        tournament.adminFplId,
        ...tournament.admins.map((a) => a.fplId),
      ])
    );

    // 1. Verify that at least one of the tournament admins is a verified member of the selected league
    let isValidAdmin = false;
    let verificationError = "Admin is not a verified member of this league";

    // If importingAdminFplId is specified, check it first
    const testAdminIds = importingAdminFplId
      ? [importingAdminFplId, ...tournamentAdminIds.filter((id) => id !== importingAdminFplId)]
      : tournamentAdminIds;

    for (const adminId of testAdminIds) {
      const verification = await verifyManagerInLeague(adminId, leagueId);
      if (verification.isValid) {
        isValidAdmin = true;
        break;
      } else if (verification.error) {
        verificationError = verification.error;
      }
    }

    if (!isValidAdmin) {
      return {
        success: false,
        error: verificationError,
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
      (g) =>
        g.fplLeagueId === leagueId ||
        g.name.toLowerCase() === groupName.toLowerCase()
    );
    if (existingGroup) {
      return {
        success: false,
        error: `Group "${groupName}" is already in this tournament`,
      };
    }

    // Determine logo (passed explicitly or auto-suggested)
    const finalLogo =
      logo !== undefined
        ? logo
        : suggestLogoForTeamName(groupName)?.path || null;

    // 4. Create Group & GroupMembers inside a transaction
    // Any tournament admin member in the squad is marked isAdmin: true
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
            isAdmin: tournamentAdminIds.includes(m.entry),
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
    await requireAdminSession();
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
    await requireAdminSession();
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
