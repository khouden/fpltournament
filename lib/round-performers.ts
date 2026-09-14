export interface RoundMVPInfo {
  memberId: string;
  fplName: string;
  fplTeamName: string | null;
  fplId: number;
  gameweekPoints: number;
  activeChip: string | null;
  tournamentTeamId: string;
  tournamentTeamName: string;
  tournamentTeamLogo: string | null;
  matchId: string;
  isLive: boolean;
  tiedWithCount?: number;
  tiedWithNames?: string[];
}

export interface RoundBestTeamInfo {
  teamId: string;
  teamName: string;
  teamLogo: string | null;
  score: number;
  matchId: string;
  opponentName: string;
  opponentLogo: string | null;
  opponentScore: number | null;
  matchResult: "WIN" | "DRAW" | "LOSS" | "LIVE" | "SCHEDULED";
  topContributorName?: string;
  topContributorPoints?: number;
  contributorCount: number;
  averagePoints: number;
  isLive: boolean;
  tiedWithCount?: number;
}

export interface RoundPerformersResult {
  roundId: string;
  roundNumber: number;
  gameweek: number;
  roundName: string;
  status: "COMPLETED" | "LIVE" | "SCHEDULED";
  isLive: boolean;
  hasScores: boolean;
  mvp: RoundMVPInfo | null;
  bestTeam: RoundBestTeamInfo | null;
}

export interface MatchMemberScoreInput {
  id: string;
  gameweekPoints: number;
  isExcluded: boolean;
  activeChip: string | null;
  chipDeduction?: number;
  member: {
    id: string;
    groupId: string;
    fplName: string;
    fplTeamName: string | null;
    fplId: number;
    isAdmin?: boolean;
  };
}

export interface MatchItemInput {
  id: string;
  matchNumber: number;
  status: string;
  result?: string | null;
  homeGroupId: string | null;
  awayGroupId: string | null;
  homeTeam: { id: string; name: string; logo: string | null };
  awayTeam: { id: string; name: string; logo: string | null };
  homeScore: number | null;
  awayScore: number | null;
  scores: MatchMemberScoreInput[];
}

export interface RoundItemInput {
  id: string;
  roundNumber: number;
  gameweek: number;
  name?: string | null;
  matches: MatchItemInput[];
}

/**
 * Calculates the MVP (highest scoring player) and Best Team (highest scoring team) for a tournament round.
 */
