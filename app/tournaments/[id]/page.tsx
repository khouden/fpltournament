import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { after } from "next/server";
import { calculateLeagueStandings, checkTournamentLiveStatus } from "@/lib/scoring";
import { triggerTournamentScoreSync } from "@/lib/live-sync";
import { getTournamentBannerOrDefault } from "@/lib/tournament-banners";
import { Header } from "@/components/navigation/header";
import { Footer } from "@/components/layout/footer";
import {
  TournamentDetailView,
  TeamStandingItem,
  RoundItem,
  TeamDirectoryItem,
} from "@/components/tournaments/tournament-detail-view";

export async function generateMetadata(
  props: PageProps<"/tournaments/[id]">
): Promise<Metadata> {
  const { id } = await props.params;
  const t = await prisma.tournament.findUnique({ where: { id } });
  return {
    title: t ? `${t.name} — League Standings & Fixtures` : "League Tournament",
    description: t
      ? `View live standings, gameweek fixtures, and head-to-head match results for ${t.name}.`
      : "",
  };
}

export default async function TournamentPage(
  props: PageProps<"/tournaments/[id]">
) {
  const { id } = await props.params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      admins: true,
      groups: {
        include: { members: true },
        orderBy: { name: "asc" },
      },
      rounds: {
        include: {
          matches: {
            include: {
              homeGroup: true,
              awayGroup: true,
              scores: {
                include: {
                  member: true,
                },
                orderBy: [
                  { isExcluded: "asc" },
                  { gameweekPoints: "desc" },
                ],
              },
            },
            orderBy: { matchNumber: "asc" },
          },
        },
        orderBy: { roundNumber: "asc" },
      },
    },
  });

  if (!tournament || tournament.status === "DRAFT") {
    notFound();
  }

  // Automated background live score synchronization with 5-minute cooldown (non-blocking)
  after(async () => {
    try {
      await triggerTournamentScoreSync(tournament.id);
    } catch (err) {
      console.error(`[live-sync] Background sync error for tournament ${tournament.id}:`, err);
    }
  });

  const searchParams = await props.searchParams;
  const initialTab =
    (searchParams?.tab as "overview" | "standings" | "fixtures" | "teams") ||
    "overview";

  // Calculate live tournament status (round matches not completed yet / FPL gameweek live)
  const liveInfo = await checkTournamentLiveStatus(tournament.rounds);

  // Calculate live league standings (+3 Win, +1 Draw, 0 Loss)
  const standings = await calculateLeagueStandings(tournament.id);

  // Helper to resolve group details for a match
  const resolveGroup = (
    match: (typeof tournament.rounds)[0]["matches"][0],
    side: "home" | "away"
  ): { name: string; logo: string | null } => {
    const group = side === "home" ? match.homeGroup : match.awayGroup;
    if (group) return { name: group.name, logo: group.logo || null };

    const groupId = side === "home" ? match.homeGroupId : match.awayGroupId;
    if (groupId) {
      const found = tournament.groups.find((g) => g.id === groupId);
      if (found) return { name: found.name, logo: found.logo || null };
    }

    return { name: "TBD", logo: null };
  };

  // Map member ID -> array of non-excluded score objects
  const memberScoresMap = new Map<
    string,
    Array<{ points: number; gameweek: number }>
  >();
  for (const round of tournament.rounds) {
    for (const match of round.matches) {
      for (const score of match.scores) {
        if (!score.isExcluded) {
          if (!memberScoresMap.has(score.member.id)) {
            memberScoresMap.set(score.member.id, []);
          }
          memberScoresMap.get(score.member.id)!.push({
            points: score.gameweekPoints,
            gameweek: round.gameweek,
          });
        }
      }
    }
  }

  // Standings lookup map
  const standingsMap = new Map<string, (typeof standings)[0]>();
  for (const s of standings) {
    standingsMap.set(s.groupId, s);
  }

  // Calculate Top Player for each group (highest non-admin points earner)
  const groupTopPlayerMap = new Map<
    string,
    { name: string; points: number; teamName: string | null; fplId: number }
  >();

  for (const g of tournament.groups) {
    const activeMembers = g.members.filter(
      (m) =>
        !m.isAdmin &&
        m.fplId !== tournament.adminFplId &&
        !tournament.admins?.some((a) => a.fplId === m.fplId)
    );

    let bestMember: {
      name: string;
      points: number;
      teamName: string | null;
      fplId: number;
    } | null = null;
    let maxPoints = -1;

    for (const m of activeMembers) {
      const scores = memberScoresMap.get(m.id) || [];
      const totalPoints = scores.reduce((sum, s) => sum + s.points, 0);
      if (totalPoints > maxPoints) {
        maxPoints = totalPoints;
        bestMember = {
          name: m.fplName,
          points: totalPoints,
          teamName: m.fplTeamName,
          fplId: m.fplId,
        };
      }
    }

    if (!bestMember && activeMembers.length > 0) {
      bestMember = {
        name: activeMembers[0].fplName,
        points: 0,
        teamName: activeMembers[0].fplTeamName,
        fplId: activeMembers[0].fplId,
      };
    } else if (!bestMember && g.members.length > 0) {
      bestMember = {
        name: g.members[0].fplName,
        points: 0,
        teamName: g.members[0].fplTeamName,
        fplId: g.members[0].fplId,
      };
    }

    groupTopPlayerMap.set(
      g.id,
      bestMember || { name: "Top Player", points: 0, teamName: null, fplId: 0 }
    );
  }

  // Find latest played round to determine GW scores
  const latestPlayedRound = [...tournament.rounds]
    .reverse()
    .find((r) =>
      r.matches.some(
        (m) =>
          m.status === "COMPLETED" ||
          m.status === "FINALIZED" ||
          m.status === "IN_PROGRESS"
      )
    );

  const gwPointsMap = new Map<string, number>();
  if (latestPlayedRound) {
    for (const match of latestPlayedRound.matches) {
      if (match.homeGroupId && match.homeScore !== null) {
        gwPointsMap.set(match.homeGroupId, Math.round(match.homeScore));
      }
      if (match.awayGroupId && match.awayScore !== null) {
        gwPointsMap.set(match.awayGroupId, Math.round(match.awayScore));
      }
    }
  }

  // Formatted Standings
  const formattedStandings: TeamStandingItem[] = standings.map((s) => ({
    rank: s.rank,
    groupId: s.groupId,
    groupName: s.groupName,
    logo: s.logo || null,
    managerName: groupTopPlayerMap.get(s.groupId)?.name || "Top Player",
    topPlayerName: groupTopPlayerMap.get(s.groupId)?.name || "Top Player",
    gwPoints: gwPointsMap.get(s.groupId) || 0,
    totalPoints: s.pointsFor > 0 ? s.pointsFor : s.leaguePoints * 100,
    leaguePoints: s.leaguePoints,
    played: s.played,
    won: s.won,
    drawn: s.drawn,
    lost: s.lost,
    pointsFor: s.pointsFor,
    pointsAgainst: s.pointsAgainst,
    pointsDiff: s.pointsDiff,
    form: s.form,
  }));

  // Formatted Rounds with matches
  const formattedRounds: RoundItem[] = tournament.rounds.map((round) => {
    return {
      id: round.id,
      roundNumber: round.roundNumber,
      gameweek: round.gameweek,
      name: round.name || `Round ${round.roundNumber}`,
      dateLabel: `Gameweek ${round.gameweek} · Matchday`,
      matches: round.matches.map((match) => {
        const home = resolveGroup(match, "home");
        const away = resolveGroup(match, "away");
        return {
          id: match.id,
          matchNumber: match.matchNumber,
          status: match.status,
          result: match.result,
          homeGroupId: match.homeGroupId,
          awayGroupId: match.awayGroupId,
          homeTeam: {
            id: match.homeGroupId || "",
            name: home.name,
            logo: home.logo,
          },
          awayTeam: {
            id: match.awayGroupId || "",
            name: away.name,
            logo: away.logo,
          },
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          scores: match.scores.map((s) => ({
            id: s.id,
            gameweekPoints: s.gameweekPoints,
            isExcluded: s.isExcluded,
            activeChip: s.activeChip,
            chipDeduction: s.chipDeduction,
            member: {
              id: s.member.id,
              groupId: s.member.groupId,
              fplName: s.member.fplName,
              fplTeamName: s.member.fplTeamName,
              fplId: s.member.fplId,
              isAdmin: s.member.isAdmin,
            },
          })),
        };
      }),
    };
  });

  // Formatted Participating Teams with enriched roster & fixture history
  const formattedTeams: TeamDirectoryItem[] = tournament.groups.map((g) => {
    const topPlayerInfo = groupTopPlayerMap.get(g.id) || {
      name: "Top Player",
      points: 0,
      teamName: null,
      fplId: 0,
    };

    const standing = standingsMap.get(g.id);

    const activePlayerCount = g.members.filter(
      (m) =>
        !m.isAdmin &&
        m.fplId !== tournament.adminFplId &&
        !tournament.admins?.some((a) => a.fplId === m.fplId)
    ).length;

    // Detailed member roster with individual stats
    const enrichedMembers = g.members.map((m) => {
      const isExcludedAdmin =
        m.isAdmin ||
        m.fplId === tournament.adminFplId ||
        Boolean(tournament.admins?.some((a) => a.fplId === m.fplId));
      const scores = memberScoresMap.get(m.id) || [];
      const totalPoints = scores.reduce((sum, s) => sum + s.points, 0);
      const matchCount = scores.length;
      const highestPoints =
        scores.length > 0 ? Math.max(...scores.map((s) => s.points)) : 0;
      const averagePoints =
        matchCount > 0 ? Math.round((totalPoints / matchCount) * 10) / 10 : 0;

      return {
        id: m.id,
        fplName: m.fplName,
        fplTeamName: m.fplTeamName,
        fplId: m.fplId,
        isAdmin: isExcludedAdmin,
        totalPoints,
        matchCount,
        highestPoints,
        averagePoints,
        isTopPlayer: m.fplName === topPlayerInfo.name,
      };
    });

    // Fixtures for this team
    const teamFixtures = tournament.rounds.flatMap((round) => {
      return round.matches
        .filter((m) => m.homeGroupId === g.id || m.awayGroupId === g.id)
        .map((m) => {
          const isHome = m.homeGroupId === g.id;
          const opponent = isHome
            ? resolveGroup(m, "away")
            : resolveGroup(m, "home");
          const teamScore = isHome ? m.homeScore : m.awayScore;
          const opponentScore = isHome ? m.awayScore : m.homeScore;

          let matchResult: "WIN" | "DRAW" | "LOSS" | "SCHEDULED" = "SCHEDULED";
          if (m.status === "COMPLETED" || m.status === "FINALIZED") {
            if (teamScore !== null && opponentScore !== null) {
              if (teamScore > opponentScore) matchResult = "WIN";
              else if (teamScore < opponentScore) matchResult = "LOSS";
              else matchResult = "DRAW";
            }
          }

          return {
            id: m.id,
            roundNumber: round.roundNumber,
            roundName: round.name || `Round ${round.roundNumber}`,
            gameweek: round.gameweek,
            opponentName: opponent.name,
            opponentLogo: opponent.logo,
            isHome,
            teamScore: teamScore !== null ? Math.round(teamScore) : null,
            opponentScore:
              opponentScore !== null ? Math.round(opponentScore) : null,
            status: m.status,
            result: matchResult,
          };
        });
    });

    return {
      id: g.id,
      name: g.name,
      logo: g.logo,
      topPlayerName: topPlayerInfo.name,
      topPlayerPoints: topPlayerInfo.points,
      topPlayerTeamName: topPlayerInfo.teamName,
      topPlayerFplId: topPlayerInfo.fplId,
      managerName: topPlayerInfo.name,
      activePlayerCount:
        activePlayerCount > 0 ? activePlayerCount : g.members.length,
      rank: standing?.rank,
      played: standing?.played ?? 0,
      won: standing?.won ?? 0,
      drawn: standing?.drawn ?? 0,
      lost: standing?.lost ?? 0,
      pointsFor: standing?.pointsFor ?? 0,
      pointsAgainst: standing?.pointsAgainst ?? 0,
      pointsDiff: standing?.pointsDiff ?? 0,
      leaguePoints: standing?.leaguePoints ?? 0,
      form: standing?.form ?? [],
      members: enrichedMembers,
      fixtures: teamFixtures,
    };
  });

  // Tournament primary admin display name
  const adminName =
    tournament.admins.find((a) => a.isPrimary)?.name ||
    tournament.admins[0]?.name ||
    "Admin";

  const bannerSrc = getTournamentBannerOrDefault(
    tournament.banner,
    tournament.id
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#1F1F1F]">
      {/* Global Header — Preserved Exactly Without Modifications */}
      <Header />

      {/* Main Tournament Show Content */}
      <main className="flex-1">
        <TournamentDetailView
          initialTab={initialTab}
          tournament={{
            id: tournament.id,
            name: tournament.name,
            season: tournament.season,
            seasonDisplay: `${tournament.season}/${Number(tournament.season) + 1}`,
            status: tournament.status,
            isActive: tournament.status === "PUBLISHED",
            bannerSrc,
            allowBenchBoost: tournament.allowBenchBoost,
            allowTripleCaptain: tournament.allowTripleCaptain,
            description:
              "The ultimate tournament for elite managers. Are you ready to claim the crown?",
            adminName,
            startDate: `Aug 16, ${tournament.season}`,
            endDate: `May 23, ${Number(tournament.season) + 1}`,
            totalRounds: tournament.rounds.length,
            totalTeams: tournament.groups.length,
            leagueType: "Head-to-Head",
          }}
          standings={formattedStandings}
          rounds={formattedRounds}
          teams={formattedTeams}
          isLive={liveInfo.isLive}
          liveGameweek={liveInfo.liveGameweek}
          lastSyncedAt={tournament.lastScoreSyncAt ? tournament.lastScoreSyncAt.toISOString() : null}
        />
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
