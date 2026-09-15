import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { after } from "next/server";
import { calculateLeagueStandings } from "@/lib/scoring";
import { triggerTournamentScoreSync } from "@/lib/live-sync";
import { getGameweekStatus } from "@/lib/fpl";
import { getTournamentBannerOrDefault } from "@/lib/tournament-banners";
import { Header } from "@/components/navigation/header";
import { Footer } from "@/components/layout/footer";
import {
  MatchDetailView,
  MatchTeamDetail,
  SisterMatchSummary,
  TournamentStandingSnapshot,
} from "@/components/matches/match-detail-view";

export async function generateMetadata(
  props: PageProps<"/matches/[id]">
): Promise<Metadata> {
  const { id } = await props.params;
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      homeGroup: true,
      awayGroup: true,
      round: { include: { tournament: true } },
    },
  });
  if (!match) return { title: "Match" };

  const home = match.homeGroup?.name || "TBD";
  const away = match.awayGroup?.name || "TBD";
  return {
    title: `${home} vs ${away} — ${match.round.tournament.name}`,
    description: `Match ${match.matchNumber}: ${home} vs ${away} in ${
      match.round.name || `Round ${match.round.roundNumber}`
    }.`,
  };
}

export default async function MatchPage(
  props: PageProps<"/matches/[id]">
) {
  const { id } = await props.params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      round: {
        include: {
          tournament: true,
          matches: {
            include: {
              homeGroup: true,
              awayGroup: true,
            },
            orderBy: { matchNumber: "asc" },
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
        orderBy: [
          { isExcluded: "asc" },
          { gameweekPoints: "desc" },
        ],
      },
    },
  });

  if (!match) {
    notFound();
  }

  const tournament = match.round.tournament;

  // Block access to draft tournaments
  if (tournament.status === "DRAFT") {
    notFound();
  }

  // Automated background live score synchronization with 5-minute cooldown (non-blocking)
  after(async () => {
    try {
      await triggerTournamentScoreSync(tournament.id);
    } catch (err) {
      console.error(`[live-sync] Background sync error for match ${match.id}:`, err);
    }
  });

  // Calculate live tournament standings for context
  const rawStandings = await calculateLeagueStandings(tournament.id);

  const bannerSrc = getTournamentBannerOrDefault(
    tournament.banner,
    tournament.id
  );

  // Mapped scores for Home squad
  const homeScores = match.scores
    .filter((s) => s.member.groupId === match.homeGroupId)
    .map((s) => ({
      id: s.id,
      memberId: s.memberId,
      fplName: s.member.fplName,
      fplTeamName: s.member.fplTeamName,
      fplId: s.member.fplId,
      gameweekPoints: s.gameweekPoints,
      rawPoints: s.gameweekPoints + s.chipDeduction,
      isExcluded: s.isExcluded,
      activeChip: s.activeChip,
      chipDeduction: s.chipDeduction,
    }));

  // Mapped scores for Away squad
  const awayScores = match.scores
    .filter((s) => s.member.groupId === match.awayGroupId)
    .map((s) => ({
      id: s.id,
      memberId: s.memberId,
      fplName: s.member.fplName,
      fplTeamName: s.member.fplTeamName,
      fplId: s.member.fplId,
      gameweekPoints: s.gameweekPoints,
      rawPoints: s.gameweekPoints + s.chipDeduction,
      isExcluded: s.isExcluded,
      activeChip: s.activeChip,
      chipDeduction: s.chipDeduction,
    }));

  const homeStanding = rawStandings.find(
    (s) => s.groupId === match.homeGroupId
  );
  const awayStanding = rawStandings.find(
    (s) => s.groupId === match.awayGroupId
  );

  const homeTeam: MatchTeamDetail = {
    id: match.homeGroupId || "",
    name: match.homeGroup?.name || "TBD",
    logo: match.homeGroup?.logo || null,
    score: match.homeScore,
    isWinner: match.result === "HOME_WIN",
    isDraw: match.result === "DRAW",
    members: homeScores,
    rank: homeStanding?.rank,
    leaguePoints: homeStanding?.leaguePoints,
  };

  const awayTeam: MatchTeamDetail = {
    id: match.awayGroupId || "",
    name: match.awayGroup?.name || "TBD",
    logo: match.awayGroup?.logo || null,
    score: match.awayScore,
    isWinner: match.result === "AWAY_WIN",
    isDraw: match.result === "DRAW",
    members: awayScores,
    rank: awayStanding?.rank,
    leaguePoints: awayStanding?.leaguePoints,
  };

  // Check if round's gameweek is finished: if so, live styling should disappear
  let resolvedStatus = match.status;
  try {
    const gwStatus = await getGameweekStatus(match.round.gameweek);
    if (gwStatus.isFinished || gwStatus.status === "FINISHED") {
      if (match.status === "IN_PROGRESS" || match.status === "LIVE") {
        resolvedStatus = "COMPLETED";
      }
      // Auto-heal any obsolete in-progress matches in this finished round
      prisma.match.updateMany({
        where: {
          roundId: match.round.id,
          status: { in: ["IN_PROGRESS", "LIVE"] },
        },
        data: { status: "COMPLETED" },
      }).catch(() => {});
    }
  } catch {
    // Ignore fallback
  }

  // Sister matches in the same round
  const isRoundFinished = resolvedStatus === "COMPLETED" || resolvedStatus === "FINALIZED";
  const sisterMatches: SisterMatchSummary[] = match.round.matches.map((m) => {
    let smStatus = m.status;
    if (isRoundFinished && (m.status === "IN_PROGRESS" || m.status === "LIVE")) {
      smStatus = "COMPLETED";
    }
    return {
      id: m.id,
      matchNumber: m.matchNumber,
      status: smStatus,
      homeName: m.homeGroup?.name || "TBD",
      homeLogo: m.homeGroup?.logo || null,
      homeScore: m.homeScore,
      awayName: m.awayGroup?.name || "TBD",
      awayLogo: m.awayGroup?.logo || null,
      awayScore: m.awayScore,
      isCurrent: m.id === match.id,
    };
  });

  // Standings snapshot
  const standingsSnapshot: TournamentStandingSnapshot[] = rawStandings.map(
    (s) => ({
      rank: s.rank,
      groupId: s.groupId,
      groupName: s.groupName,
      logo: s.logo || null,
      played: s.played,
      won: s.won,
      drawn: s.drawn,
      lost: s.lost,
      pointsFor: s.pointsFor,
      pointsAgainst: s.pointsAgainst,
      pointsDiff: s.pointsDiff,
      leaguePoints: s.leaguePoints,
      form: s.form,
      isHome: s.groupId === match.homeGroupId,
      isAway: s.groupId === match.awayGroupId,
    })
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#1F1F1F]">
      {/* Global Shared Header — Untouched */}
      <Header />

      {/* Redesigned Match Presentation */}
      <main className="flex-1">
        <MatchDetailView
          match={{
            id: match.id,
            matchNumber: match.matchNumber,
            status: resolvedStatus,
            result: match.result,
            roundNumber: match.round.roundNumber,
            roundName: match.round.name || `Round ${match.round.roundNumber}`,
            gameweek: match.round.gameweek,
            homeTeam,
            awayTeam,
          }}
          tournament={{
            id: tournament.id,
            name: tournament.name,
            season: tournament.season,
            seasonDisplay: `${tournament.season}/${Number(tournament.season) + 1}`,
            bannerSrc,
            allowBenchBoost: tournament.allowBenchBoost,
            allowTripleCaptain: tournament.allowTripleCaptain,
          }}
          sisterMatches={sisterMatches}
          standings={standingsSnapshot}
        />
      </main>

      {/* Global Shared Footer */}
      <Footer />
    </div>
  );
}
