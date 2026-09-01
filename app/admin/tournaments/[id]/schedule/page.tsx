import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ScheduleBuilder } from "@/components/schedule-builder";

export default async function SchedulePage(
  props: PageProps<"/admin/tournaments/[id]/schedule">
) {
  const { id } = await props.params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      groups: {
        orderBy: { name: "asc" },
      },
      rounds: {
        include: {
          matches: {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/admin" className="hover:text-indigo-600">
              Dashboard
            </Link>
            <span>/</span>
            <Link
              href={`/admin/tournaments/${id}/groups`}
              className="hover:text-indigo-600"
            >
              {tournament.name}
            </Link>
            <span>/</span>
            <span>Schedule</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            Tournament Schedule
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/tournaments/${id}/groups`}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ← Groups
          </Link>
        </div>
      </div>

      {/* Tournament Info */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">
              Season {tournament.season} · {tournament.groups.length} groups ·{" "}
              {tournament.rounds.reduce((acc, r) => acc + r.matches.length, 0)}{" "}
              matches
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
      </div>

      {/* Groups Warning */}
      {tournament.groups.length < 2 && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-sm text-yellow-800">
            ⚠ You need at least 2 groups to create matches.{" "}
            <Link
              href={`/admin/tournaments/${id}/groups`}
              className="font-medium underline"
            >
              Import groups first
            </Link>
            .
          </p>
        </div>
      )}

      {/* Schedule Builder */}
      <div className="rounded-lg bg-white p-6 shadow">
        <ScheduleBuilder
          tournamentId={tournament.id}
          initialRounds={tournament.rounds}
          groups={tournament.groups.map((g) => ({ id: g.id, name: g.name }))}
        />
      </div>
    </div>
  );
}
