"use server";

import { prisma } from "@/lib/db";
import {
  getLeague,
  getManagerLeagues,
  verifyManagerInLeague,
  isFPLDeadlineActive,
  FPLDeadlineError,
} from "@/lib/fpl";
import { safeRevalidate } from "@/lib/safe-revalidate";
import { suggestLogoForTeamName } from "@/lib/team-logos";
import { requireAdminSession } from "@/lib/auth-server";

export interface GroupMemberView {
  id: string;
  fplName: string;
  fplTeamName: string | null;
  fplId: number;
  isAdmin: boolean;
  isManual?: boolean;
}

export interface GroupView {
  id: string;
  name: string;
  logo: string | null;
  fplLeagueId: number | null;
  isManual?: boolean;
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

    if (isFPLDeadlineActive()) {
      return {
        success: false,
        error:
          "FPL leagues are temporarily unavailable: The Fantasy Premier League API is updating for the gameweek deadline.",
        isDeadline: true,
      };
    }
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
    const isDeadline =
      error instanceof FPLDeadlineError ||
      (error as { isDeadline?: boolean })?.isDeadline;
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch admin leagues",
      isDeadline: !!isDeadline,
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

    if (isFPLDeadlineActive()) {
      return {
        success: false,
        error:
          "Cannot import teams during an active FPL deadline. Fantasy Premier League endpoints are locked while the game is updating. Please try again after the deadline window.",
        isDeadline: true,
      };
    }

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

