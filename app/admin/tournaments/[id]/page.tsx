import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TournamentActions } from "@/components/tournament-actions";

export default async function TournamentManagementPage(
  props: PageProps<"/admin/tournaments/[id]">
) {
  const { id } = await props.params;

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
          <div className="mt-1 flex items-center gap-3">
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
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                tournament.allowBenchBoost
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              {tournament.allowBenchBoost ? "💺 BB: Allowed" : "🚫 BB: Disabled"}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                tournament.allowTripleCaptain
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              {tournament.allowTripleCaptain ? "👑 TC: Allowed (3x)" : "🚫 TC: Reduced (2x)"}
            </span>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {tournament.status === "PUBLISHED" && (
            <Link
              href={`/tournaments/${tournament.id}`}
              target="_blank"
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              🌐 View Public Page ↗
            </Link>
          )}
          <Link
            href={`/admin/tournaments/${tournament.id}/edit`}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            ✏️ Edit Info
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
          <p className="text-xs font-medium text-gray-500 uppercase">Rounds</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {tournament.rounds.length}
          </p>
          <p className="text-xs text-gray-500">Knockout stages</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase">Matches</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {completedMatches.length} / {allMatches.length}
          </p>
          <p className="text-xs text-gray-500">
            {allMatches.filter((m) => m.status === "FINALIZED").length} finalized
          </p>
        </div>
      </div>

      {/* Navigation & Management Hub Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Groups Hub Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                👥 Participating Groups ({tournament.groups.length})
              </h2>
              <Link
                href={`/admin/tournaments/${tournament.id}/groups`}
                className="rounded-md bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                Manage Groups →
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
              <h2 className="text-lg font-bold text-gray-900">
                📅 Schedule & Matches ({tournament.rounds.length} Rounds)
              </h2>
              <Link
                href={`/admin/tournaments/${tournament.id}/schedule`}
                className="rounded-md bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                Configure Schedule →
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
        <h2 className="text-lg font-bold text-gray-900">
          ⚙️ Lifecycle & Actions
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
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Open Schedule Builder →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
