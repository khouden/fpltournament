import { prisma } from "@/lib/db";
import { getManagerGameweekPoints } from "@/lib/fpl";

export interface MemberScoreBreakdown {
  memberId: string;
  fplName: string;
  fplTeamName: string | null;
  fplId: number;
  gameweekPoints: number;
  isExcluded: boolean;
}

export interface GroupScoreResult {
  groupId: string;
  groupName: string;
  totalScore: number;
  members: MemberScoreBreakdown[];
}

export interface MatchScoreResult {
  matchId: string;
  matchNumber: number;
  gameweek: number;
  homeGroup: GroupScoreResult | null;
  awayGroup: GroupScoreResult | null;
  homeScore: number | null;
  awayScore: number | null;
  result: "HOME_WIN" | "AWAY_WIN" | "DRAW" | null;
  winnerGroupId: string | null;
  status: string;
}

/**
 * Calculate a group's score for a given Gameweek.
 * CRITICAL BUSINESS RULE:
 * The Admin FPL Entry ID must ALWAYS be excluded from scoring.
 */
export async function calculateGroupScore(
  groupId: string,
  gameweek: number,
  adminFplId: number
): Promise<GroupScoreResult> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });

  if (!group) {
    throw new Error(`Group ${groupId} not found`);
  }

  let totalScore = 0;
  const members: MemberScoreBreakdown[] = [];

  for (const member of group.members) {
    const isExcluded = member.isAdmin || member.fplId === adminFplId;
    const scoreData = await getManagerGameweekPoints(member.fplId, gameweek);
    const points = scoreData.netPoints;

    if (!isExcluded) {
      totalScore += points;
    }

    members.push({
      memberId: member.id,
      fplName: member.fplName,
      fplTeamName: member.fplTeamName,
      fplId: member.fplId,
      gameweekPoints: points,
      isExcluded,
    });
  }

  return {
    groupId: group.id,
    groupName: group.name,
    totalScore,
    members,
  };
}

/**
 * Determine match result from scores
 */
export function determineMatchResult(
  homeScore: number,
  awayScore: number
): "HOME_WIN" | "AWAY_WIN" | "DRAW" {
  if (homeScore > awayScore) return "HOME_WIN";
  if (awayScore > homeScore) return "AWAY_WIN";
  return "DRAW";
}

/**
 * Calculate score and determine result for a single match.
 * Resolves winner references, persists MatchMemberScore, and respects FINALIZED status.
 */
