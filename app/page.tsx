import { prisma } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";
import { Trophy, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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
          <Link href="/" className="flex items-center gap-2.5 text-xl font-black tracking-tight text-white hover:text-indigo-300 transition">
            <Trophy className="h-6 w-6 text-indigo-400" />
            <span>FPL TOURNAMENTS</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="text-gray-300 hover:text-white hover:bg-white/10">
              <Link href="/tournaments">All Tournaments</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/admin">Admin Panel</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-white/10 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <Badge variant="subtle" className="mb-4 gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-300 border-indigo-500/30 bg-indigo-500/20">
            <Trophy className="h-3.5 w-3.5" /> Fantasy Premier League Tournament Engine
          </Badge>
          <h1 className="text-4xl font-black sm:text-6xl tracking-tight text-white">
            Custom Knockout Tournaments for FPL Leagues
          </h1>
          <p className="mt-4 text-lg text-indigo-200/80 max-w-2xl mx-auto">
            Automated Gameweek score calculations, strict Admin points exclusion, and live knockout progression tracking.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild className="rounded-xl font-bold shadow-lg shadow-indigo-500/25">
              <Link href="/tournaments">
                <span>Browse Tournaments</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button variant="subtle" size="lg" asChild className="rounded-xl font-semibold backdrop-blur">
              <Link href="/admin">Organize Tournament</Link>
            </Button>
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
              <Badge variant="success" className="font-bold">
                {active.length} Live
              </Badge>
            )}
          </div>

          {active.length === 0 ? (
            <Card className="border-white/10 bg-white/5 p-8 text-center backdrop-blur">
              <p className="text-gray-400">No active tournaments published at the moment.</p>
              <Link href="/admin/tournaments/new" className="mt-3 inline-flex items-center gap-1.5 text-sm text-indigo-400 hover:underline">
                <span>Create a tournament in Admin</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>
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
              <Badge variant="secondary" className="font-bold">
                {finished.length} Completed
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {finished.map((t) => (
                <TournamentCard key={t.id} tournament={t} />
              ))}
            </div>
          </section>
        )}

        {/* Core Rules Overview */}
        <Card className="rounded-2xl border-white/10 bg-white/5 p-8 backdrop-blur text-white">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-xl font-bold text-white">
              How FPL Tournament Scoring Works
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid gap-6 sm:grid-cols-3 text-sm text-gray-300">
              <div className="space-y-1">
                <p className="font-semibold text-indigo-300">1. Group Score</p>
                <p className="text-xs text-gray-400">
                  Each tournament group corresponds to an FPL Classic League. Score equals the sum of all members&apos; Gameweek points.
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-yellow-300">2. Admin Exclusion</p>
                <p className="text-xs text-gray-400">
                  The tournament organizer/admin is a member of every group to manage leagues, but their points are strictly excluded from all scores.
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-emerald-300">3. Chips &amp; Progression</p>
                <p className="text-xs text-gray-400">
                  Organizers can configure chip rules. Matches determine knockout progression dynamically across rounds.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
    allowBenchBoost: boolean;
    allowTripleCaptain: boolean;
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
      className="group block"
    >
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-indigo-500/50 hover:bg-white/10 text-white">
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
            <Badge
              variant={tournament.status === "PUBLISHED" ? "success" : "secondary"}
              className="font-bold"
            >
              {tournament.status === "PUBLISHED" ? "ACTIVE" : "FINISHED"}
            </Badge>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
              <span className="flex items-center gap-0.5">
                BB: {tournament.allowBenchBoost ? <Check className="h-3 w-3 text-emerald-400" /> : <X className="h-3 w-3 text-rose-400" />}
              </span>
              <span>|</span>
              <span className="flex items-center gap-0.5">
                TC: {tournament.allowTripleCaptain ? <Check className="h-3 w-3 text-emerald-400" /> : <X className="h-3 w-3 text-rose-400" />}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-4 text-xs text-gray-400">
          <span>{tournament.groups.length} Groups</span>
          <span>
            {completedMatches}/{totalMatches} Matches
          </span>
          <span>{tournament.rounds.length} Rounds</span>
        </div>
        <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-400 group-hover:text-indigo-300">
          <span>View Tournament</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </Card>
    </Link>
  );
}
