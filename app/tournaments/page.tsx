import { prisma } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";
import { Trophy, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white hover:text-indigo-300 transition">
            <Trophy className="h-5 w-5 text-indigo-400" />
            <span>FPL Tournament</span>
          </Link>
          <Button variant="ghost" size="sm" asChild className="text-indigo-300 hover:text-white hover:bg-white/10">
            <Link href="/">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              <span>Home</span>
            </Link>
          </Button>
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
      className="group block"
    >
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-indigo-500/50 hover:bg-white/10 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition">
              {tournament.name}
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              Season {tournament.season}/{tournament.season + 1}
            </p>
          </div>
          <Badge
            variant={tournament.status === "PUBLISHED" ? "success" : "secondary"}
            className="font-bold"
          >
            {tournament.status === "PUBLISHED" ? "ACTIVE" : "FINISHED"}
          </Badge>
        </div>
        <div className="mt-4 flex gap-4 text-sm text-gray-400">
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
