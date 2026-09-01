import { prisma } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FPL Tournaments — Custom Fantasy Premier League Knockout Tournaments",
  description:
    "Follow custom knockout tournaments between FPL Classic Leagues with automatic score calculation and admin exclusion.",
};

export default async function Home() {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      {/* Top Navbar */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight text-white hover:text-indigo-300 transition">
            <span className="text-2xl">⚽</span> FPL TOURNAMENTS
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/tournaments"
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition"
            >
              All Tournaments
            </Link>
            <Link
              href="/admin"
              className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
            >
              Admin Panel
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-white/10 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <span className="inline-block rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-300 border border-indigo-500/30 mb-4">
            Fantasy Premier League Tournament Engine
          </span>
          <h1 className="text-4xl font-black sm:text-6xl tracking-tight text-white">
            Custom Knockout Tournaments for FPL Leagues
          </h1>
          <p className="mt-4 text-lg text-indigo-200/80 max-w-2xl mx-auto">
            Automated Gameweek score calculations, strict Admin points exclusion, and live knockout progression tracking.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/tournaments"
              className="rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 hover:scale-105 transition"
            >
              Browse Tournaments →
            </Link>
            <Link
              href="/admin"
              className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white backdrop-blur hover:bg-white/10 transition"
            >
              Organize Tournament
            </Link>
          </div>
        </div>
      </section>

      {/* Main Tournaments Section */}
      <main className="mx-auto max-w-5xl px-4 py-12 space-y-12">
        {/* Active Tournaments */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Tournaments
              </h2>
              <p className="text-sm text-gray-400">
                Currently running FPL knockout tournaments
              </p>
            </div>
            {active.length > 0 && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                {active.length} Live
              </span>
            )}
          </div>

          {active.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
              <p className="text-gray-400">No active tournaments published at the moment.</p>
              <Link href="/admin/tournaments/new" className="mt-3 inline-block text-sm text-indigo-400 hover:underline">
                Create a tournament in Admin →
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {active.map((t) => (
                <TournamentCard key={t.id} tournament={t} />
              ))}
            </div>
          )}
        </section>

        {/* Finished Tournaments */}
        {finished.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Completed Tournaments
                </h2>
                <p className="text-sm text-gray-400">
                  Historical tournament brackets and final results
                </p>
              </div>
              <span className="text-xs font-bold text-gray-400 bg-gray-500/10 px-2.5 py-1 rounded-full border border-gray-500/20">
                {finished.length} Completed
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {finished.map((t) => (
                <TournamentCard key={t.id} tournament={t} />
              ))}
            </div>
          </section>
        )}

        {/* Core Rules Overview */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <h2 className="text-xl font-bold text-white mb-4">
            How FPL Tournament Scoring Works
          </h2>
          <div className="grid gap-6 sm:grid-cols-3 text-sm text-gray-300">
            <div className="space-y-1">
              <p className="font-semibold text-indigo-300">1. Group Score</p>
              <p className="text-xs text-gray-400">
                Each tournament group corresponds to an FPL Classic League. Score equals the sum of all members' Gameweek points.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-yellow-300">2. Admin Exclusion</p>
              <p className="text-xs text-gray-400">
                The tournament organizer/admin is a member of every group to manage leagues, but their points are strictly excluded from all scores.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-emerald-300">3. Chips & Progression</p>
              <p className="text-xs text-gray-400">
                Organizers can configure chip rules. Matches determine knockout progression dynamically across rounds.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-xs text-gray-500">
        <p>FPL Tournament MVP · Powered by Fantasy Premier League API data</p>
      </footer>
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
    allowChips: boolean;
    status: string;
    groups: { id: string }[];
    rounds: { roundNumber: number; gameweek: number; matches: { status: string }[] }[];
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
            Season {tournament.season}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              tournament.status === "PUBLISHED"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-gray-500/20 text-gray-400"
            }`}
          >
            {tournament.status === "PUBLISHED" ? "ACTIVE" : "FINISHED"}
          </span>
          <span className="text-[10px] text-gray-400">
            {tournament.allowChips ? "⚡ Chips On" : "🚫 Chips Off"}
          </span>
        </div>
      </div>
      <div className="mt-4 flex gap-4 text-xs text-gray-400">
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
