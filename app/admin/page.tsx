import { prisma } from "@/lib/db";
import Link from "next/link";
import { TournamentActions } from "@/components/tournament-actions";

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
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-2 text-gray-600">Manage tournaments and competitions</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-gray-600">Total Tournaments</p>
          <p className="text-3xl font-bold text-gray-900">
            {tournaments.length}
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-gray-600">Published</p>
          <p className="text-3xl font-bold text-gray-900">
            {tournaments.filter((t) => t.status === "PUBLISHED").length}
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-sm text-gray-600">Draft</p>
          <p className="text-3xl font-bold text-gray-900">
            {tournaments.filter((t) => t.status === "DRAFT").length}
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Tournaments</h3>
          <Link
            href="/admin/tournaments/new"
            className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            Create Tournament
          </Link>
        </div>

        {tournaments.length === 0 ? (
          <p className="mt-4 text-gray-600">No tournaments yet. Create your first tournament to get started.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {tournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="space-y-2 rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <Link
                      href={`/admin/tournaments/${tournament.id}/groups`}
                      className="font-semibold text-gray-900 hover:text-indigo-600"
                    >
                      {tournament.name}
                    </Link>
                    <p className="text-sm text-gray-600">
                      Season {tournament.season} · {tournament.groups.length}{" "}
                      groups · {tournament.rounds.reduce((acc, r) => acc + r.matches.length, 0)} matches
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      tournament.status === "DRAFT"
                        ? "bg-yellow-100 text-yellow-800"
                        : tournament.status === "PUBLISHED"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {tournament.status}
                  </span>
                </div>
                <TournamentActions
                  tournamentId={tournament.id}
                  tournamentName={tournament.name}
                  status={tournament.status as "DRAFT" | "PUBLISHED" | "FINISHED"}
                  hasGroups={tournament.groups.length > 0}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
