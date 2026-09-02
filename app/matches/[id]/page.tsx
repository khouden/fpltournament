import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Trophy, ArrowLeft, Sparkles, Handshake } from "lucide-react";
import { MatchScoreBreakdown } from "@/components/match-squad-client";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
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
        <Link
          href={`/tournaments/${tournament.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{tournament.name}</span>
        </Link>

        {/* Match Header */}
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-6 text-center">
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
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-black">
                    {match.result === "HOME_WIN" ? (
                      <>
                        <Sparkles className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">+3 PTS (Win)</span>
                      </>
                    ) : match.result === "DRAW" ? (
                      <>
                        <Handshake className="h-3 w-3 text-yellow-400" />
                        <span className="text-yellow-400">+1 PT (Draw)</span>
                      </>
                    ) : (
                      <span className="text-gray-400">0 PTS (Loss)</span>
                    )}
                  </span>
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
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-black">
                    {match.result === "AWAY_WIN" ? (
                      <>
                        <Sparkles className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">+3 PTS (Win)</span>
                      </>
                    ) : match.result === "DRAW" ? (
                      <>
                        <Handshake className="h-3 w-3 text-yellow-400" />
                        <span className="text-yellow-400">+1 PT (Draw)</span>
                      </>
                    ) : (
                      <span className="text-gray-400">0 PTS (Loss)</span>
                    )}
                  </span>
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

          <div className="mt-2 flex justify-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                match.status === "FINALIZED"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : match.status === "COMPLETED"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-gray-500/20 text-gray-400"
              }`}
            >
              {match.status}
            </span>
          </div>
        </div>

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
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-gray-400">
              Scores have not been calculated yet.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Scores will appear once the Gameweek is complete.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
