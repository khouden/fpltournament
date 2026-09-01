import { prisma } from "@/lib/db";
import { FPLVerifier } from "@/components/fpl-verifier";
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
            <button className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
              Create Tournament
            </button>
          </div>

          {tournaments.length === 0 ? (
            <p className="mt-4 text-gray-600">No tournaments yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                      Season
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tournaments.map((tournament) => (
                    <tr
                      key={tournament.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {tournament.name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {tournament.season}
                      </td>
                      <td className="px-4 py-2 text-sm">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <FPLVerifier onVerified={handleFPLVerified} />
      </div>
    </div>
  );
}
