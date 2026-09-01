import { prisma } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tournaments — FPL Tournament",
  description:
    "Browse published fantasy football tournaments, view scores and match results.",
};

export default async function TournamentsPage() {
  const tournaments = await prisma.tournament.findMany({
    where: {
      status: { in: ["PUBLISHED", "FINISHED"] },
    },
    include: {
      groups: true,
      rounds: {
        include: { matches: true },
        orderBy: { roundNumber: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const active = tournaments.filter((t) => t.status === "PUBLISHED");
  const finished = tournaments.filter((t) => t.status === "FINISHED");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-white">
            ⚽ FPL Tournament
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-4xl font-bold text-white">Tournaments</h1>
        <p className="mt-2 text-lg text-indigo-300">
          Browse active and completed tournaments
        </p>

        {/* Active Tournaments */}
        {active.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-emerald-400 uppercase tracking-wider">
              Active
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {active.map((t) => (
                <TournamentCard key={t.id} tournament={t} />
              ))}
            </div>
          </section>
        )}

        {/* Finished Tournaments */}
        {finished.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-gray-400 uppercase tracking-wider">
              Completed
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {finished.map((t) => (
                <TournamentCard key={t.id} tournament={t} />
              ))}
            </div>
          </section>
        )}

        {tournaments.length === 0 && (
          <div className="mt-16 text-center">
            <p className="text-xl text-gray-400">No tournaments published yet</p>
            <p className="mt-2 text-gray-500">Check back later!</p>
          </div>
        )}
      </main>
    </div>
  );
}

function TournamentCard({
  tournament,
}: {
  tournament: {
    id: string;
    name: string;
    season: number;
    status: string;
    groups: { id: string }[];
    rounds: { matches: { status: string }[] }[];
  };
}) {
  const totalMatches = tournament.rounds.reduce(
    (acc, r) => acc + r.matches.length,
    0
  );
  const completedMatches = tournament.rounds.reduce(
    (acc, r) =>
      acc +
      r.matches.filter(
        (m) => m.status === "COMPLETED" || m.status === "FINALIZED"
      ).length,
    0
  );

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className="group rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-indigo-500/50 hover:bg-white/10"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition">
            {tournament.name}
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            Season {tournament.season}/{tournament.season + 1}
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            tournament.status === "PUBLISHED"
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-gray-500/20 text-gray-400"
          }`}
        >
          {tournament.status === "PUBLISHED" ? "ACTIVE" : "FINISHED"}
        </span>
      </div>
      <div className="mt-4 flex gap-4 text-sm text-gray-400">
        <span>{tournament.groups.length} Groups</span>
        <span>
          {completedMatches}/{totalMatches} Matches
        </span>
        <span>{tournament.rounds.length} Rounds</span>
      </div>
      <div className="mt-4 text-sm font-medium text-indigo-400 group-hover:text-indigo-300">
        View Tournament →
      </div>
    </Link>
  );
}
