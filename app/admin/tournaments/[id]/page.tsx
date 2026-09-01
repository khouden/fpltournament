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
  ShieldAlert,
} from "lucide-react";

export default async function TournamentManagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
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
            <Link href="/admin" className="hover:text-indigo-600">
              Dashboard
            </Link>
            <span>/</span>
            <span className="font-medium text-gray-700">{tournament.name}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">
              {tournament.name}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                tournament.status === "DRAFT"
                  ? "bg-yellow-100 text-yellow-800"
                  : tournament.status === "PUBLISHED"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
              }`}
            >
              {tournament.status}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                tournament.allowBenchBoost
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              {tournament.allowBenchBoost ? (
                <>
                  <Armchair className="h-3.5 w-3.5" />
                  <span>BB: Allowed</span>
                </>
              ) : (
                <>
                  <Ban className="h-3.5 w-3.5 text-amber-700" />
                  <span>BB: Disabled</span>
                </>
              )}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                tournament.allowTripleCaptain
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
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
            </span>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {tournament.status === "PUBLISHED" && (
            <Link
              href={`/tournaments/${tournament.id}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>View Public Page</span>
            </Link>
          )}
          <Link
            href={`/admin/tournaments/${tournament.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Edit Info</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase">Season & Admin</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {tournament.season}
          </p>
          <p className="text-xs text-gray-500">Admin FPL ID: {tournament.adminFplId}</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase">Groups</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {tournament.groups.length}
          </p>
          <p className="text-xs text-gray-500">
            {tournament.groups.reduce((acc, g) => acc + g.members.filter((m) => !m.isAdmin).length, 0)} total players
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase">Gameweek Rounds</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {tournament.rounds.length}
          </p>
          <p className="text-xs text-gray-500">Scheduled rounds</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase">Fixtures</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {completedMatches.length} / {allMatches.length}
          </p>
          <p className="text-xs text-gray-500">
            {allMatches.filter((m) => m.status === "FINALIZED").length} finalized
          </p>
        </div>
      </div>

      {/* Live League Standings Table */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
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
      </div>

      {/* Navigation & Management Hub Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Groups Hub Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                <span>Participating Groups ({tournament.groups.length})</span>
              </h2>
              <Link
                href={`/admin/tournaments/${tournament.id}/groups`}
                className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                <span>Manage Groups</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Import Classic Leagues from FPL, verify admin membership, and view team rosters.
            </p>

            <div className="mt-4 divide-y divide-gray-100">
              {tournament.groups.length === 0 ? (
                <p className="py-2 text-xs italic text-gray-400">
                  No groups imported yet. Click "Manage Groups" to import from FPL.
                </p>
              ) : (
                tournament.groups.slice(0, 4).map((g) => (
                  <div key={g.id} className="py-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-800">{g.name}</span>
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
        </div>

        {/* Schedule Hub Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                <span>Schedule & Matches ({tournament.rounds.length} Rounds)</span>
              </h2>
              <Link
                href={`/admin/tournaments/${tournament.id}/schedule`}
                className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                <span>Configure Schedule</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Build rounds, assign Gameweeks, set up knockout fixtures, and resolve winner progression.
            </p>

            <div className="mt-4 space-y-2">
              {tournament.rounds.length === 0 ? (
                <p className="py-2 text-xs italic text-gray-400">
                  No rounds scheduled yet. Click "Configure Schedule" to add fixtures.
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
        </div>
      </div>

      {/* Tournament Lifecycle & Control Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-700" />
          <span>Lifecycle & Actions</span>
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
            <Link
              href={`/admin/tournaments/${tournament.id}/schedule`}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
            >
              <span>Open Schedule Builder</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
