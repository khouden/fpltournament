import { prisma } from "@/lib/db";
import Link from "next/link";
import { TournamentActions } from "@/components/tournament-actions";
import { Trophy, Plus, FileText, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboard() {
  const tournaments = await prisma.tournament.findMany({
    include: {
      groups: true,
      rounds: {
        include: {
          matches: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <Card className="p-6 shadow-xs">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-600">Manage tournaments and competitions</p>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Tournaments</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {tournaments.length}
            </p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Trophy className="h-6 w-6" />
          </div>
        </Card>

        <Card className="p-6 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Published</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">
              {tournaments.filter((t) => t.status === "PUBLISHED").length}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </Card>

        <Card className="p-6 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Draft</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">
              {tournaments.filter((t) => t.status === "DRAFT").length}
            </p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <FileText className="h-6 w-6" />
          </div>
        </Card>
      </div>

      <Card className="p-6 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Tournaments</h3>
          <Button asChild className="gap-1.5">
            <Link href="/admin/tournaments/new">
              <Plus className="h-4 w-4" />
              <span>Create Tournament</span>
            </Link>
          </Button>
        </div>

        {tournaments.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">
            No tournaments yet. Create your first tournament to get started.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {tournaments.map((tournament) => (
              <Card
                key={tournament.id}
                className="space-y-3 p-4 hover:bg-gray-50/70 transition border-gray-200 shadow-none"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Link
                      href={`/admin/tournaments/${tournament.id}`}
                      className="font-semibold text-gray-900 hover:text-indigo-600 transition"
                    >
                      {tournament.name}
                    </Link>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Season {tournament.season} · {tournament.groups.length}{" "}
                      groups · {tournament.rounds.reduce((acc, r) => acc + r.matches.length, 0)} matches ·{" "}
                      <span className="font-medium text-xs text-indigo-600">
                        {`BB: ${tournament.allowBenchBoost ? "On" : "Off"} · TC: ${tournament.allowTripleCaptain ? "On" : "Off"}`}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        tournament.status === "PUBLISHED"
                          ? "success"
                          : tournament.status === "DRAFT"
                            ? "warning"
                            : "secondary"
                      }
                      className="font-semibold"
                    >
                      {tournament.status}
                    </Badge>
                  </div>
                </div>
                <TournamentActions
                  tournamentId={tournament.id}
                  tournamentName={tournament.name}
                  status={tournament.status as "DRAFT" | "PUBLISHED" | "FINISHED"}
                  hasGroups={tournament.groups.length > 0}
                />
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
