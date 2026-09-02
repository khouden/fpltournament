import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { LeagueTable } from "@/components/league-table";
import { calculateLeagueStandings } from "@/lib/scoring";
import { MatchSquadList } from "@/components/match-squad-client";
import {
  Trophy,
  Calendar,
  Users,
  ArrowLeft,
  ArrowRight,
  Armchair,
  Crown,
  Ban,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/tournaments" className="flex items-center gap-2 text-xl font-bold text-white hover:text-indigo-300 transition">
            <Trophy className="h-5 w-5 text-indigo-400" />
            <span>FPL LEAGUES</span>
          </Link>
          <Link
            href="/tournaments"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All Leagues</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 space-y-12">
        {/* Tournament Header */}
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            {tournament.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-300">
              Season {tournament.season}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                tournament.status === "PUBLISHED"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-gray-500/20 text-gray-400"
              }`}
            >
              {tournament.status === "PUBLISHED" ? "ACTIVE LEAGUE" : "FINISHED"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-gray-300 border border-white/10">
              <Armchair className="h-3.5 w-3.5 text-indigo-300" />
              <span>{tournament.allowBenchBoost ? "Bench Boost: On" : "Bench Boost: Off"}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-gray-300 border border-white/10">
              <Crown className="h-3.5 w-3.5 text-amber-400" />
              <span>{tournament.allowTripleCaptain ? "Triple Captain: On (3x)" : "Triple Captain: Reduced (2x)"}</span>
            </span>
          </div>
        </div>

        {/* 1. Live League Standings Table */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              <span>League Standings</span>
            </h2>
          </div>
          <LeagueTable standings={standings} />
        </section>

        {/* 2. Fixtures & Results by Gameweek */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-400" />
              <span>Fixtures & Results</span>
            </h2>
            <span className="text-xs text-gray-400">
              {tournament.rounds.length} Gameweek Rounds
            </span>
          </div>

          <div className="space-y-6">
            {tournament.rounds.map((round) => (
              <div
                key={round.id}
                className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">
                    {round.name || `Round ${round.roundNumber}`}
                  </h3>
                  <span className="rounded-full bg-indigo-500/20 px-3 py-0.5 text-xs font-bold text-indigo-300 border border-indigo-500/30">
                    Gameweek {round.gameweek}
                  </span>
                </div>

                <div className="space-y-4">
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
                      <Link
                        key={match.id}
                        href={`/matches/${match.id}`}
                        className="group block rounded-xl border border-white/10 bg-black/40 p-4 sm:p-5 transition hover:border-indigo-500/50 hover:bg-black/60 shadow-lg backdrop-blur-xs"
                      >
                        {/* Card Header Meta */}
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-3 pb-2.5 border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-300">Match {match.matchNumber}</span>
                            <span className="text-gray-600">•</span>
                            <span className="text-indigo-300 font-medium">GW {round.gameweek}</span>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                              match.status === "FINALIZED"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : match.status === "COMPLETED"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : "bg-gray-500/20 text-gray-400 border border-white/10"
                            }`}
                          >
                            {match.status}
                          </span>
                        </div>

                        {hasScore ? (
                          <>
                            {/* Scoreboard Banner */}
                            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-3 text-center py-1">
                              {/* Home Side */}
                              <div className="flex items-center justify-center md:justify-end gap-2.5">
                                {isHomeWin && (
                                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-400 border border-emerald-500/30">
                                    +3 PTS
                                  </span>
                                )}
                                {isDraw && (
                                  <span className="rounded bg-yellow-500/20 px-2 py-0.5 text-[10px] font-black text-yellow-400 border border-yellow-500/30">
                                    +1 PT
                                  </span>
                                )}
                                <span
                                  className={`text-base sm:text-lg font-bold ${
                                    isHomeWin
                                      ? "text-emerald-400"
                                      : isDraw
                                        ? "text-gray-200"
                                        : "text-gray-400"
                                  }`}
                                >
                                  {home.name}
                                </span>
                                {home.logo && (
                                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 p-1 border border-white/10 shadow-xs">
                                    <img
                                      src={home.logo}
                                      alt={home.name}
                                      className="h-6 w-6 object-contain"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Score Display */}
                              <div className="bg-black/50 rounded-xl py-2 px-4 border border-white/10 inline-block mx-auto shadow-inner">
                                <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-wider">
                                  {match.homeScore} - {match.awayScore}
                                </span>
                                <div className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 mt-0.5">
                                  {isDraw
                                    ? "MATCH DRAW"
                                    : isHomeWin
                                      ? `${home.name} WIN`
                                      : `${away.name} WIN`}
                                </div>
                              </div>

                              {/* Away Side */}
                              <div className="flex items-center justify-center md:justify-start gap-2.5">
                                {away.logo && (
                                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 p-1 border border-white/10 shadow-xs">
                                    <img
                                      src={away.logo}
                                      alt={away.name}
                                      className="h-6 w-6 object-contain"
                                    />
                                  </div>
                                )}
                                <span
                                  className={`text-base sm:text-lg font-bold ${
                                    isAwayWin
                                      ? "text-emerald-400"
                                      : isDraw
                                        ? "text-gray-200"
                                        : "text-gray-400"
                                  }`}
                                >
                                  {away.name}
                                </span>
                                {isAwayWin && (
                                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-400 border border-emerald-500/30">
                                    +3 PTS
                                  </span>
                                )}
                                {isDraw && (
                                  <span className="rounded bg-yellow-500/20 px-2 py-0.5 text-[10px] font-black text-yellow-400 border border-yellow-500/30">
                                    +1 PT
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Team Members with Points Breakdown */}
                            {hasScoresBreakdown && (
                              <div className="mt-4 pt-3 border-t border-white/10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                          </>
                        ) : (
                          <div className="flex items-center justify-center gap-4 py-2 text-center">
                            <div className="flex items-center gap-2">
                              {home.logo && (
                                <img
                                  src={home.logo}
                                  alt={home.name}
                                  className="h-6 w-6 object-contain"
                                />
                              )}
                              <span className="text-base font-bold text-white">
                                {home.name}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-md border border-indigo-500/30">
                              VS
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-white">
                                {away.name}
                              </span>
                              {away.logo && (
                                <img
                                  src={away.logo}
                                  alt={away.name}
                                  className="h-6 w-6 object-contain"
                                />
                              )}
                            </div>
                          </div>
                        )}

                        <div className="mt-3 pt-2 text-center text-xs text-indigo-400 flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 group-hover:text-indigo-300 transition border-t border-white/5">
                          <span>View Match & Player Breakdown</span>
                          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Participating Teams */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-400" />
            <span>Participating Teams ({tournament.groups.length})</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tournament.groups.map((group) => (
              <div
                key={group.id}
                className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur hover:border-indigo-500/40 transition"
              >
                {group.logo ? (
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/10 p-1 border border-white/10">
                    <img
                      src={group.logo}
                      alt={group.name}
                      className="h-8 w-8 object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/30 text-sm">
                    {group.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-white leading-tight">
                    {group.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {
                      group.members.filter(
                        (m) =>
                          !m.isAdmin &&
                          m.fplId !== tournament.adminFplId &&
                          !tournament.admins?.some((a) => a.fplId === m.fplId)
                      ).length
                    }{" "}
                    active players
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}


