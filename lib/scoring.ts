import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import {
  getManagerGameweekPoints,
  getGameweekStatus,
  isFPLDeadlineActive,
  FPLDeadlineError,
  hasMockPoints,
  type ManagerGameweekPointsOptions,
  clearFPLCache,
} from "@/lib/fpl";

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
  adminFplIds: number | number[],
  options: ManagerGameweekPointsOptions | boolean = true,
  matchId?: string
): Promise<GroupScoreResult> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });

  if (!group) {
    throw new Error(`Group ${groupId} not found`);
  }

  const excludedAdminIds = Array.isArray(adminFplIds)
    ? adminFplIds
    : [adminFplIds];

  // If group is MANUAL, bypass FPL API requests and deadline check completely
  if (group.isManual) {
    let totalScore = 0;
    const members: MemberScoreBreakdown[] = [];

    // Query existing scores for this match if matchId is provided
    let existingScores: Array<{
      memberId: string;
      gameweekPoints: number;
      activeChip: string | null;
      chipDeduction: number;
    }> = [];

    if (matchId) {
      existingScores = await prisma.matchMemberScore.findMany({
        where: {
          matchId,
          memberId: { in: group.members.map((m) => m.id) },
        },
        select: {
          memberId: true,
          gameweekPoints: true,
          activeChip: true,
          chipDeduction: true,
        },
      });
    }

    for (const member of group.members) {
      const isExcluded = member.isAdmin || excludedAdminIds.includes(member.fplId);
      const existing = existingScores.find((s) => s.memberId === member.id);
      // By default the scores will be zero
      const points = existing ? existing.gameweekPoints : 0;

      if (!isExcluded) {
        totalScore += points;
      }

      members.push({
        memberId: member.id,
        fplName: member.fplName,
        fplTeamName: member.fplTeamName,
        fplId: member.fplId,
        gameweekPoints: points,
        rawPoints: points + (existing?.chipDeduction || 0),
        isExcluded,
        activeChip: existing?.activeChip || null,
        chipDeduction: existing?.chipDeduction || 0,
      });
    }

    return {
      groupId: group.id,
      groupName: group.name,
      totalScore,
      members,
    };
  }

  if (isFPLDeadlineActive()) {
    throw new FPLDeadlineError(
      "Cannot calculate group score during an active FPL deadline. Fantasy Premier League points are updating."
    );
  }

  // Parallelize member score fetching for maximum performance and to avoid request timeouts
  const memberScores: MemberScoreBreakdown[] = await Promise.all(
    group.members.map(async (member) => {
      const isExcluded = member.isAdmin || excludedAdminIds.includes(member.fplId);
      const scoreData = await getManagerGameweekPoints(
        member.fplId,
        gameweek,
        options
      );
      const countedPoints = scoreData.adjustedNetPoints;

      return {
        memberId: member.id,
        fplName: member.fplName,
        fplTeamName: member.fplTeamName,
        fplId: member.fplId,
        gameweekPoints: countedPoints,
        rawPoints: scoreData.points,
        isExcluded,
        activeChip: scoreData.activeChip || null,
        chipDeduction: scoreData.chipDeduction || 0,
      };
    })
  );

  let totalScore = 0;
  for (const m of memberScores) {
    if (!m.isExcluded) {
      totalScore += m.gameweekPoints;
    }
  }

  return {
    groupId: group.id,
    groupName: group.name,
    totalScore,
    members: memberScores,
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
          tournament: {
            include: { admins: true },
          },
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

  const isAllManualMatch = Boolean(
    match.homeGroup?.isManual && match.awayGroup?.isManual
  );

  if (isFPLDeadlineActive() && !isAllManualMatch) {
    throw new FPLDeadlineError(
      "Cannot calculate match score during an active FPL deadline. Points are updating."
    );
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

  // Auto-resolve participant from previous winner if not yet resolved
  if (!resolvedHomeGroupId && match.homeWinnerOfMatchId) {
    const upstream = await prisma.match.findUnique({
      where: { id: match.homeWinnerOfMatchId },
      select: { winnerId: true },
    });
    if (upstream?.winnerId) {
      resolvedHomeGroupId = upstream.winnerId;
      await prisma.match.update({
        where: { id: match.id },
        data: { homeGroupId: resolvedHomeGroupId },
      });
    }
  }

  if (!resolvedAwayGroupId && match.awayWinnerOfMatchId) {
    const upstream = await prisma.match.findUnique({
      where: { id: match.awayWinnerOfMatchId },
      select: { winnerId: true },
    });
    if (upstream?.winnerId) {
      resolvedAwayGroupId = upstream.winnerId;
      await prisma.match.update({
        where: { id: match.id },
        data: { awayGroupId: resolvedAwayGroupId },
      });
    }
  }

  // If either participant is missing, we cannot calculate match score yet
  if (!resolvedHomeGroupId || !resolvedAwayGroupId) {
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

  const adminFplIds = Array.from(
    new Set([
      match.round.tournament.adminFplId,
      ...(match.round.tournament.admins?.map((a) => a.fplId) || []),
    ])
  );
  const chipOptions: ManagerGameweekPointsOptions = {
    allowBenchBoost: match.round.tournament.allowBenchBoost ?? true,
    allowTripleCaptain: match.round.tournament.allowTripleCaptain ?? true,
    bypassCache: forceRecalculate,
  };
  const gameweek = match.round.gameweek;
  const gwInfo = await getGameweekStatus(gameweek);

  // Check if all members in this match have mock test scores for this gameweek (e.g. Real Madrid vs Napoli in spec test)
  const homeMembers = match.homeGroup?.members || [];
  const awayMembers = match.awayGroup?.members || [];
  const allMembers = [...homeMembers, ...awayMembers];
  const isMockMatch =
    allMembers.length > 0 &&
    allMembers.every((m) => m.isAdmin || hasMockPoints(m.fplId, gameweek));

  const hasExistingScores = match.homeScore !== null && match.awayScore !== null;

  // If the Gameweek has NOT started yet (incoming matches / future rounds) and not mock and not manual with entered scores:
  if (gwInfo.status === "UPCOMING" && !isMockMatch && !isAllManualMatch && !hasExistingScores) {
    if (match.status !== "FINALIZED") {
      await prisma.match.update({
        where: { id: match.id },
        data: {
          homeGroupId: resolvedHomeGroupId,
          awayGroupId: resolvedAwayGroupId,
          status: "SCHEDULED",
        },
      });
    }

    return {
      matchId: match.id,
      matchNumber: match.matchNumber,
      gameweek,
      homeGroup: match.homeGroup
        ? {
            groupId: match.homeGroup.id,
            groupName: match.homeGroup.name,
            totalScore: 0,
            members: [],
          }
        : null,
      awayGroup: match.awayGroup
        ? {
            groupId: match.awayGroup.id,
            groupName: match.awayGroup.name,
            totalScore: 0,
            members: [],
          }
        : null,
      homeScore: null,
      awayScore: null,
      result: null,
      winnerGroupId: null,
      status: match.status === "FINALIZED" ? "FINALIZED" : "SCHEDULED",
    };
  }

  const homeResult = await calculateGroupScore(
    resolvedHomeGroupId,
    gameweek,
    adminFplIds,
    chipOptions,
    match.id
  );

  const awayResult = await calculateGroupScore(
    resolvedAwayGroupId,
    gameweek,
    adminFplIds,
    chipOptions,
    match.id
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

  // Determine target status: FINALIZED (if locked), IN_PROGRESS (if gameweek is live / not completed), or COMPLETED
  const isFinalized = match.status === "FINALIZED" && !forceRecalculate;
  const matchStatus = isFinalized
    ? "FINALIZED"
    : gwInfo.status === "LIVE"
      ? "IN_PROGRESS"
      : "COMPLETED";

  // Persist Member Scores and Match in atomic batch transaction (no interactive timeout)
  const allScoresData = [
    ...homeResult.members.map((m) => ({
      matchId: match.id,
      memberId: m.memberId,
      gameweekPoints: m.gameweekPoints,
      isExcluded: m.isExcluded,
      activeChip: m.activeChip || null,
      chipDeduction: m.chipDeduction || 0,
      isFinal: matchStatus === "FINALIZED",
    })),
    ...awayResult.members.map((m) => ({
      matchId: match.id,
      memberId: m.memberId,
      gameweekPoints: m.gameweekPoints,
      isExcluded: m.isExcluded,
      activeChip: m.activeChip || null,
      chipDeduction: m.chipDeduction || 0,
      isFinal: matchStatus === "FINALIZED",
    })),
  ];

  const txOperations: Prisma.PrismaPromise<unknown>[] = [
    prisma.matchMemberScore.deleteMany({
      where: { matchId: match.id },
    }),
  ];

  if (allScoresData.length > 0) {
    txOperations.push(
      prisma.matchMemberScore.createMany({
        data: allScoresData,
      })
    );
  }

  txOperations.push(
    prisma.match.update({
      where: { id: match.id },
      data: {
        homeGroupId: resolvedHomeGroupId,
        awayGroupId: resolvedAwayGroupId,
        homeScore: homeResult.totalScore,
        awayScore: awayResult.totalScore,
        result,
        winnerId,
        status: matchStatus,
      },
    })
  );

  await prisma.$transaction(txOperations);

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
    status: matchStatus,
  };
}

/**
 * Recalculate all rounds in chronological order for a tournament
 */
export async function recalculateTournamentScores(
  tournamentId: string,
  forceRecalculate = false
): Promise<MatchScoreResult[]> {
  if (isFPLDeadlineActive()) {
    throw new FPLDeadlineError(
      "Cannot recalculate tournament scores during an active FPL deadline. Please wait until the deadline window completes."
    );
  }

  if (forceRecalculate) {
    clearFPLCache();
  }

  const rounds = await prisma.round.findMany({
    where: { tournamentId },
    include: {
      matches: {
        orderBy: { matchNumber: "asc" },
        include: {
          homeGroup: { include: { members: true } },
          awayGroup: { include: { members: true } },
        },
      },
    },
    orderBy: { roundNumber: "asc" },
  });

  const results: MatchScoreResult[] = [];

  for (const round of rounds) {
    const gwInfo = await getGameweekStatus(round.gameweek);

    // Check if this round consists solely of mock demo matches with defined points
    const allRoundMatchesMock =
      round.matches.length > 0 &&
      round.matches.every((match) => {
        const homeMembers = match.homeGroup?.members || [];
        const awayMembers = match.awayGroup?.members || [];
        const allMembers = [...homeMembers, ...awayMembers];
        return (
          allMembers.length > 0 &&
          allMembers.every((m) => m.isAdmin || hasMockPoints(m.fplId, round.gameweek))
        );
      });

    const roundResults = await processRoundMatches(
      round,
      gwInfo.status,
      allRoundMatchesMock,
      forceRecalculate
    );
    results.push(...roundResults);
  }

  return results;
}

interface ScorableMatch {
  id: string;
  matchNumber: number;
  status: string;
  homeGroupId: string | null;
  awayGroupId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  result: string | null;
  winnerId: string | null;
  homeGroup?: { isManual?: boolean; members?: Array<{ isAdmin: boolean; fplId: number }> } | null;
  awayGroup?: { isManual?: boolean; members?: Array<{ isAdmin: boolean; fplId: number }> } | null;
}

interface ScorableRound {
  gameweek: number;
  matches: ScorableMatch[];
}

async function processRoundMatches(
  round: ScorableRound,
  gwStatus: string,
  allRoundMatchesMock: boolean,
  forceRecalculate: boolean
): Promise<MatchScoreResult[]> {
  const results: MatchScoreResult[] = [];

  // If this round's Gameweek has not started yet, keep matches scheduled / incoming
  // and skip making premature external API calls, but preserve matches with manual scores or all-manual
  if (gwStatus === "UPCOMING" && !allRoundMatchesMock) {
    for (const match of round.matches) {
      const isMatchAllManual = Boolean(match.homeGroup?.isManual && match.awayGroup?.isManual);
      const hasManualScores =
        (match.homeGroup?.isManual || match.awayGroup?.isManual) &&
        match.homeScore !== null &&
        match.awayScore !== null;

      if (isMatchAllManual || hasManualScores) {
        try {
          const matchResult = await calculateMatchScore(match.id, forceRecalculate);
          results.push(matchResult);
          continue;
        } catch (e) {
          console.warn(`Could not calculate manual match ${match.id}:`, e);
        }
      }

      if (match.status !== "FINALIZED") {
        await prisma.match.update({
          where: { id: match.id },
          data: { status: "SCHEDULED" },
        });
      }
      results.push({
        matchId: match.id,
        matchNumber: match.matchNumber,
        gameweek: round.gameweek,
        homeGroup: null,
        awayGroup: null,
        homeScore: null,
        awayScore: null,
        result: null,
        winnerGroupId: null,
        status: match.status === "FINALIZED" ? "FINALIZED" : "SCHEDULED",
      });
    }
    return results;
  }

  // For LIVE and FINISHED Gameweeks:
  // Process matches in chunks of 3 for optimal throughput and fast recalculation
  const chunkSize = 3;
  for (let i = 0; i < round.matches.length; i += chunkSize) {
    const chunk = round.matches.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map(async (match) => {
        try {
          return await calculateMatchScore(match.id, forceRecalculate);
        } catch (matchErr) {
          console.error(
            `Failed to calculate score for match ${match.id} (GW${round.gameweek}):`,
            matchErr
          );
          return {
            matchId: match.id,
            matchNumber: match.matchNumber,
            gameweek: round.gameweek,
            homeGroup: null,
            awayGroup: null,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            result: match.result as "HOME_WIN" | "AWAY_WIN" | "DRAW" | null,
            winnerGroupId: match.winnerId,
            status: match.status,
          };
        }
      })
    );
    results.push(...chunkResults);
  }

  return results;
}

/**
 * Recalculate all matches in a single round
 */
export async function recalculateRoundScores(
  roundId: string,
  forceRecalculate = false
): Promise<MatchScoreResult[]> {
  if (isFPLDeadlineActive()) {
    throw new FPLDeadlineError(
      "Cannot recalculate round scores during an active FPL deadline. Please wait until the deadline window completes."
    );
  }

  if (forceRecalculate) {
    clearFPLCache();
  }

  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: {
      matches: {
        orderBy: { matchNumber: "asc" },
        include: {
          homeGroup: { include: { members: true } },
          awayGroup: { include: { members: true } },
        },
      },
    },
  });

  if (!round) {
    throw new Error(`Round ${roundId} not found`);
  }

  const gwInfo = await getGameweekStatus(round.gameweek);
  const allRoundMatchesMock =
    round.matches.length > 0 &&
    round.matches.every((match) => {
      const homeMembers = match.homeGroup?.members || [];
      const awayMembers = match.awayGroup?.members || [];
      const allMembers = [...homeMembers, ...awayMembers];
      return (
        allMembers.length > 0 &&
        allMembers.every((m) => m.isAdmin || hasMockPoints(m.fplId, round.gameweek))
      );
    });

  return processRoundMatches(
    round,
    gwInfo.status,
    allRoundMatchesMock,
    forceRecalculate
  );
}

