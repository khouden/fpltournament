import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { LeagueTable } from "@/components/league-table";
import { calculateLeagueStandings } from "@/lib/scoring";

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

  // Collect all matches for winner references
  const allMatches = tournament.rounds.flatMap((r) => r.matches);

  const resolveGroupName = (
    match: (typeof allMatches)[0],
    side: "home" | "away"
  ): string => {
    const group = side === "home" ? match.homeGroup : match.awayGroup;
    if (group) return group.name;

    const groupId = side === "home" ? match.homeGroupId : match.awayGroupId;
    if (groupId) {
      const found = tournament.groups.find((g) => g.id === groupId);
      if (found) return found.name;
    }

    const winnerRef =
      side === "home"
        ? match.homeWinnerOfMatchId
        : match.awayWinnerOfMatchId;
    if (winnerRef) {
      const parent = allMatches.find((m) => m.id === winnerRef);
      if (parent) {
        if (parent.winnerId) {
          const winnerGroup = tournament.groups.find(
            (g) => g.id === parent.winnerId
          );
          if (winnerGroup) return winnerGroup.name;
        }
        return `Winner Match ${parent.matchNumber}`;
      }
    }
    return "TBD";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/tournaments" className="text-xl font-bold text-white hover:text-indigo-300 transition">
            ⚽ FPL LEAGUES
          </Link>
          <Link
            href="/tournaments"
            className="text-xs text-indigo-300 hover:text-white"
          >
            ← All Leagues
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
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-gray-300 border border-white/10">
              {tournament.allowBenchBoost ? "💺 Bench Boost: On" : "🚫 Bench Boost: Off"}
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-gray-300 border border-white/10">
              {tournament.allowTripleCaptain ? "👑 Triple Captain: On (3x)" : "🚫 Triple Captain: Reduced (2x)"}
            </span>
          </div>
        </div>

        {/* 1. Live League Standings Table */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🏆</span> League Standings
            </h2>
          </div>
          <LeagueTable standings={standings} />
        </section>

        {/* 2. Fixtures & Results by Gameweek */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>📅</span> Fixtures & Results
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

                <div className="space-y-3">
                  {round.matches.map((match) => {
                    const homeName = resolveGroupName(match, "home");
                    const awayName = resolveGroupName(match, "away");
                    const hasScore =
                      match.homeScore !== null && match.awayScore !== null;
                    const isHomeWin = match.result === "HOME_WIN";
                    const isAwayWin = match.result === "AWAY_WIN";
                    const isDraw = match.result === "DRAW";

                    return (
                      <Link
                        key={match.id}
                        href={`/matches/${match.id}`}
                        className="group block rounded-lg border border-white/10 bg-black/30 p-4 transition hover:border-indigo-500/50 hover:bg-black/50"
                      >
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                          <span className="font-semibold">Match {match.matchNumber}</span>
                          <span
                            className={`font-bold ${
                              match.status === "FINALIZED"
                                ? "text-emerald-400"
                                : match.status === "COMPLETED"
                                  ? "text-blue-400"
                                  : "text-gray-500"
                            }`}
                          >
                            {match.status}
                          </span>
                        </div>

                        {hasScore ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-3 text-center">
                            {/* Home Side */}
                            <div className="flex items-center justify-center md:justify-end gap-2">
                              <span
                                className={`text-base font-bold ${
                                  isHomeWin
                                    ? "text-emerald-400"
                                    : isDraw
                                      ? "text-gray-200"
                                      : "text-gray-400"
                                }`}
                              >
                                {homeName}
                              </span>
                              {isHomeWin && (
                                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-black text-emerald-400">
                                  +3 PTS
                                </span>
                              )}
                              {isDraw && (
                                <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-black text-yellow-400">
                                  +1 PT
                                </span>
                              )}
                            </div>

                            {/* Score Display */}
                            <div className="bg-black/40 rounded-lg py-1.5 px-3 border border-white/5 inline-block mx-auto">
                              <span className="text-xl font-mono font-bold text-white tracking-wider">
                                {match.homeScore} - {match.awayScore}
                              </span>
                              <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                                {isDraw
                                  ? "DRAW"
                                  : isHomeWin
                                    ? `${homeName} WIN`
                                    : `${awayName} WIN`}
                              </div>
                            </div>

                            {/* Away Side */}
                            <div className="flex items-center justify-center md:justify-start gap-2">
                              {isAwayWin && (
                                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-black text-emerald-400">
                                  +3 PTS
                                </span>
                              )}
                              {isDraw && (
                                <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-black text-yellow-400">
                                  +1 PT
                                </span>
                              )}
                              <span
                                className={`text-base font-bold ${
                                  isAwayWin
                                    ? "text-emerald-400"
                                    : isDraw
                                      ? "text-gray-200"
                                      : "text-gray-400"
                                }`}
                              >
                                {awayName}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-4 py-1 text-center">
                            <span className="text-base font-bold text-white">
                              {homeName}
                            </span>
                            <span className="text-xs font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded">
                              VS
                            </span>
                            <span className="text-base font-bold text-white">
                              {awayName}
                            </span>
                          </div>
                        )}

                        <p className="mt-2 text-center text-xs text-indigo-400 opacity-0 transition group-hover:opacity-100">
                          View Match & Player Breakdown →
                        </p>
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
            <span>👥</span> Participating Teams ({tournament.groups.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tournament.groups.map((group) => (
              <div
                key={group.id}
                className="rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <h3 className="font-bold text-white">{group.name}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {
                    group.members.filter(
                      (m) =>
                        !m.isAdmin && m.fplId !== tournament.adminFplId
                    ).length
                  }{" "}
                  active players
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
