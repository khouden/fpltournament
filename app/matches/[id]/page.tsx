import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Trophy, ArrowLeft, Sparkles, Handshake } from "lucide-react";
import { MatchScoreBreakdown } from "@/components/match-squad-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/tournaments" className="flex items-center gap-2 text-xl font-bold text-white hover:text-indigo-300 transition">
            <Trophy className="h-5 w-5 text-indigo-400" />
            <span>FPL Tournament</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        {/* Back Link */}
        <Button variant="ghost" size="sm" asChild className="text-indigo-400 hover:text-indigo-300 hover:bg-white/10 mb-4">
          <Link href={`/tournaments/${tournament.id}`}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            <span>{tournament.name}</span>
          </Link>
        </Button>

        {/* Match Header */}
        <Card className="border-white/10 bg-white/5 p-6 text-center text-white backdrop-blur shadow-lg">
          <p className="text-sm text-gray-400">
            {match.round.name || `Round ${match.round.roundNumber}`} · Gameweek {match.round.gameweek}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-8">
            {/* Home */}
            <div className="flex items-center gap-3 text-right">
              <div>
                <h2
                  className={`text-xl sm:text-2xl font-bold ${
                    match.result === "HOME_WIN"
                      ? "text-emerald-400"
                      : "text-white"
                  }`}
                >
                  {match.homeGroup?.name || "TBD"}
                </h2>
                {match.result && (
                  <div className="mt-1">
                    {match.result === "HOME_WIN" ? (
                      <Badge variant="success" className="gap-1 text-xs font-black">
                        <Sparkles className="h-3 w-3" />
                        <span>+3 PTS (Win)</span>
                      </Badge>
                    ) : match.result === "DRAW" ? (
                      <Badge variant="warning" className="gap-1 text-xs font-black">
                        <Handshake className="h-3 w-3" />
                        <span>+1 PT (Draw)</span>
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">0 PTS (Loss)</span>
                    )}
                  </div>
                )}
              </div>
              {match.homeGroup?.logo ? (
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 p-1 border border-white/10 shadow-xs">
                  <img
                    src={match.homeGroup.logo}
                    alt={match.homeGroup.name}
                    className="h-9 w-9 object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 font-bold text-indigo-300 border border-white/10 text-sm">
                  {match.homeGroup?.name ? match.homeGroup.name.slice(0, 2).toUpperCase() : "?"}
                </div>
              )}
            </div>

            {/* Score */}
            {hasScore ? (
              <div className="bg-black/40 rounded-xl px-5 py-2 border border-white/10">
                <p className="text-3xl sm:text-4xl font-bold text-white font-mono tracking-wider">
                  {match.homeScore}{" "}
                  <span className="text-gray-500">-</span>{" "}
                  {match.awayScore}
                </p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-gray-500">VS</p>
            )}

            {/* Away */}
            <div className="flex items-center gap-3 text-left">
              {match.awayGroup?.logo ? (
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 p-1 border border-white/10 shadow-xs">
                  <img
                    src={match.awayGroup.logo}
                    alt={match.awayGroup.name}
                    className="h-9 w-9 object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 font-bold text-indigo-300 border border-white/10 text-sm">
                  {match.awayGroup?.name ? match.awayGroup.name.slice(0, 2).toUpperCase() : "?"}
                </div>
              )}
              <div>
                <h2
                  className={`text-xl sm:text-2xl font-bold ${
                    match.result === "AWAY_WIN"
                      ? "text-emerald-400"
                      : "text-white"
                  }`}
                >
                  {match.awayGroup?.name || "TBD"}
                </h2>
                {match.result && (
                  <div className="mt-1">
                    {match.result === "AWAY_WIN" ? (
                      <Badge variant="success" className="gap-1 text-xs font-black">
                        <Sparkles className="h-3 w-3" />
                        <span>+3 PTS (Win)</span>
                      </Badge>
                    ) : match.result === "DRAW" ? (
                      <Badge variant="warning" className="gap-1 text-xs font-black">
                        <Handshake className="h-3 w-3" />
                        <span>+1 PT (Draw)</span>
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">0 PTS (Loss)</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Result */}
          {match.result && (
            <p
              className={`mt-4 inline-flex items-center justify-center gap-2 text-lg font-bold ${
                match.result === "DRAW"
                  ? "text-yellow-400"
                  : "text-emerald-400"
              }`}
            >
              {match.result === "DRAW" ? (
                <>
                  <Handshake className="h-5 w-5 text-yellow-400" />
                  <span>MATCH DRAW (1 PT each)</span>
                </>
              ) : match.result === "HOME_WIN" ? (
                <>
                  <Trophy className="h-5 w-5 text-emerald-400" />
                  <span>{match.homeGroup?.name} WINS (+3 PTS)</span>
                </>
              ) : (
                <>
                  <Trophy className="h-5 w-5 text-emerald-400" />
                  <span>{match.awayGroup?.name} WINS (+3 PTS)</span>
                </>
              )}
            </p>
          )}

          <div className="mt-3 flex justify-center gap-2">
            <Badge
              variant={
                match.status === "FINALIZED"
                  ? "success"
                  : match.status === "COMPLETED"
                    ? "default"
                    : "secondary"
              }
            >
              {match.status}
            </Badge>
          </div>
        </Card>

        {/* Score Breakdown */}
        {hasScore && (homeScores.length > 0 || awayScores.length > 0) && (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
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
        )}

        {/* No Scores Yet */}
        {!hasScore && (
          <Card className="mt-8 border-white/10 bg-white/5 p-8 text-center text-white backdrop-blur">
            <p className="text-gray-400">
              Scores have not been calculated yet.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Scores will appear once the Gameweek is complete.
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
