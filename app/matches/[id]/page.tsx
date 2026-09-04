import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Trophy,
  ArrowLeft,
  Sparkles,
  Handshake,
  Clock,
} from "lucide-react";
import { MatchScoreBreakdown } from "@/components/match-squad-client";
import { Header } from "@/components/navigation/header";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";

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
    description: `Match ${match.matchNumber}: ${home} vs ${away} in ${match.round.name || `Round ${match.round.roundNumber}`}.`,
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
    notFound();
  }

  const tournament = match.round.tournament;

  // Block access to draft tournaments
  if (tournament.status === "DRAFT") {
    notFound();
  }

  const hasScore =
    match.homeScore !== null && match.awayScore !== null;

  // Build score breakdowns per group
  const homeScores = match.scores
    .filter((s) => s.member.groupId === match.homeGroupId)
    .sort((a, b) => {
      if (a.isExcluded !== b.isExcluded) return a.isExcluded ? 1 : -1;
      return b.gameweekPoints - a.gameweekPoints;
    });

  const awayScores = match.scores
    .filter((s) => s.member.groupId === match.awayGroupId)
    .sort((a, b) => {
      if (a.isExcluded !== b.isExcluded) return a.isExcluded ? 1 : -1;
      return b.gameweekPoints - a.gameweekPoints;
    });
  const homeName = match.homeGroup?.name || "TBD";
  const awayName = match.awayGroup?.name || "TBD";
  const roundLabel = match.round.name || `Round ${match.round.roundNumber}`;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F7] text-[#1F1F1F]">
      {/* Global Shared FPL Header */}
      <Header />

      <main className="flex-1 pb-16 sm:pb-24">
        <Container className="py-6 sm:py-8 space-y-6 sm:space-y-8 max-w-6xl">
          {/* Breadcrumb Back Navigation */}
          <div>
            <Link
              href={`/tournaments/${tournament.id}`}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#37003C] hover:text-[#5A0A63] bg-white hover:bg-[#37003C]/5 px-3 py-1.5 rounded-[8px] border border-[#E5E5E5] transition-colors shadow-2xs group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to {tournament.name}</span>
            </Link>
          </div>

          {/* Match Center Hero Card */}
          <Card className="rounded-2xl border border-[#E5E5E5] bg-white p-6 sm:p-8 shadow-xs relative overflow-hidden">
            {/* Subtle background branding accents */}
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#00FF87]/10 blur-3xl pointer-events-none"
            />
            <div
              aria-hidden="true"
              className="absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-[#37003C]/5 blur-3xl pointer-events-none"
            />

            {/* Top Bar: Round Context & Match Status */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#EAEAEA]">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#666666]">
                  {roundLabel} · Gameweek {match.round.gameweek}
                </span>
              </div>

              {/* Status Badge */}
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                    match.status === "FINALIZED"
                      ? "bg-[#00FF87]/20 text-[#008744] border-[#00FF87]/40"
                      : match.status === "COMPLETED"
                        ? "bg-[#37003C]/10 text-[#37003C] border-[#37003C]/20"
                        : "bg-[#F3F4F6] text-[#666666] border-[#E5E5E5]"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      match.status === "FINALIZED"
                        ? "bg-[#008744]"
                        : match.status === "COMPLETED"
                          ? "bg-[#37003C]"
                          : "bg-[#8A8A8A]"
                    }`}
                  />
                  <span>{match.status}</span>
                </span>
              </div>
            </div>

            {/* Matchup Centerpiece */}
            <div className="relative z-10 py-6 sm:py-8">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6 sm:gap-8 text-center">
                {/* Home Team */}
                <div className="flex flex-col md:flex-row items-center md:justify-end gap-3 sm:gap-4 md:text-right">
                  <div className="order-2 md:order-1">
                    <h1
                      className={`text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight ${
                        match.result === "HOME_WIN"
                          ? "text-[#008744]"
                          : "text-[#1F1F1F]"
                      }`}
                    >
                      {homeName}
                    </h1>

                    {/* Outcome Badge */}
                    {match.result && (
                      <div className="mt-1.5 flex items-center justify-center md:justify-end">
                        {match.result === "HOME_WIN" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-[#008744] bg-[#00FF87]/20 border border-[#00FF87]/40 px-2.5 py-0.5 rounded-full shadow-2xs">
                            <Sparkles className="h-3 w-3" />
                            <span>+3 PTS · WIN</span>
                          </span>
                        ) : match.result === "DRAW" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-[#92400E] bg-[#FEF3C7] border border-[#FDE68A] px-2.5 py-0.5 rounded-full">
                            <Handshake className="h-3 w-3" />
                            <span>+1 PT · DRAW</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-[#777777] bg-[#F3F4F6] border border-[#E5E5E5] px-2.5 py-0.5 rounded-full">
                            0 PTS · LOSS
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Home Logo */}
                  <div className="order-1 md:order-2 shrink-0">
                    {match.homeGroup?.logo ? (
                      <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 lg:h-22 lg:w-22 items-center justify-center rounded-2xl bg-white p-2 border border-[#E5E5E5] shadow-xs">
                        <img
                          src={match.homeGroup.logo}
                          alt={homeName}
                          className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 sm:h-20 sm:w-20 lg:h-22 lg:w-22 items-center justify-center rounded-2xl bg-[#37003C] text-xl sm:text-2xl font-black text-[#00FF87] shadow-xs border border-[#37003C]">
                        {homeName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Score or VS Display */}
                <div className="shrink-0 px-4 sm:px-6">
                  {hasScore ? (
                    <div className="flex flex-col items-center justify-center">
                      <div className="inline-flex items-center gap-3 sm:gap-4 bg-[#F7F7F7] px-6 py-3 rounded-2xl border border-[#E5E5E5] shadow-2xs">
                        <span
                          className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight ${
                            match.result === "HOME_WIN"
                              ? "text-[#008744]"
                              : "text-[#37003C]"
                          }`}
                        >
                          {match.homeScore}
                        </span>
                        <span className="text-xl sm:text-2xl font-bold text-[#8A8A8A]">
                          –
                        </span>
                        <span
                          className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight ${
                            match.result === "AWAY_WIN"
                              ? "text-[#008744]"
                              : "text-[#37003C]"
                          }`}
                        >
                          {match.awayScore}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="inline-flex items-center justify-center h-12 w-16 rounded-xl bg-[#F3F4F6] border border-[#E5E5E5]">
                      <span className="text-xl sm:text-2xl font-black text-[#8A8A8A] tracking-wider">
                        VS
                      </span>
                    </div>
                  )}
                </div>

                {/* Away Team */}
                <div className="flex flex-col md:flex-row items-center md:justify-start gap-3 sm:gap-4 md:text-left">
                  {/* Away Logo */}
                  <div className="shrink-0">
                    {match.awayGroup?.logo ? (
                      <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 lg:h-22 lg:w-22 items-center justify-center rounded-2xl bg-white p-2 border border-[#E5E5E5] shadow-xs">
                        <img
                          src={match.awayGroup.logo}
                          alt={awayName}
                          className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 sm:h-20 sm:w-20 lg:h-22 lg:w-22 items-center justify-center rounded-2xl bg-[#37003C] text-xl sm:text-2xl font-black text-[#00FF87] shadow-xs border border-[#37003C]">
                        {awayName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div>
                    <h1
                      className={`text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight ${
                        match.result === "AWAY_WIN"
                          ? "text-[#008744]"
                          : "text-[#1F1F1F]"
                      }`}
                    >
                      {awayName}
                    </h1>

                    {/* Outcome Badge */}
                    {match.result && (
                      <div className="mt-1.5 flex items-center justify-center md:justify-start">
                        {match.result === "AWAY_WIN" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-[#008744] bg-[#00FF87]/20 border border-[#00FF87]/40 px-2.5 py-0.5 rounded-full shadow-2xs">
                            <Sparkles className="h-3 w-3" />
                            <span>+3 PTS · WIN</span>
                          </span>
                        ) : match.result === "DRAW" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-[#92400E] bg-[#FEF3C7] border border-[#FDE68A] px-2.5 py-0.5 rounded-full">
                            <Handshake className="h-3 w-3" />
                            <span>+1 PT · DRAW</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-[#777777] bg-[#F3F4F6] border border-[#E5E5E5] px-2.5 py-0.5 rounded-full">
                            0 PTS · LOSS
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Result Announcement Banner */}
              {match.result && (
                <div className="mt-6 sm:mt-8 pt-5 border-t border-[#EAEAEA] flex justify-center">
                  {match.result === "DRAW" ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs sm:text-sm font-bold shadow-2xs">
                      <Handshake className="h-4 w-4 text-[#D97706]" />
                      <span>MATCH DRAW — 1 tournament point awarded to each team</span>
                    </div>
                  ) : match.result === "HOME_WIN" ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00FF87]/15 border border-[#00FF87]/30 text-[#008744] text-xs sm:text-sm font-bold shadow-2xs">
                      <Trophy className="h-4 w-4 text-[#008744]" />
                      <span>🏆 {homeName} WINS (+3 tournament points)</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00FF87]/15 border border-[#00FF87]/30 text-[#008744] text-xs sm:text-sm font-bold shadow-2xs">
                      <Trophy className="h-4 w-4 text-[#008744]" />
                      <span>🏆 {awayName} WINS (+3 tournament points)</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Score Breakdown Section */}
          {hasScore && (homeScores.length > 0 || awayScores.length > 0) && (
            <section className="space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#1F1F1F] tracking-tight">
                  Match Score Breakdown
                </h2>
                <p className="text-xs sm:text-sm text-[#666666] mt-0.5">
                  See how each manager contributed to the final team score.
                </p>
              </div>

              {/* 2-Column Team Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Home Group Breakdown */}
                {match.homeGroup && (
                  <MatchScoreBreakdown
                    groupName={match.homeGroup.name}
                    logo={match.homeGroup.logo}
                    scores={homeScores}
                    total={match.homeScore!}
                    isWinner={match.result === "HOME_WIN"}
                    gameweek={match.round.gameweek}
                    allowBenchBoost={tournament.allowBenchBoost}
                    allowTripleCaptain={tournament.allowTripleCaptain}
                  />
                )}

                {/* Away Group Breakdown */}
                {match.awayGroup && (
                  <MatchScoreBreakdown
                    groupName={match.awayGroup.name}
                    logo={match.awayGroup.logo}
                    scores={awayScores}
                    total={match.awayScore!}
                    isWinner={match.result === "AWAY_WIN"}
                    gameweek={match.round.gameweek}
                    allowBenchBoost={tournament.allowBenchBoost}
                    allowTripleCaptain={tournament.allowTripleCaptain}
                  />
                )}
              </div>
            </section>
          )}

          {/* Unplayed / Future Match State */}
          {!hasScore && (
            <Card className="rounded-2xl border border-[#E5E5E5] bg-white p-8 sm:p-12 text-center shadow-xs space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#37003C]/5 text-[#37003C] border border-[#37003C]/10">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-[#1F1F1F]">
                Scores not calculated yet
              </h3>
              <p className="text-sm text-[#666666] max-w-md mx-auto">
                Scores will appear once Gameweek {match.round.gameweek} is complete and official FPL points are synced.
              </p>
            </Card>
          )}
        </Container>
      </main>

      {/* Global Shared FPL Footer */}
      <Footer />
    </div>
  );
}