export interface GroupStanding {
  rank: number;
  groupId: string;
  groupName: string;
  logo?: string | null;
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

export interface StandingsMatchData {
  status: string;
  homeGroupId: string | null;
  awayGroupId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  result: string | null;
}

export interface StandingsRoundData {
  matches: StandingsMatchData[];
}

export interface StandingsGroupData {
  id: string;
  name: string;
  logo?: string | null;
  fplLeagueId?: number | null;
}

/**
 * Pure in-memory calculation of Head-to-Head league standings from pre-loaded groups and rounds.
 * Eliminates redundant database roundtrips when groups and rounds are already in memory.
 */
export function computeStandingsFromData(
  groups: StandingsGroupData[],
  rounds: StandingsRoundData[]
): GroupStanding[] {
  // Initialize standings map for every group in the tournament
  const map = new Map<
    string,
    {
      groupId: string;
      groupName: string;
      logo: string | null;
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

  for (const group of groups) {
    map.set(group.id, {
      groupId: group.id,
      groupName: group.name,
      logo: group.logo || null,
      fplLeagueId: group.fplLeagueId ?? null,
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

  // Iterate chronologically through all completed, finalized, and live/in-progress matches
  for (const round of rounds) {
    for (const match of round.matches) {
      if (
        (match.status === "COMPLETED" ||
          match.status === "FINALIZED" ||
          match.status === "IN_PROGRESS" ||
          match.status === "LIVE") &&
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

          const matchResult =
            match.result ||
            (match.homeScore > match.awayScore
              ? "HOME_WIN"
              : match.awayScore > match.homeScore
              ? "AWAY_WIN"
              : "DRAW");

          if (matchResult === "HOME_WIN") {
            home.won += 1;
            home.leaguePoints += 3;
            home.form.push("W");

            away.lost += 1;
            away.form.push("L");
          } else if (matchResult === "AWAY_WIN") {
            away.won += 1;
            away.leaguePoints += 3;
            away.form.push("W");

            home.lost += 1;
            home.form.push("L");
          } else if (matchResult === "DRAW") {
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

/**
 * Information describing whether a tournament currently has live matches or an active FPL round.
 */
export interface TournamentLiveInfo {
  isLive: boolean;
  liveRoundNumber?: number;
  liveGameweek?: number;
  liveRoundId?: string;
  liveMatchCount?: number;
}

/**
 * Evaluates whether a tournament is currently live:
 * 1. Has matches explicitly marked IN_PROGRESS or LIVE.
 * 2. Or the current round's Fantasy Premier League gameweek has started / is LIVE and matches are not yet all completed.
 */
export async function checkTournamentLiveStatus(
  rounds: Array<{
    id: string;
    roundNumber: number;
    gameweek: number;
    matches: Array<{ status: string }>;
  }>
): Promise<TournamentLiveInfo> {
  // 1. Check if any round currently has IN_PROGRESS or LIVE matches
  for (const round of rounds) {
    const liveMatches = round.matches.filter(
      (m) => m.status === "IN_PROGRESS" || m.status === "LIVE"
    );
    if (liveMatches.length > 0) {
      return {
        isLive: true,
        liveRoundNumber: round.roundNumber,
        liveGameweek: round.gameweek,
        liveRoundId: round.id,
        liveMatchCount: liveMatches.length,
      };
    }
  }

  // 2. Check if there is an active round where FPL matches are not completed yet
  // i.e., gameweek is LIVE in FPL and the round's matches are not all completed/finalized
  for (const round of rounds) {
    const allMatchesDone =
      round.matches.length > 0 &&
      round.matches.every(
        (m) => m.status === "COMPLETED" || m.status === "FINALIZED"
      );

    if (!allMatchesDone && round.matches.length > 0) {
      try {
        const gwStatus = await getGameweekStatus(round.gameweek);
        if (gwStatus.status === "LIVE") {
          return {
            isLive: true,
            liveRoundNumber: round.roundNumber,
            liveGameweek: round.gameweek,
            liveRoundId: round.id,
            liveMatchCount: round.matches.length,
          };
        }
      } catch {
        // Continue fallback
      }
    }
  }

  return { isLive: false };
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

  return computeStandingsFromData(tournament.groups, tournament.rounds);
}
