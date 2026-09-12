import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { calculateLeagueStandings } from "@/lib/scoring";
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

  // Map each group to its primary manager name
  const groupManagerMap = new Map<string, string>();
  for (const g of tournament.groups) {
    const manager =
      g.members.find((m) => !m.isAdmin && m.fplName)?.fplName ||
      g.members[0]?.fplName ||
      "Manager";
    groupManagerMap.set(g.id, manager);
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
    managerName: groupManagerMap.get(s.groupId) || "Manager",
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

  // Formatted Participating Teams
  const formattedTeams: TeamDirectoryItem[] = tournament.groups.map((g) => {
    const activePlayerCount = g.members.filter(
      (m) =>
        !m.isAdmin &&
        m.fplId !== tournament.adminFplId &&
        !tournament.admins?.some((a) => a.fplId === m.fplId)
    ).length;

    return {
      id: g.id,
      name: g.name,
      logo: g.logo,
      managerName: groupManagerMap.get(g.id) || "Manager",
      activePlayerCount:
        activePlayerCount > 0 ? activePlayerCount : g.members.length,
      members: g.members.map((m) => ({
        id: m.id,
        fplName: m.fplName,
        fplTeamName: m.fplTeamName,
        fplId: m.fplId,
        isAdmin: m.isAdmin,
      })),
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
        />
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