    return {
      success: true,
      group,
    };
  } catch (error) {
    const isDeadline =
      error instanceof FPLDeadlineError ||
      (error as { isDeadline?: boolean })?.isDeadline;
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to import group",
      isDeadline: !!isDeadline,
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

export interface DeleteGroupOptions {
  deleteSchedule?: boolean;
}

export interface DeleteGroupResult {
  success: boolean;
  error?: string;
  isScheduled?: boolean;
  matchesCount?: number;
  scheduleDeleted?: boolean;
}

/**
 * Delete a group from a tournament.
 * If the group is scheduled in matches and deleteSchedule is true, the tournament's
 * schedule (rounds, matches, and member scores) is also deleted.
 */
export async function deleteGroupAction(
  groupId: string,
  tournamentId: string,
  options?: DeleteGroupOptions
): Promise<DeleteGroupResult> {
  try {
    await requireAdminSession();

    // Check if group is referenced in matches
    const matchesCount = await prisma.match.count({
      where: {
        OR: [{ homeGroupId: groupId }, { awayGroupId: groupId }],
      },
    });

    if (matchesCount > 0 && !options?.deleteSchedule) {
      return {
        success: false,
        error:
          "Cannot delete group because it is scheduled in matches. Remove the matches first.",
        isScheduled: true,
        matchesCount,
      };
    }

    await prisma.$transaction(async (tx) => {
      if (options?.deleteSchedule) {
        // Find existing rounds for tournament
        const existingRounds = await tx.round.findMany({
          where: { tournamentId },
          select: { id: true },
        });
        const roundIds = existingRounds.map((r) => r.id);

        if (roundIds.length > 0) {
          // Delete match member scores first
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

        // If tournament was published, set status back to DRAFT since schedule is empty
        await tx.tournament.updateMany({
          where: { id: tournamentId, status: "PUBLISHED" },
          data: { status: "DRAFT" },
        });
      }

      await tx.group.delete({
        where: { id: groupId },
      });
    },
    { maxWait: 15000, timeout: 60000 }
    );

    safeRevalidate(`/admin/tournaments/${tournamentId}`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/groups`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/schedule`);
    safeRevalidate(`/tournaments/${tournamentId}`);

    return {
      success: true,
      scheduleDeleted: !!options?.deleteSchedule,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete group",
    };
  }
}

export interface CreateManualGroupInput {
  tournamentId: string;
  name: string;
  logo?: string | null;
  initialPlayers?: Array<{
    name: string;
    teamName?: string;
    isAdmin?: boolean;
    fplId?: number;
  }>;
}

/**
 * Create a custom/manual team without connecting to FPL API
 */
export async function createManualGroupAction(input: CreateManualGroupInput) {
  try {
    await requireAdminSession();
    const tournamentId = input.tournamentId;
    const name = input.name.trim();

    if (!name) {
      return { success: false, error: "Team name cannot be empty" };
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { groups: true, admins: true },
    });

    if (!tournament) {
      return { success: false, error: "Tournament not found" };
    }

    if (tournament.status === "FINISHED") {
      return {
        success: false,
        error: "Cannot add teams to a finished tournament",
      };
    }

    // Check duplicate name
    const existing = tournament.groups.find(
      (g) => g.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      return {
        success: false,
        error: `A team named "${name}" already exists in this tournament`,
      };
    }

    const tournamentAdminIds = Array.from(
      new Set([
        tournament.adminFplId,
        ...tournament.admins.map((a) => a.fplId),
      ])
    );

    const logo =
      input.logo !== undefined
        ? input.logo
        : suggestLogoForTeamName(name)?.path || null;

    const initialPlayers = input.initialPlayers || [];

    const group = await prisma.group.create({
      data: {
        tournamentId,
        name,
        logo,
        fplLeagueId: null,
        isManual: true,
        members: {
          create: initialPlayers.map((p, idx) => {
            const manualId = p.fplId && p.fplId > 0 ? p.fplId : -(idx + 1);
            return {
              fplName: p.name.trim(),
              fplTeamName: p.teamName?.trim() || null,
              fplId: manualId,
              isAdmin: Boolean(p.isAdmin || tournamentAdminIds.includes(manualId)),
              isManual: true,
            };
          }),
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
      error: error instanceof Error ? error.message : "Failed to create manual team",
    };
  }
}

export interface AddMemberInput {
  groupId: string;
  tournamentId: string;
  name: string;
  teamName?: string;
  isAdmin?: boolean;
  fplId?: number;
}

/**
 * Add a player to a group manually
 */
export async function addMemberToGroupAction(input: AddMemberInput) {
  try {
    await requireAdminSession();
    const { groupId, tournamentId, name, teamName, isAdmin } = input;
    const cleanName = name.trim();

    if (!cleanName) {
      return { success: false, error: "Player name cannot be empty" };
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: true,
        tournament: {
          include: { admins: true },
        },
      },
    });

    if (!group) {
      return { success: false, error: "Team not found" };
    }

    const tournamentAdminIds = Array.from(
      new Set([
        group.tournament.adminFplId,
        ...group.tournament.admins.map((a) => a.fplId),
      ])
    );

    // Compute a unique manual fplId if not provided or <= 0
    let finalFplId = input.fplId;
    if (!finalFplId || finalFplId <= 0) {
      const existingNegativeIds = group.members
        .map((m) => m.fplId)
        .filter((id) => id < 0);
      const minId = existingNegativeIds.length > 0 ? Math.min(...existingNegativeIds) : 0;
      finalFplId = minId - 1;
    } else {
      if (group.members.some((m) => m.fplId === finalFplId)) {
        return {
          success: false,
          error: `A member with ID ${finalFplId} already exists in this team`,
        };
      }
    }

    const isMemberAdmin = Boolean(isAdmin || tournamentAdminIds.includes(finalFplId));

    const member = await prisma.$transaction(async (tx) => {
      const created = await tx.groupMember.create({
        data: {
          groupId,
          fplName: cleanName,
          fplTeamName: teamName?.trim() || null,
          fplId: finalFplId,
          isAdmin: isMemberAdmin,
          isManual: true,
        },
      });

      // Find any matches where this group is home or away and populate default 0 scores
      const groupMatches = await tx.match.findMany({
        where: {
          OR: [{ homeGroupId: groupId }, { awayGroupId: groupId }],
        },
        select: { id: true, status: true },
      });

      if (groupMatches.length > 0) {
        await tx.matchMemberScore.createMany({
          data: groupMatches.map((m) => ({
            matchId: m.id,
            memberId: created.id,
            gameweekPoints: 0,
            isExcluded: isMemberAdmin,
            activeChip: null,
            chipDeduction: 0,
            isFinal: m.status === "FINALIZED",
          })),
        });
      }

      return created;
    },
    { maxWait: 15000, timeout: 60000 }
    );

    safeRevalidate(`/admin/tournaments/${tournamentId}`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/groups`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/schedule`);
    safeRevalidate(`/tournaments/${tournamentId}`);

    return { success: true, member };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add player",
    };
  }
}

export interface UpdateMemberInput {
  memberId: string;
  tournamentId: string;
  name?: string;
  teamName?: string | null;
  isAdmin?: boolean;
}

/**
 * Update a group member's details
 */
export async function updateGroupMemberAction(input: UpdateMemberInput) {
  try {
    await requireAdminSession();
    const { memberId, tournamentId, name, teamName, isAdmin } = input;

    const member = await prisma.groupMember.findUnique({
      where: { id: memberId },
    });
    if (!member) {
      return { success: false, error: "Player not found" };
    }

    const data: { fplName?: string; fplTeamName?: string | null; isAdmin?: boolean } = {};
    if (name !== undefined) {
      const clean = name.trim();
      if (!clean) return { success: false, error: "Player name cannot be empty" };
      data.fplName = clean;
    }
    if (teamName !== undefined) {
      data.fplTeamName = teamName ? teamName.trim() : null;
    }
    if (isAdmin !== undefined) {
      data.isAdmin = isAdmin;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.groupMember.update({
        where: { id: memberId },
        data,
      });

      if (isAdmin !== undefined) {
        await tx.matchMemberScore.updateMany({
          where: { memberId },
          data: { isExcluded: isAdmin },
        });
      }

      return res;
    },
    { maxWait: 15000, timeout: 60000 }
    );

    safeRevalidate(`/admin/tournaments/${tournamentId}`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/groups`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/schedule`);
    safeRevalidate(`/tournaments/${tournamentId}`);

    return { success: true, member: updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update player",
    };
  }
}

/**
 * Remove a player from a team
 */
export async function deleteGroupMemberAction(
  memberId: string,
  tournamentId: string
) {
  try {
    await requireAdminSession();

    await prisma.$transaction(async (tx) => {
      await tx.matchMemberScore.deleteMany({
        where: { memberId },
      });
      await tx.groupMember.delete({
        where: { id: memberId },
      });
    },
    { maxWait: 15000, timeout: 60000 }
    );

    safeRevalidate(`/admin/tournaments/${tournamentId}`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/groups`);
    safeRevalidate(`/admin/tournaments/${tournamentId}/schedule`);
    safeRevalidate(`/tournaments/${tournamentId}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete player",
    };
  }
}