export async function calculateMatchScore(
  matchId: string,
  forceRecalculate = false
): Promise<MatchScoreResult> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      round: {
        include: {
          tournament: true,
        },
      },
      homeGroup: { include: { members: true } },
      awayGroup: { include: { members: true } },
      scores: { include: { member: true } },
    },
  });

  if (!match) {
    throw new Error(`Match ${matchId} not found`);
  }

  // Preserve finalized matches unless forced
  if (match.status === "FINALIZED" && !forceRecalculate) {
    return {
      matchId: match.id,
      matchNumber: match.matchNumber,
      gameweek: match.round.gameweek,
      homeGroup: match.homeGroup
        ? {
            groupId: match.homeGroup.id,
            groupName: match.homeGroup.name,
            totalScore: match.homeScore || 0,
            members: match.scores
              .filter((s) => s.member.groupId === match.homeGroupId)
              .map((s) => ({
                memberId: s.memberId,
                fplName: s.member.fplName,
                fplTeamName: s.member.fplTeamName,
                fplId: s.member.fplId,
                gameweekPoints: s.gameweekPoints,
                isExcluded: s.isExcluded,
              })),
          }
        : null,
      awayGroup: match.awayGroup
        ? {
            groupId: match.awayGroup.id,
            groupName: match.awayGroup.name,
            totalScore: match.awayScore || 0,
            members: match.scores
              .filter((s) => s.member.groupId === match.awayGroupId)
              .map((s) => ({
                memberId: s.memberId,
                fplName: s.member.fplName,
                fplTeamName: s.member.fplTeamName,
                fplId: s.member.fplId,
                gameweekPoints: s.gameweekPoints,
                isExcluded: s.isExcluded,
              })),
          }
        : null,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      result: match.result as "HOME_WIN" | "AWAY_WIN" | "DRAW" | null,
      winnerGroupId: match.winnerId,
      status: match.status,
    };
  }

  let resolvedHomeGroupId = match.homeGroupId;
  let resolvedAwayGroupId = match.awayGroupId;

  // Resolve dynamic winner references if needed
  if (!resolvedHomeGroupId && match.homeWinnerOfMatchId) {
    const parentMatch = await prisma.match.findUnique({
      where: { id: match.homeWinnerOfMatchId },
    });
    if (parentMatch?.winnerId) {
      resolvedHomeGroupId = parentMatch.winnerId;
    }
  }

  if (!resolvedAwayGroupId && match.awayWinnerOfMatchId) {
    const parentMatch = await prisma.match.findUnique({
      where: { id: match.awayWinnerOfMatchId },
    });
    if (parentMatch?.winnerId) {
      resolvedAwayGroupId = parentMatch.winnerId;
    }
  }

  // If either participant is still unknown, we cannot calculate match score yet
  if (!resolvedHomeGroupId || !resolvedAwayGroupId) {
    await prisma.match.update({
      where: { id: match.id },
      data: {
        homeGroupId: resolvedHomeGroupId,
        awayGroupId: resolvedAwayGroupId,
      },
    });

    return {
      matchId: match.id,
      matchNumber: match.matchNumber,
      gameweek: match.round.gameweek,
      homeGroup: null,
      awayGroup: null,
      homeScore: null,
      awayScore: null,
      result: null,
      winnerGroupId: null,
      status: match.status,
    };
  }

  const adminFplId = match.round.tournament.adminFplId;
  const gameweek = match.round.gameweek;

  const homeResult = await calculateGroupScore(resolvedHomeGroupId, gameweek, adminFplId);
  const awayResult = await calculateGroupScore(resolvedAwayGroupId, gameweek, adminFplId);

  // Determine Match Result
  const result = determineMatchResult(homeResult.totalScore, awayResult.totalScore);
  const winnerId =
    result === "HOME_WIN"
      ? resolvedHomeGroupId
      : result === "AWAY_WIN"
        ? resolvedAwayGroupId
        : null;

  // Persist Member Scores in transaction
  await prisma.$transaction(async (tx) => {
    // Delete existing scores for this match
    await tx.matchMemberScore.deleteMany({
      where: { matchId: match.id },
    });

    // Insert home group member scores
    for (const m of homeResult.members) {
      await tx.matchMemberScore.create({
        data: {
          matchId: match.id,
          memberId: m.memberId,
          gameweekPoints: m.gameweekPoints,
          isExcluded: m.isExcluded,
          isFinal: match.status === "FINALIZED",
        },
      });
    }

    // Insert away group member scores
    for (const m of awayResult.members) {
      await tx.matchMemberScore.create({
        data: {
          matchId: match.id,
          memberId: m.memberId,
          gameweekPoints: m.gameweekPoints,
          isExcluded: m.isExcluded,
          isFinal: match.status === "FINALIZED",
        },
      });
    }

    // Update match record
    await tx.match.update({
      where: { id: match.id },
      data: {
        homeGroupId: resolvedHomeGroupId,
        awayGroupId: resolvedAwayGroupId,
        homeScore: homeResult.totalScore,
        awayScore: awayResult.totalScore,
        result,
        winnerId,
        status: match.status === "FINALIZED" ? "FINALIZED" : "COMPLETED",
      },
    });
  });

  return {
    matchId: match.id,
    matchNumber: match.matchNumber,
    gameweek,
    homeGroup: homeResult,
    awayGroup: awayResult,
    homeScore: homeResult.totalScore,
    awayScore: awayResult.totalScore,
    result,
    winnerGroupId: winnerId,
    status: match.status === "FINALIZED" ? "FINALIZED" : "COMPLETED",
  };
}

/**
 * Recalculate all rounds in chronological order for a tournament
 */
export async function recalculateTournamentScores(
  tournamentId: string,
  forceRecalculate = false
): Promise<MatchScoreResult[]> {
  const rounds = await prisma.round.findMany({
    where: { tournamentId },
    include: {
      matches: {
        orderBy: { matchNumber: "asc" },
      },
    },
    orderBy: { roundNumber: "asc" },
  });

  const results: MatchScoreResult[] = [];

  for (const round of rounds) {
    for (const match of round.matches) {
      const matchResult = await calculateMatchScore(match.id, forceRecalculate);
      results.push(matchResult);
    }
  }

  return results;
}
