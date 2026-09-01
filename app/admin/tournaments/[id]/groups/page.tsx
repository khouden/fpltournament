import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { GroupManager } from "@/components/group-manager";
import { ArrowRight, ArrowLeft } from "lucide-react";

export default async function GroupsPage(
  props: PageProps<"/admin/tournaments/[id]/groups">
) {
  const { id } = await props.params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      groups: {
        include: { members: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!tournament) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/admin" className="hover:text-indigo-600">
              Dashboard
            </Link>
            <span>/</span>
            <Link href={`/admin/tournaments/${id}`} className="hover:text-indigo-600">
              {tournament.name}
            </Link>
            <span>/</span>
            <span>Groups</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            Manage Groups
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/tournaments/${id}/schedule`}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <span>Schedule</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Tournament Info */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">
              Season {tournament.season} · Admin FPL ID: {tournament.adminFplId}
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

      {/* Group Manager */}
      <div className="rounded-lg bg-white p-6 shadow">
        <GroupManager
          tournamentId={tournament.id}
          initialGroups={tournament.groups}
        />
      </div>
    </div>
  );
}
