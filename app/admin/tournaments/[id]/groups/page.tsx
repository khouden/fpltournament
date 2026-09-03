import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { GroupManager } from "@/components/group-manager";
import { ArrowRight, Crown, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default async function GroupsPage(
  props: PageProps<"/admin/tournaments/[id]/groups">
) {
  const { id } = await props.params;

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
    },
  });

  if (!tournament) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/admin" className="hover:text-indigo-600 transition">
              Dashboard
            </Link>
            <span>/</span>
            <Link href={`/admin/tournaments/${id}`} className="hover:text-indigo-600 transition">
              {tournament.name}
            </Link>
            <span>/</span>
            <span className="font-medium text-gray-700">Groups</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            Manage Groups
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href={`/admin/tournaments/${id}/schedule`}>
              <span>Schedule</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Tournament Info */}
      <Card className="p-4 shadow-xs border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-gray-700 font-medium">
              Season {tournament.season}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="font-semibold text-gray-600">
                Organizers ({tournament.admins.length}):
              </span>
              {tournament.admins.length > 0 ? (
                tournament.admins.map((a) => (
                  <Badge
                    key={a.fplId}
                    variant={a.isPrimary ? "warning" : "secondary"}
                    className="gap-1 font-medium"
                  >
                    {a.isPrimary ? (
                      <Crown className="h-3 w-3 text-amber-500" />
                    ) : (
                      <Shield className="h-3 w-3 text-indigo-500" />
                    )}
                    <span>{a.name || `Admin #${a.fplId}`}</span>
                    <span className="text-[10px] opacity-75">#{a.fplId}</span>
                  </Badge>
                ))
              ) : (
                <span>Admin FPL ID: #{tournament.adminFplId}</span>
              )}
            </div>
          </div>
          <Badge
            variant={
              tournament.status === "PUBLISHED"
                ? "success"
                : tournament.status === "DRAFT"
                  ? "warning"
                  : "secondary"
            }
          >
            {tournament.status}
          </Badge>
        </div>
      </Card>

      {/* Group Manager */}
      <Card className="p-6 shadow-xs border-gray-200">
        <GroupManager
          tournamentId={tournament.id}
          initialGroups={tournament.groups}
        />
      </Card>
    </div>
  );
}
