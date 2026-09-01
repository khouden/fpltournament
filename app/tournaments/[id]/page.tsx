import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { TournamentBracket } from "@/components/tournament-bracket";

export async function generateMetadata(
  props: PageProps<"/tournaments/[id]">
): Promise<Metadata> {
  const { id } = await props.params;
  const t = await prisma.tournament.findUnique({ where: { id } });
  return {
    title: t ? `${t.name} — FPL Tournament` : "Tournament",
    description: t
      ? `View the ${t.name} tournament bracket, rounds, and match results.`
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
            ⚽ FPL Tournament
          </Link>
          <Link
            href="/tournaments"
            className="text-xs text-indigo-300 hover:text-white"
          >
            ← All Tournaments
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        {/* Tournament Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">
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
              {tournament.status === "PUBLISHED" ? "ACTIVE" : "FINISHED"}
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-gray-300 border border-white/10">
              {tournament.allowChips ? "⚡ Chips Allowed" : "🚫 Chips Disabled (BB/TC Adjusted)"}
            </span>
          </div>
        </div>

        {/* Tournament Bracket Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-indigo-300 uppercase tracking-wider">
              🏆 Tournament Bracket
            </h2>
          </div>
          <TournamentBracket
            rounds={tournament.rounds}
            groups={tournament.groups}
          />
        </section>

        {/* Groups */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-indigo-300 uppercase tracking-wider mb-4">
            👥 Participating Groups ({tournament.groups.length})
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

        {/* Rounds & Matches */}
        <section>
          <h2 className="text-lg font-semibold text-indigo-300 uppercase tracking-wider mb-4">
            Rounds & Matches
          </h2>
          <div className="space-y-6">
            {tournament.rounds.map((round) => (
              <div
                key={round.id}
                className="rounded-xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">
                    {round.name || `Round ${round.roundNumber}`}
                  </h3>
                  <span className="rounded-full bg-indigo-500/20 px-3 py-0.5 text-sm font-medium text-indigo-300">
                    Gameweek {round.gameweek}
                  </span>
                </div>

                <div className="space-y-3">
                  {round.matches.map((match) => {
                    const homeName = resolveGroupName(match, "home");
                    const awayName = resolveGroupName(match, "away");
                    const hasScore =
                      match.homeScore !== null && match.awayScore !== null;

                    return (
                      <Link
                        key={match.id}
                        href={`/matches/${match.id}`}
                        className="group block rounded-lg border border-white/10 bg-black/20 p-4 transition hover:border-indigo-500/50 hover:bg-black/30"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Match {match.matchNumber}
                          </span>
                          <span
                            className={`text-xs font-medium ${
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
                          <div className="mt-2 flex items-center justify-center gap-4">
                            <span
                              className={`text-lg font-bold ${
                                match.result === "HOME_WIN"
                                  ? "text-emerald-400"
                                  : "text-white"
                              }`}
                            >
                              {homeName}
                            </span>
                            <div className="text-center">
                              <span className="text-2xl font-bold text-white">
                                {match.homeScore} - {match.awayScore}
                              </span>
                              {match.result && (
                                <p
                                  className={`text-xs font-bold mt-1 ${
                                    match.result === "DRAW"
                                      ? "text-yellow-400"
                                      : "text-emerald-400"
                                  }`}
                                >
                                  {match.result === "DRAW"
                                    ? "DRAW"
                                    : match.result === "HOME_WIN"
                                      ? homeName
                                      : awayName}
                                </p>
                              )}
                            </div>
                            <span
                              className={`text-lg font-bold ${
                                match.result === "AWAY_WIN"
                                  ? "text-emerald-400"
                                  : "text-white"
                              }`}
                            >
                              {awayName}
                            </span>
                          </div>
                        ) : (
                          <div className="mt-2 flex items-center justify-center gap-4">
                            <span className="text-lg font-bold text-white">
                              {homeName}
                            </span>
                            <span className="text-sm font-bold text-gray-500">
                              VS
                            </span>
                            <span className="text-lg font-bold text-white">
                              {awayName}
                            </span>
                          </div>
                        )}

                        <p className="mt-2 text-center text-xs text-indigo-400 opacity-0 transition group-hover:opacity-100">
                          View details →
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
