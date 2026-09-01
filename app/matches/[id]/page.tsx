import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Trophy, ArrowLeft, Sparkles, Handshake } from "lucide-react";

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

          <div className="mt-6 flex items-center justify-center gap-6">
            {/* Home */}
            <div className="text-right">
              <h2
                className={`text-2xl font-bold ${
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

            {/* Score */}
            {hasScore ? (
              <div>
                <p className="text-4xl font-bold text-white font-mono">
                  {match.homeScore}{" "}
                  <span className="text-gray-500">-</span>{" "}
                  {match.awayScore}
                </p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-gray-500">VS</p>
            )}

            {/* Away */}
            <div className="text-left">
              <h2
                className={`text-2xl font-bold ${
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
              <ScoreBreakdown
                groupName={match.homeGroup.name}
                scores={homeScores}
                total={match.homeScore!}
                isWinner={match.result === "HOME_WIN"}
              />
            )}

            {/* Away Group Breakdown */}
            {match.awayGroup && (
              <ScoreBreakdown
                groupName={match.awayGroup.name}
                scores={awayScores}
                total={match.awayScore!}
                isWinner={match.result === "AWAY_WIN"}
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

function ScoreBreakdown({
  groupName,
  scores,
  total,
  isWinner,
}: {
  groupName: string;
  scores: {
    id: string;
    gameweekPoints: number;
    isExcluded: boolean;
    activeChip?: string | null;
    chipDeduction?: number;
    member: {
      fplName: string;
      fplTeamName: string | null;
    };
  }[];
  total: number;
  isWinner: boolean;
}) {
  const included = scores.filter((s) => !s.isExcluded);
  const excluded = scores.filter((s) => s.isExcluded);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3
          className={`text-lg font-bold ${isWinner ? "text-emerald-400" : "text-white"}`}
        >
          {groupName}
        </h3>
        <span className="text-2xl font-bold text-white">{total}</span>
      </div>

      {/* Included Members */}
      <div className="space-y-2">
        {included.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between text-sm py-0.5 border-b border-white/5 last:border-0"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{s.member.fplName}</span>
                {s.activeChip && (
                  <span className="rounded bg-indigo-500/20 px-1.5 py-0.2 text-[10px] font-bold text-indigo-300 uppercase">
                    {s.activeChip === "bboost"
                      ? "Bench Boost"
                      : s.activeChip === "3xc"
                        ? "Triple Captain"
                        : s.activeChip}
                  </span>
                )}
              </div>
              {s.member.fplTeamName && (
                <p className="text-xs text-gray-500">
                  {s.member.fplTeamName}
                  {s.chipDeduction && s.chipDeduction > 0 ? (
                    <span className="text-amber-400/90 ml-2">
                      (-{s.chipDeduction} pts chip adjustment)
                    </span>
                  ) : null}
                </p>
              )}
            </div>
            <span className="font-mono font-bold text-white text-base">
              {s.gameweekPoints}
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-3 border-t border-white/10 pt-2 flex items-center justify-between">
        <span className="text-sm font-bold text-gray-400">TOTAL</span>
        <span className="font-mono font-bold text-indigo-400 text-xl">{total}</span>
      </div>

      {/* Excluded (Admin) */}
      {excluded.length > 0 && (
        <div className="mt-4 rounded-lg bg-yellow-500/10 p-3">
          <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2">
            Admin — Excluded from Score
          </p>
          {excluded.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-yellow-400/70 italic">
                {s.member.fplName}
              </span>
              <span className="font-mono text-yellow-400/70 line-through">
                {s.gameweekPoints}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
