import { prisma } from "@/lib/db";
import { FPLVerifier } from "@/components/fpl-verifier";
import Link from "next/link";
import type { FPLManager } from "@/lib/fpl";

export default async function AdminDashboard() {
  const tournaments = await prisma.tournament.findMany({
    include: {
      groups: true,
    },
  });

  const handleFPLVerified = (manager: FPLManager) => {
    // This will be used when creating tournaments
    console.log("Manager verified:", manager);
  };

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
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
            <p className="mt-4 text-gray-600">No tournaments yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {tournament.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Season {tournament.season} · {tournament.groups.length} groups
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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
                    <div className="flex gap-1">
                      <button className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200">
                        Edit
                      </button>
                      <button className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <FPLVerifier onVerified={handleFPLVerified} />
      </div>
    </div>
  );
}
