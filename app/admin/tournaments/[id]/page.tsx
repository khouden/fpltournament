import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TournamentActions } from "@/components/tournament-actions";
import { calculateLeagueStandings } from "@/lib/scoring";
import { LeagueTable } from "@/components/league-table";
import {
  Trophy,
  Users,
  Calendar,
  Settings,
  ExternalLink,
  Pencil,
  ArrowRight,
  Armchair,
  Crown,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

export default async function TournamentManagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      admins: {
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      },
      groups: {
        include: { members: true },
        orderBy: { createdAt: "asc" },
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

  if (!tournament) {
    notFound();
  }

  const standings = await calculateLeagueStandings(tournament.id);
  const allMatches = tournament.rounds.flatMap((r) => r.matches);
  const completedMatches = allMatches.filter(
    (m) => m.status === "COMPLETED" || m.status === "FINALIZED"
  );

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/admin" className="hover:text-indigo-600 transition">
              Dashboard
            </Link>
            <span>/</span>
            <span className="font-medium text-gray-700">{tournament.name}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">
              {tournament.name}
            </h1>
            <Badge
              variant={
                tournament.status === "PUBLISHED"
                  ? "success"
                  : tournament.status === "DRAFT"
                    ? "warning"
                    : "secondary"
              }
              className="font-bold"
            >
              {tournament.status}
            </Badge>
            <Badge
              variant={tournament.allowBenchBoost ? "secondary" : "warning"}
              className="gap-1 font-medium"
            >
              {tournament.allowBenchBoost ? (
                <>
                  <Armchair className="h-3.5 w-3.5 text-indigo-600" />
                  <span>BB: Allowed</span>
                </>
              ) : (
                <>
                  <Ban className="h-3.5 w-3.5 text-amber-700" />
                  <span>BB: Disabled</span>
                </>
              )}
            </Badge>
            <Badge
              variant={tournament.allowTripleCaptain ? "secondary" : "warning"}
              className="gap-1 font-medium"
            >
              {tournament.allowTripleCaptain ? (
                <>
                  <Crown className="h-3.5 w-3.5 text-amber-600" />
                  <span>TC: Allowed (3x)</span>
                </>
              ) : (
                <>
                  <Ban className="h-3.5 w-3.5 text-amber-700" />
                  <span>TC: Reduced (2x)</span>
                </>
              )}
            </Badge>
            {tournament.admins.length > 0 && (
              <Badge variant="secondary" className="gap-1 font-medium">
                <Users className="h-3.5 w-3.5 text-indigo-600" />
                <span>
                  {tournament.admins.length} Admin{tournament.admins.length > 1 ? "s" : ""}
                </span>
              </Badge>
            )}
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {tournament.status === "PUBLISHED" && (
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link href={`/tournaments/${tournament.id}`} target="_blank">
                <ExternalLink className="h-3.5 w-3.5" />
                <span>View Public Page</span>
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href={`/admin/tournaments/${tournament.id}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit Info</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 shadow-xs border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase">Season &amp; Admins</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            Season {tournament.season}
          </p>
          <div className="mt-1 space-y-0.5">
            {tournament.admins.length > 0 ? (
              tournament.admins.slice(0, 2).map((a) => (
                <p key={a.fplId} className="text-xs text-gray-600 truncate">
                  <span className="font-semibold text-gray-800">
                    {a.isPrimary ? "👑 " : "🛡️ "}
                    {a.name || `Admin #${a.fplId}`}
                  </span>{" "}
                  (#{a.fplId})
                </p>
              ))
            ) : (
              <p className="text-xs text-gray-500">Admin FPL ID: #{tournament.adminFplId}</p>
            )}
            {tournament.admins.length > 2 && (
              <p className="text-[11px] text-indigo-600">
                +{tournament.admins.length - 2} more co-admin{tournament.admins.length - 2 > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </Card>

        <Card className="p-4 shadow-xs border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase">Groups</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {tournament.groups.length}
          </p>
          <p className="text-xs text-gray-500">
            {tournament.groups.reduce((acc, g) => acc + g.members.filter((m) => !m.isAdmin).length, 0)} total players
          </p>
        </Card>

        <Card className="p-4 shadow-xs border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase">Gameweek Rounds</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {tournament.rounds.length}
          </p>
          <p className="text-xs text-gray-500">Scheduled rounds</p>
        </Card>

        <Card className="p-4 shadow-xs border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase">Fixtures</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {completedMatches.length} / {allMatches.length}
          </p>
          <p className="text-xs text-gray-500">
            {allMatches.filter((m) => m.status === "FINALIZED").length} finalized
          </p>
        </Card>
      </div>

      {/* Live League Standings Table */}
      <Card className="p-6 shadow-xs border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span>Live League Standings</span>
            </h2>
            <p className="text-xs text-gray-500">
              Live points table: +3 PTS for Win, +1 PT for Draw, 0 PTS for Loss.
            </p>
          </div>
        </div>
        <LeagueTable standings={standings} />
      </Card>

      {/* Navigation & Management Hub Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Groups Hub Card */}
        <Card className="p-6 shadow-xs border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                <span>Participating Groups ({tournament.groups.length})</span>
              </h2>
              <Button variant="outline" size="sm" asChild className="gap-1 text-xs text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100">
                <Link href={`/admin/tournaments/${tournament.id}/groups`}>
                  <span>Manage Groups</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Import Classic Leagues from FPL, verify admin membership, and view team rosters.
            </p>

            <div className="mt-4 divide-y divide-gray-100">
              {tournament.groups.length === 0 ? (
                <p className="py-2 text-xs italic text-gray-400">
                  No groups imported yet. Click &quot;Manage Groups&quot; to import from FPL.
                </p>
              ) : (
                tournament.groups.slice(0, 4).map((g) => (
                  <div key={g.id} className="py-2.5 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5">
                      {g.logo ? (
                        <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gray-50 p-0.5 border border-gray-200">
                          <img
                            src={g.logo}
                            alt={g.name}
                            className="h-4 w-4 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-indigo-50 text-[10px] font-bold text-indigo-700">
                          {g.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{g.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {g.members.filter((m) => !m.isAdmin).length} players
                    </span>
                  </div>
                ))
              )}
              {tournament.groups.length > 4 && (
                <p className="pt-2 text-xs text-indigo-600">
                  + {tournament.groups.length - 4} more groups...
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Schedule Hub Card */}
        <Card className="p-6 shadow-xs border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                <span>Schedule &amp; Matches ({tournament.rounds.length} Rounds)</span>
              </h2>
              <Button variant="outline" size="sm" asChild className="gap-1 text-xs text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100">
                <Link href={`/admin/tournaments/${tournament.id}/schedule`}>
                  <span>Configure Schedule</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Build rounds, assign Gameweeks, set up knockout fixtures, and resolve winner progression.
            </p>

            <div className="mt-4 space-y-2">
              {tournament.rounds.length === 0 ? (
                <p className="py-2 text-xs italic text-gray-400">
                  No rounds scheduled yet. Click &quot;Configure Schedule&quot; to add fixtures.
                </p>
              ) : (
                tournament.rounds.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded bg-gray-50 p-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-gray-900">
                        {r.name || `Round ${r.roundNumber}`}
                      </span>
                      <span className="ml-2 text-gray-500">GW {r.gameweek}</span>
                    </div>
                    <span className="font-semibold text-gray-700">
                      {r.matches.length} matches
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Tournament Lifecycle & Control Card */}
      <Card className="p-6 shadow-xs border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-700" />
          <span>Lifecycle &amp; Actions</span>
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Validate schedule, publish tournament to public visitors, or recalculate results with live FPL data.
        </p>

        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <TournamentActions
            tournamentId={tournament.id}
            tournamentName={tournament.name}
            status={tournament.status as "DRAFT" | "PUBLISHED" | "FINISHED"}
            hasGroups={tournament.groups.length > 0}
          />

          <div className="flex gap-2">
            <Button asChild className="gap-1.5">
              <Link href={`/admin/tournaments/${tournament.id}/schedule`}>
                <span>Open Schedule Builder</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