export function calculateRoundPerformers(round: RoundItemInput): RoundPerformersResult {
  const roundName = round.name || `Round ${round.roundNumber}`;

  if (!round.matches || round.matches.length === 0) {
    return {
      roundId: round.id,
      roundNumber: round.roundNumber,
      gameweek: round.gameweek,
      roundName,
      status: "SCHEDULED",
      isLive: false,
      hasScores: false,
      mvp: null,
      bestTeam: null,
    };
  }

  // Determine overall round status
  const hasLiveMatch = round.matches.some(
    (m) => m.status === "IN_PROGRESS" || m.status === "LIVE"
  );
  const allCompleted = round.matches.every(
    (m) => m.status === "COMPLETED" || m.status === "FINALIZED"
  );
  const anyCompleted = round.matches.some(
    (m) => m.status === "COMPLETED" || m.status === "FINALIZED"
  );

  let status: "COMPLETED" | "LIVE" | "SCHEDULED" = "SCHEDULED";
  if (hasLiveMatch) {
    status = "LIVE";
  } else if (allCompleted) {
    status = "COMPLETED";
  } else if (anyCompleted) {
    status = "LIVE"; // partial round in progress
  }

  const isLive = status === "LIVE";

  // Collect all eligible individual player scores
  interface PlayerCandidate {
    memberId: string;
    fplName: string;
    fplTeamName: string | null;
    fplId: number;
    gameweekPoints: number;
    activeChip: string | null;
    tournamentTeamId: string;
    tournamentTeamName: string;
    tournamentTeamLogo: string | null;
    matchId: string;
  }

  const playerCandidates: PlayerCandidate[] = [];

  for (const match of round.matches) {
    for (const score of match.scores) {
      if (score.isExcluded || score.member.isAdmin) continue;

      const isHome = score.member.groupId === match.homeGroupId;
      const team = isHome ? match.homeTeam : match.awayTeam;

      playerCandidates.push({
        memberId: score.member.id,
        fplName: score.member.fplName,
        fplTeamName: score.member.fplTeamName,
        fplId: score.member.fplId,
        gameweekPoints: score.gameweekPoints,
        activeChip: score.activeChip,
        tournamentTeamId: team.id,
        tournamentTeamName: team.name,
        tournamentTeamLogo: team.logo,
        matchId: match.id,
      });
    }
  }

  // Find top scoring player (MVP)
  let mvp: RoundMVPInfo | null = null;
  if (playerCandidates.length > 0) {
    playerCandidates.sort((a, b) => b.gameweekPoints - a.gameweekPoints);
    const topCandidate = playerCandidates[0];

    // Only set MVP if there is non-zero scoring or round has started
    if (topCandidate.gameweekPoints > 0 || isLive || allCompleted) {
      const topPoints = topCandidate.gameweekPoints;
      const tiedPlayers = playerCandidates.filter(
        (p) => p.gameweekPoints === topPoints && p.memberId !== topCandidate.memberId
      );

      mvp = {
        ...topCandidate,
        isLive,
        tiedWithCount: tiedPlayers.length,
        tiedWithNames: tiedPlayers.map((p) => p.fplName),
      };
    }
  }

  // Collect team scores for each participating team
  interface TeamCandidate {
    teamId: string;
    teamName: string;
    teamLogo: string | null;
    score: number;
    matchId: string;
    opponentName: string;
    opponentLogo: string | null;
    opponentScore: number | null;
    matchResult: "WIN" | "DRAW" | "LOSS" | "LIVE" | "SCHEDULED";
    contributingMembers: Array<{ name: string; points: number }>;
  }

  const teamCandidates: TeamCandidate[] = [];

  for (const match of round.matches) {
    const isMatchLive = match.status === "IN_PROGRESS" || match.status === "LIVE";
    const isMatchDone = match.status === "COMPLETED" || match.status === "FINALIZED";

    // Home Team
    if (match.homeGroupId && match.homeTeam) {
      const homeMembers = match.scores
        .filter((s) => s.member.groupId === match.homeGroupId && !s.isExcluded && !s.member.isAdmin)
        .map((s) => ({ name: s.member.fplName, points: s.gameweekPoints }));

      const computedScore =
        match.homeScore !== null
          ? Math.round(match.homeScore)
          : homeMembers.reduce((sum, m) => sum + m.points, 0);

      const awayScoreRounded =
        match.awayScore !== null ? Math.round(match.awayScore) : null;

      let result: "WIN" | "DRAW" | "LOSS" | "LIVE" | "SCHEDULED" = "SCHEDULED";
      if (isMatchLive) {
        result = "LIVE";
      } else if (isMatchDone && awayScoreRounded !== null) {
        if (computedScore > awayScoreRounded) result = "WIN";
        else if (computedScore < awayScoreRounded) result = "LOSS";
        else result = "DRAW";
      }

      if (computedScore > 0 || isMatchLive || isMatchDone) {
        teamCandidates.push({
          teamId: match.homeTeam.id,
          teamName: match.homeTeam.name,
          teamLogo: match.homeTeam.logo,
          score: computedScore,
          matchId: match.id,
          opponentName: match.awayTeam.name,
          opponentLogo: match.awayTeam.logo,
          opponentScore: awayScoreRounded,
          matchResult: result,
          contributingMembers: homeMembers,
        });
      }
    }

    // Away Team
    if (match.awayGroupId && match.awayTeam) {
      const awayMembers = match.scores
        .filter((s) => s.member.groupId === match.awayGroupId && !s.isExcluded && !s.member.isAdmin)
        .map((s) => ({ name: s.member.fplName, points: s.gameweekPoints }));

      const computedScore =
        match.awayScore !== null
          ? Math.round(match.awayScore)
          : awayMembers.reduce((sum, m) => sum + m.points, 0);

      const homeScoreRounded =
        match.homeScore !== null ? Math.round(match.homeScore) : null;

      let result: "WIN" | "DRAW" | "LOSS" | "LIVE" | "SCHEDULED" = "SCHEDULED";
      if (isMatchLive) {
        result = "LIVE";
      } else if (isMatchDone && homeScoreRounded !== null) {
        if (computedScore > homeScoreRounded) result = "WIN";
        else if (computedScore < homeScoreRounded) result = "LOSS";
        else result = "DRAW";
      }

      if (computedScore > 0 || isMatchLive || isMatchDone) {
        teamCandidates.push({
          teamId: match.awayTeam.id,
          teamName: match.awayTeam.name,
          teamLogo: match.awayTeam.logo,
          score: computedScore,
          matchId: match.id,
          opponentName: match.homeTeam.name,
          opponentLogo: match.homeTeam.logo,
          opponentScore: homeScoreRounded,
          matchResult: result,
          contributingMembers: awayMembers,
        });
      }
    }
  }

  // Find top team (Best Team in the round)
  let bestTeam: RoundBestTeamInfo | null = null;
  if (teamCandidates.length > 0) {
    teamCandidates.sort((a, b) => b.score - a.score);
    const topTeamCandidate = teamCandidates[0];

    const tiedTeams = teamCandidates.filter(
      (t) => t.score === topTeamCandidate.score && t.teamId !== topTeamCandidate.teamId
    );

    // Sort contributing members to find top individual performer in the team
    const sortedMembers = [...topTeamCandidate.contributingMembers].sort(
      (a, b) => b.points - a.points
    );
    const topContributor = sortedMembers[0];
    const memberCount = topTeamCandidate.contributingMembers.length;
    const averagePoints =
      memberCount > 0
        ? Math.round((topTeamCandidate.score / memberCount) * 10) / 10
        : 0;

    bestTeam = {
      teamId: topTeamCandidate.teamId,
      teamName: topTeamCandidate.teamName,
      teamLogo: topTeamCandidate.teamLogo,
      score: topTeamCandidate.score,
      matchId: topTeamCandidate.matchId,
      opponentName: topTeamCandidate.opponentName,
      opponentLogo: topTeamCandidate.opponentLogo,
      opponentScore: topTeamCandidate.opponentScore,
      matchResult: topTeamCandidate.matchResult,
      topContributorName: topContributor?.name,
      topContributorPoints: topContributor?.points,
      contributorCount: memberCount,
      averagePoints,
      isLive,
      tiedWithCount: tiedTeams.length,
    };
  }

  const hasScores = (mvp !== null && mvp.gameweekPoints > 0) || (bestTeam !== null && bestTeam.score > 0);

  return {
    roundId: round.id,
    roundNumber: round.roundNumber,
    gameweek: round.gameweek,
    roundName,
    status,
    isLive,
    hasScores,
    mvp,
    bestTeam,
  };
}
