import { prisma } from "@/lib/db";
import { getManagerGameweekPoints } from "@/lib/fpl";

export interface MemberScoreBreakdown {
  memberId: string;
  fplName: string;
  fplTeamName: string | null;
  fplId: number;
  gameweekPoints: number; // final counted points
  rawPoints: number; // raw FPL points before chip deductions
  isExcluded: boolean;
  activeChip?: string | null;
  chipDeduction: number;
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
 * CRITICAL BUSINESS RULES:
 * 1. The Admin FPL Entry ID must ALWAYS be excluded from scoring.
 * 2. If allowBenchBoost is false:
 *    - Bench Boost points_on_bench are excluded.
 * 3. If allowTripleCaptain is false:
 *    - Triple Captain is reduced to 2x (1x captain points deducted).
 */
export async function calculateGroupScore(
  groupId: string,
  gameweek: number,
  adminFplId: number,
  options: { allowBenchBoost?: boolean; allowTripleCaptain?: boolean } | boolean = true
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
    const scoreData = await getManagerGameweekPoints(
      member.fplId,
      gameweek,
      options
    );
    const countedPoints = scoreData.adjustedNetPoints;

    if (!isExcluded) {
      totalScore += countedPoints;
    }

    members.push({
      memberId: member.id,
      fplName: member.fplName,
      fplTeamName: member.fplTeamName,
      fplId: member.fplId,
      gameweekPoints: countedPoints,
      rawPoints: scoreData.points,
      isExcluded,
      activeChip: scoreData.activeChip || null,
      chipDeduction: scoreData.chipDeduction || 0,
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
      homeGroup: {
        include: { members: true },
      },
      awayGroup: {
        include: { members: true },
      },
      scores: {
        include: { member: true },
      },
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
                rawPoints: s.gameweekPoints + (s.chipDeduction || 0),
                isExcluded: s.isExcluded,
                activeChip: s.activeChip || null,
                chipDeduction: s.chipDeduction || 0,
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
                rawPoints: s.gameweekPoints + (s.chipDeduction || 0),
                isExcluded: s.isExcluded,
                activeChip: s.activeChip || null,
                chipDeduction: s.chipDeduction || 0,
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
  const chipOptions = {
    allowBenchBoost: match.round.tournament.allowBenchBoost ?? true,
    allowTripleCaptain: match.round.tournament.allowTripleCaptain ?? true,
  };
  const gameweek = match.round.gameweek;

  const homeResult = await calculateGroupScore(
    resolvedHomeGroupId,
    gameweek,
    adminFplId,
    chipOptions
  );

  const awayResult = await calculateGroupScore(
    resolvedAwayGroupId,
    gameweek,
    adminFplId,
    chipOptions
  );

  // Determine Match Result
  const result = determineMatchResult(
    homeResult.totalScore,
    awayResult.totalScore
  );
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
          activeChip: m.activeChip || null,
          chipDeduction: m.chipDeduction || 0,
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
          activeChip: m.activeChip || null,
          chipDeduction: m.chipDeduction || 0,
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

export interface GroupStanding {
  rank: number;
  groupId: string;
  groupName: string;
  fplLeagueId: number | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsDiff: number;
  leaguePoints: number; // won * 3 + drawn * 1
  form: ("W" | "D" | "L")[];
}

/**
 * Calculate live Head-to-Head League Standings for a tournament.
 * Standard football league rules:
 * - Win: +3 PTS
 * - Draw: +1 PT
 * - Loss: 0 PTS
 * Tiebreakers:
 * 1. PTS (leaguePoints)
 * 2. Diff (pointsDiff = pointsFor - pointsAgainst)
 * 3. PF (pointsFor)
 * 4. Group Name (alphabetical)
 */
export async function calculateLeagueStandings(
  tournamentId: string
): Promise<GroupStanding[]> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      groups: true,
      rounds: {
        include: {
          matches: {
            include: {
              homeGroup: true,
              awayGroup: true,
            },
            orderBy: { matchNumber: "asc" },
          },
        },
        orderBy: { roundNumber: "asc" },
      },
    },
  });

  if (!tournament) {
    throw new Error(`Tournament ${tournamentId} not found`);
  }

  // Initialize standings map for every group in the tournament
  const map = new Map<
    string,
    {
      groupId: string;
      groupName: string;
      fplLeagueId: number | null;
      played: number;
      won: number;
      drawn: number;
      lost: number;
      pointsFor: number;
      pointsAgainst: number;
      pointsDiff: number;
      leaguePoints: number;
      form: ("W" | "D" | "L")[];
    }
  >();

  for (const group of tournament.groups) {
    map.set(group.id, {
      groupId: group.id,
      groupName: group.name,
      fplLeagueId: group.fplLeagueId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointsDiff: 0,
      leaguePoints: 0,
      form: [],
    });
  }

  // Iterate chronologically through all completed or finalized matches
  for (const round of tournament.rounds) {
    for (const match of round.matches) {
      if (
        (match.status === "COMPLETED" || match.status === "FINALIZED") &&
        match.homeGroupId &&
        match.awayGroupId &&
        match.homeScore !== null &&
        match.awayScore !== null
      ) {
        const home = map.get(match.homeGroupId);
        const away = map.get(match.awayGroupId);

        if (home && away) {
          home.played += 1;
          away.played += 1;

          home.pointsFor += match.homeScore;
          home.pointsAgainst += match.awayScore;
          home.pointsDiff = home.pointsFor - home.pointsAgainst;

          away.pointsFor += match.awayScore;
          away.pointsAgainst += match.homeScore;
          away.pointsDiff = away.pointsFor - away.pointsAgainst;

          if (match.result === "HOME_WIN") {
            home.won += 1;
            home.leaguePoints += 3;
            home.form.push("W");

            away.lost += 1;
            away.form.push("L");
          } else if (match.result === "AWAY_WIN") {
            away.won += 1;
            away.leaguePoints += 3;
            away.form.push("W");

            home.lost += 1;
            home.form.push("L");
          } else if (match.result === "DRAW") {
            home.drawn += 1;
            home.leaguePoints += 1;
            home.form.push("D");

            away.drawn += 1;
            away.leaguePoints += 1;
            away.form.push("D");
          }
        }
      }
    }
  }

  // Convert map to array and sort by standard league tiebreakers
  const list = Array.from(map.values()).sort((a, b) => {
    // 1. Points
    if (b.leaguePoints !== a.leaguePoints) {
      return b.leaguePoints - a.leaguePoints;
    }
    // 2. Points Difference
    if (b.pointsDiff !== a.pointsDiff) {
      return b.pointsDiff - a.pointsDiff;
    }
    // 3. Points For
    if (b.pointsFor !== a.pointsFor) {
      return b.pointsFor - a.pointsFor;
    }
    // 4. Alphabetical by name
    return a.groupName.localeCompare(b.groupName);
  });

  return list.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}
