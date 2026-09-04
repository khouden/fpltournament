import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { LeagueTable } from "@/components/league-table";
import { calculateLeagueStandings } from "@/lib/scoring";
import { MatchSquadList } from "@/components/match-squad-client";
import { Header } from "@/components/navigation/header";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import {
  Trophy,
  Calendar,
  Users,
  ArrowLeft,
  ArrowRight,
  Armchair,
  Crown,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  const isActive = tournament.status === "PUBLISHED";

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F7] text-[#1F1F1F]">
      {/* Sticky Global FPL Header */}
      <Header />

      <main className="flex-1 pb-16 sm:pb-24">
        {/* Tournament Identity Hero Header */}
        <section className="relative overflow-hidden bg-white border-b border-[#E5E5E5] py-8 sm:py-12">
          {/* Decorative FPL background glows & geometry */}
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#00FF87]/10 blur-3xl pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-[#37003C]/5 blur-3xl pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute right-8 bottom-0 select-none pointer-events-none text-8xl lg:text-9xl font-black text-[#37003C]/[0.025] tracking-tighter uppercase leading-none hidden md:block"
          >
            FPL
          </div>

          <Container className="relative z-10">
            {/* Top Navigation Row: Back Action */}
            <div className="mb-4 sm:mb-6">
              <Link
                href="/tournaments"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#37003C] hover:text-[#5A0A63] transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                <span>ALL TOURNAMENTS</span>
              </Link>
            </div>

            {/* Tournament Identity Block */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3.5 max-w-3xl">
                {/* Eyebrow Trophy Pill */}
                <div className="inline-flex items-center gap-2 rounded-[8px] border border-[#37003C]/15 bg-[#37003C]/5 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#37003C]">
                  <Trophy className="h-3.5 w-3.5 text-[#37003C]" />
                  <span>COMPETITION DASHBOARD</span>
                </div>

                {/* Tournament Title */}
                <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-[#37003C] leading-[1.08] break-words">
                  {tournament.name}
                </h1>

                {/* Tournament Metadata Badges */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {/* Season Badge */}
                  <span className="inline-flex items-center gap-1 rounded-[8px] border border-[#E5E5E5] bg-[#F9F9F9] px-3 py-1 text-xs font-bold text-[#555555]">
                    Season {tournament.season}
                  </span>

                  {/* Status Badge */}
                  {isActive ? (
                    <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#00FF87]/50 bg-[#00FF87]/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#008744]">
                      <span className="h-2 w-2 rounded-full bg-[#00FF87] animate-fpl-pulse-dot" />
                      ACTIVE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#D5D5D5] bg-[#EBEBEB] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#555555]">
                      ● FINISHED
                    </span>
                  )}

                  {/* Bench Boost Rule Badge */}
                  <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#E5D5E7] bg-[#F3EDF4] px-3 py-1 text-xs font-bold text-[#37003C]">
                    <Armchair className="h-3.5 w-3.5 text-[#5A0A63]" />
                    <span>
                      {tournament.allowBenchBoost ? "Bench Boost: On" : "Bench Boost: Off"}
                    </span>
                    {tournament.allowBenchBoost && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#008744]" />
                    )}
                  </span>

                  {/* Triple Captain Rule Badge */}
                  <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#E5D5E7] bg-[#F3EDF4] px-3 py-1 text-xs font-bold text-[#37003C]">
                    <Crown className="h-3.5 w-3.5 text-[#E9007F]" />
                    <span>
                      {tournament.allowTripleCaptain
                        ? "Triple Captain: On (3×)"
                        : "Triple Captain: Reduced (2×)"}
                    </span>
                    {tournament.allowTripleCaptain && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#008744]" />
                    )}
                  </span>
                </div>
              </div>

              {/* Decorative Fantasy Accent Widget on Desktop */}
              <div className="hidden lg:flex flex-col items-center justify-center rounded-[18px] border border-[#E5E5E5] bg-gradient-to-br from-[#FAF7FB] to-[#F3EDF4] p-5 text-center min-w-[220px] shadow-2xs">
                <div className="h-12 w-12 rounded-xl bg-[#37003C] text-[#00FF87] flex items-center justify-center shadow-fpl-sm mb-2.5">
                  <Trophy className="h-6 w-6" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-[#777777]">
                  TOURNAMENT FORMAT
                </span>
                <span className="text-sm font-extrabold text-[#37003C] mt-0.5">
                  Head-to-Head League
                </span>
                <span className="text-[10px] text-[#008744] font-bold bg-[#00FF87]/20 px-2 py-0.5 rounded-full mt-1.5">
                  +3 W · +1 D · 0 L
                </span>
              </div>
            </div>
          </Container>
        </section>

        {/* Main Content Area */}
        <Container className="pt-10 sm:pt-14 space-y-16 sm:space-y-20">
          {/* ========================================================================= */}
          {/* 1. LEAGUE STANDINGS SECTION (VISUAL CENTERPIECE)                          */}
          {/* ========================================================================= */}
          <section id="standings" aria-labelledby="standings-heading" className="space-y-4">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
              <div>
                <h2
                  id="standings-heading"
                  className="text-2xl sm:text-3xl font-extrabold text-[#37003C] tracking-tight flex items-center gap-2.5"
                >
                  <Trophy className="h-6 w-6 sm:h-7 sm:w-7 text-[#FFD700]" />
                  <span>LEAGUE STANDINGS</span>
                </h2>
                <p className="text-xs sm:text-sm text-[#777777] font-medium mt-0.5">
                  Live head-to-head tournament standings and statistics
                </p>
              </div>

              {isActive && (
                <div className="self-start sm:self-auto inline-flex items-center gap-2 rounded-full border border-[#00FF87]/40 bg-[#00FF87]/15 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#008744]">
                  <span className="h-2 w-2 rounded-full bg-[#00FF87] animate-fpl-pulse-dot" />
                  <span>LIVE TABLE</span>
                </div>
              )}
            </div>

            {/* League Table Component */}
            <LeagueTable standings={standings} />
          </section>

          {/* ========================================================================= */}
          {/* 2. FIXTURES & RESULTS BY GAMEWEEK                                        */}
          {/* ========================================================================= */}
          <section id="fixtures" aria-labelledby="fixtures-heading" className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between pb-2">
              <div>
                <h2
                  id="fixtures-heading"
                  className="text-2xl sm:text-3xl font-extrabold text-[#37003C] tracking-tight flex items-center gap-2.5"
                >
                  <Calendar className="h-6 w-6 sm:h-7 sm:w-7 text-[#5A0A63]" />
                  <span>Fixtures &amp; Results</span>
                </h2>
                <p className="text-xs sm:text-sm text-[#777777] font-medium mt-0.5">
                  Gameweek rounds, match scores, and squad player breakdowns
                </p>
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#37003C] bg-[#37003C]/5 px-3 py-1.5 rounded-[8px] border border-[#37003C]/10 shrink-0">
                {tournament.rounds.length} Gameweek {tournament.rounds.length === 1 ? "Round" : "Rounds"}
              </span>
            </div>

            {/* Zero Rounds / Matches Empty State */}
            {tournament.rounds.length === 0 ? (
              <div className="rounded-[16px] border border-[#E5E5E5] bg-white p-10 text-center text-[#777777] shadow-fpl-sm">
                <Calendar className="mx-auto h-10 w-10 text-[#BDBDBD] mb-3" />
                <h3 className="text-base font-extrabold text-[#37003C] uppercase tracking-tight">
                  No Fixtures Yet
                </h3>
                <p className="text-xs text-[#888888] mt-1">
                  There are no scheduled matches for this tournament yet.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {tournament.rounds.map((round) => (
                  <div
                    key={round.id}
                    className="rounded-[18px] border border-[#E5E5E5] bg-white p-5 sm:p-7 shadow-fpl-sm space-y-5"
                  >
                    {/* Round Header Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EAEAEA]">
                      <div className="flex items-center gap-3">
                        <span className="rounded-[8px] bg-[#37003C] text-white px-3 py-1 text-xs sm:text-sm font-extrabold tracking-tight">
                          Gameweek {round.gameweek}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-[#37003C]">
                          {round.name || `Round ${round.roundNumber}`}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        {round.matches.every((m) => m.status === "FINALIZED") ? (
                          <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#00FF87]/20 text-[#008744] border border-[#00FF87]/40 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            FINALIZED
                          </span>
                        ) : round.matches.some((m) => m.status === "COMPLETED" || m.status === "FINALIZED") ? (
                          <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#37003C]/10 text-[#37003C] border border-[#37003C]/20 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider">
                            COMPLETED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#F5F5F5] text-[#777777] border border-[#E5E5E5] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                            <Clock className="h-3.5 w-3.5" />
                            SCHEDULED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Matches List */}
                    <div className="space-y-5">
                      {round.matches.map((match) => {
                        const home = resolveGroup(match, "home");
                        const away = resolveGroup(match, "away");
                        const hasScore =
                          match.homeScore !== null && match.awayScore !== null;
                        const isHomeWin = match.result === "HOME_WIN";
                        const isAwayWin = match.result === "AWAY_WIN";
                        const isDraw = match.result === "DRAW";

                        const homeGroupId = match.homeGroupId || match.homeGroup?.id;
                        const awayGroupId = match.awayGroupId || match.awayGroup?.id;

                        const homeScores = match.scores.filter(
                          (s) => s.member.groupId === homeGroupId
                        );
                        const awayScores = match.scores.filter(
                          (s) => s.member.groupId === awayGroupId
                        );
                        const hasScoresBreakdown =
                          homeScores.length > 0 || awayScores.length > 0;

                        return (
                          <div
                            key={match.id}
                            className="rounded-[16px] border border-[#E5E5E5] bg-[#FFFFFF] p-5 sm:p-6 transition-all duration-200 hover:border-[#37003C]/40 hover:shadow-fpl-md shadow-2xs group"
                          >
                            {/* Match Header Meta */}
                            <div className="flex items-center justify-between text-xs text-[#777777] mb-4 pb-3 border-b border-[#EAEAEA]">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-[#37003C]">
                                  Match {match.matchNumber}
                                </span>
                                <span className="text-[#CCCCCC]">•</span>
                                <span className="font-semibold text-[#555555]">
                                  Gameweek {round.gameweek}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[6px] ${
                                  match.status === "FINALIZED"
                                    ? "bg-[#00FF87]/20 text-[#008744] border border-[#00FF87]/40"
                                    : match.status === "COMPLETED"
                                      ? "bg-[#37003C]/10 text-[#37003C] border border-[#37003C]/20"
                                      : "bg-[#F5F5F5] text-[#777777] border border-[#E5E5E5]"
                                }`}
                              >
                                {match.status}
                              </span>
                            </div>

                            {/* Scoreboard Display */}
                            {hasScore ? (
                              <div className="py-2">
                                {/* Desktop / Tablet Scoreboard (Horizontal) */}
                                <div className="hidden sm:grid sm:grid-cols-12 items-center gap-4 text-center">
                                  {/* Home Team Side */}
                                  <div className="col-span-4 flex items-center justify-end gap-3 min-w-0">
                                    <div className="text-right truncate">
                                      <span
                                        className={`text-base lg:text-lg font-extrabold truncate block leading-tight ${
                                          isHomeWin ? "text-[#37003C]" : "text-[#555555]"
                                        }`}
                                      >
                                        {home.name}
                                      </span>
                                      {isHomeWin && (
                                        <span className="inline-block mt-1 text-[10px] font-black uppercase tracking-wider text-[#008744] bg-[#00FF87]/20 px-2 py-0.5 rounded">
                                          +3 PTS
                                        </span>
                                      )}
                                      {isDraw && (
                                        <span className="inline-block mt-1 text-[10px] font-black uppercase tracking-wider text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded">
                                          +1 PT
                                        </span>
                                      )}
                                      {isAwayWin && (
                                        <span className="inline-block mt-1 text-[10px] font-bold text-[#888888]">
                                          0 PTS
                                        </span>
                                      )}
                                    </div>
                                    {home.logo ? (
                                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white p-1 border border-[#E5E5E5] shadow-xs">
                                        <img
                                          src={home.logo}
                                          alt={home.name}
                                          className="h-8 w-8 object-contain"
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#37003C] text-white font-black text-xs">
                                        {home.name.slice(0, 2).toUpperCase()}
                                      </div>
                                    )}
                                  </div>

                                  {/* Center Score Plate */}
                                  <div className="col-span-4 flex flex-col items-center justify-center">
                                    <div className="rounded-[14px] bg-[#FAFAFA] border border-[#E5E5E5] px-6 py-2 shadow-inner inline-block">
                                      <div className="text-3xl lg:text-4xl font-extrabold text-[#37003C] tracking-wider leading-none">
                                        {match.homeScore} — {match.awayScore}
                                      </div>
                                      <div className="mt-1.5 text-[10px] uppercase font-black tracking-widest text-[#777777]">
                                        {isDraw
                                          ? "MATCH DRAW"
                                          : isHomeWin
                                            ? `${home.name} WIN`
                                            : `${away.name} WIN`}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Away Team Side */}
                                  <div className="col-span-4 flex items-center justify-start gap-3 min-w-0">
                                    {away.logo ? (
                                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white p-1 border border-[#E5E5E5] shadow-xs">
                                        <img
                                          src={away.logo}
                                          alt={away.name}
                                          className="h-8 w-8 object-contain"
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#37003C] text-white font-black text-xs">
                                        {away.name.slice(0, 2).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="text-left truncate">
                                      <span
                                        className={`text-base lg:text-lg font-extrabold truncate block leading-tight ${
                                          isAwayWin ? "text-[#37003C]" : "text-[#555555]"
                                        }`}
                                      >
                                        {away.name}
                                      </span>
                                      {isAwayWin && (
                                        <span className="inline-block mt-1 text-[10px] font-black uppercase tracking-wider text-[#008744] bg-[#00FF87]/20 px-2 py-0.5 rounded">
                                          +3 PTS
                                        </span>
                                      )}
                                      {isDraw && (
                                        <span className="inline-block mt-1 text-[10px] font-black uppercase tracking-wider text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded">
                                          +1 PT
                                        </span>
                                      )}
                                      {isHomeWin && (
                                        <span className="inline-block mt-1 text-[10px] font-bold text-[#888888]">
                                          0 PTS
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Mobile Stacked Scoreboard */}
                                <div className="sm:hidden flex flex-col items-center gap-3 text-center py-2">
                                  {/* Home Team (Top) */}
                                  <div className="flex items-center gap-2.5">
                                    {home.logo ? (
                                      <img
                                        src={home.logo}
                                        alt={home.name}
                                        className="h-7 w-7 object-contain"
                                      />
                                    ) : (
                                      <span className="flex h-7 w-7 items-center justify-center rounded bg-[#37003C] text-white text-[10px] font-black">
                                        {home.name.slice(0, 2).toUpperCase()}
                                      </span>
                                    )}
                                    <span className="text-base font-extrabold text-[#37003C]">
                                      {home.name}
                                    </span>
                                    {isHomeWin && (
                                      <span className="text-[10px] font-black text-[#008744] bg-[#00FF87]/20 px-1.5 py-0.2 rounded">
                                        +3 PTS
                                      </span>
                                    )}
                                  </div>

                                  {/* Center Score */}
                                  <div className="rounded-[12px] bg-[#FAFAFA] border border-[#E5E5E5] px-5 py-2">
                                    <div className="text-2xl font-extrabold text-[#37003C] tracking-wider">
                                      {match.homeScore} — {match.awayScore}
                                    </div>
                                    <div className="text-[9px] uppercase font-black tracking-wider text-[#777777] mt-0.5">
                                      {isDraw
                                        ? "MATCH DRAW"
                                        : isHomeWin
                                          ? `${home.name} WIN`
                                          : `${away.name} WIN`}
                                    </div>
                                  </div>

                                  {/* Away Team (Bottom) */}
                                  <div className="flex items-center gap-2.5">
                                    {away.logo ? (
                                      <img
                                        src={away.logo}
                                        alt={away.name}
                                        className="h-7 w-7 object-contain"
                                      />
                                    ) : (
                                      <span className="flex h-7 w-7 items-center justify-center rounded bg-[#37003C] text-white text-[10px] font-black">
                                        {away.name.slice(0, 2).toUpperCase()}
                                      </span>
                                    )}
                                    <span className="text-base font-extrabold text-[#37003C]">
                                      {away.name}
                                    </span>
                                    {isAwayWin && (
                                      <span className="text-[10px] font-black text-[#008744] bg-[#00FF87]/20 px-1.5 py-0.2 rounded">
                                        +3 PTS
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Match Squad Breakdown (Home & Away) */}
                                {hasScoresBreakdown && (
                                  <div className="mt-5 pt-4 border-t border-[#EAEAEA]">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                      <MatchSquadList
                                        teamName={home.name}
                                        teamLogo={home.logo}
                                        scores={homeScores}
                                        totalScore={match.homeScore}
                                        gameweek={round.gameweek}
                                        allowBenchBoost={tournament.allowBenchBoost}
                                        allowTripleCaptain={tournament.allowTripleCaptain}
                                      />
                                      <MatchSquadList
                                        teamName={away.name}
                                        teamLogo={away.logo}
                                        scores={awayScores}
                                        totalScore={match.awayScore}
                                        gameweek={round.gameweek}
                                        allowBenchBoost={tournament.allowBenchBoost}
                                        allowTripleCaptain={tournament.allowTripleCaptain}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* Uncalculated Future Match: Show VS (NOT 0 - 0) */
                              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4 text-center">
                                <div className="flex items-center gap-2.5">
                                  {home.logo ? (
                                    <img
                                      src={home.logo}
                                      alt={home.name}
                                      className="h-8 w-8 object-contain"
                                    />
                                  ) : (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#37003C] text-white font-bold text-xs">
                                      {home.name.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="text-base font-bold text-[#37003C]">
                                    {home.name}
                                  </span>
                                </div>

                                <span className="text-xs font-extrabold text-[#37003C] bg-[#37003C]/5 border border-[#37003C]/10 px-3 py-1 rounded-full uppercase tracking-wider">
                                  VS
                                </span>

                                <div className="flex items-center gap-2.5">
                                  {away.logo ? (
                                    <img
                                      src={away.logo}
                                      alt={away.name}
                                      className="h-8 w-8 object-contain"
                                    />
                                  ) : (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#37003C] text-white font-bold text-xs">
                                      {away.name.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="text-base font-bold text-[#37003C]">
                                    {away.name}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Match Breakdown Navigation Link */}
                            <div className="mt-4 pt-3 border-t border-[#EAEAEA] flex items-center justify-between text-xs text-[#777777]">
                              <span className="text-[11px] font-medium text-[#888888]">
                                Verified FPL Scoring Engine
                              </span>
                              <Link
                                href={`/matches/${match.id}`}
                                className="inline-flex items-center gap-1 font-bold text-[#37003C] hover:text-[#5A0A63] transition-colors"
                              >
                                <span>View Match &amp; Player Breakdown</span>
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ========================================================================= */}
          {/* 3. PARTICIPATING TEAMS DIRECTORY                                          */}
          {/* ========================================================================= */}
          <section id="teams" aria-labelledby="teams-heading" className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between pb-2">
              <div>
                <h2
                  id="teams-heading"
                  className="text-2xl sm:text-3xl font-extrabold text-[#37003C] tracking-tight flex items-center gap-2.5"
                >
                  <Users className="h-6 w-6 sm:h-7 sm:w-7 text-[#5A0A63]" />
                  <span>Participating Teams ({tournament.groups.length})</span>
                </h2>
                <p className="text-xs sm:text-sm text-[#777777] font-medium mt-0.5">
                  Competing fantasy groups and active roster sizes
                </p>
              </div>
            </div>

            {/* Participating Teams Responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tournament.groups.map((group) => {
                const activePlayerCount = group.members.filter(
                  (m) =>
                    !m.isAdmin &&
                    m.fplId !== tournament.adminFplId &&
                    !tournament.admins?.some((a) => a.fplId === m.fplId)
                ).length;

                return (
                  <div
                    key={group.id}
                    className="flex flex-col items-center text-center p-5 rounded-[16px] border border-[#E5E5E5] bg-white shadow-fpl-sm hover:shadow-fpl-md hover:border-[#37003C]/40 transition-all duration-200 group"
                  >
                    {/* Club Logo / Monogram */}
                    <div className="mb-3">
                      {group.logo ? (
                        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[12px] bg-white p-1.5 border border-[#E5E5E5] shadow-xs group-hover:scale-105 transition-transform">
                          <img
                            src={group.logo}
                            alt={group.name}
                            className="h-10 w-10 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[12px] bg-[#37003C] text-white font-extrabold text-base border border-[#5A0A63] shadow-xs group-hover:scale-105 transition-transform">
                          {group.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Team Name */}
                    <h3 className="font-extrabold text-[#37003C] text-sm sm:text-base leading-snug truncate w-full group-hover:text-[#5A0A63] transition-colors">
                      {group.name}
                    </h3>

                    {/* Active Roster Count */}
                    <p className="text-xs text-[#777777] font-semibold mt-1">
                      {activePlayerCount}{" "}
                      <span>{activePlayerCount === 1 ? "active player" : "active players"}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </Container>
      </main>

      {/* Global FPL Footer */}
      <Footer />
    </div>
  );
}
