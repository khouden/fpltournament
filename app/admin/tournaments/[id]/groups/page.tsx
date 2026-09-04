import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { GroupManager } from "@/components/group-manager";
import { ArrowRight, ChevronRight, Crown, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      rounds: {
        orderBy: { roundNumber: "asc" },
        take: 1,
      },
    },
  });

  if (!tournament) {
    notFound();
  }

  const defaultGameweek = tournament.rounds[0]?.gameweek || 1;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fpl-fade-in">
      {/* 1. Breadcrumb & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs sm:text-sm text-[#777777]">
            <Link
              href="/admin"
              className="font-medium text-[#666666] hover:text-[#37003C] transition-colors"
            >
              Dashboard
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-[#AAAAAA] shrink-0" />
            <Link
              href={`/admin/tournaments/${id}`}
              className="font-medium text-[#666666] hover:text-[#37003C] transition-colors truncate max-w-[180px] sm:max-w-xs"
              title={tournament.name}
            >
              {tournament.name}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-[#AAAAAA] shrink-0" />
            <span className="font-semibold text-[#1F1F1F]">Groups</span>
          </nav>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F1F1F] tracking-tight leading-tight">
            Manage Groups
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] font-medium max-w-2xl">
            Import FPL leagues, manage participating teams, and review tournament rosters.
          </p>
        </div>

        {/* Header Action: Navigate to Schedule */}
        <div className="shrink-0 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-9 px-3.5 text-xs font-semibold text-[#1F1F1F] border-[#E5E5E5] bg-white hover:bg-[#F7F7F7] hover:border-[#37003C]/40 hover:text-[#37003C] rounded-[8px] transition-colors gap-1.5 shadow-2xs"
          >
            <Link href={`/admin/tournaments/${id}/schedule`}>
              <span>Schedule</span>
              <ArrowRight className="h-4 w-4 text-[#37003C]" />
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Tournament Context Card */}
      <section
        aria-label="Tournament Context"
        className="rounded-[14px] border border-[#E5E5E5] bg-white p-4 sm:p-5 shadow-fpl-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-[#1F1F1F]">
                {tournament.name}
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-[6px] bg-[#37003C]/5 text-[#37003C] border border-[#37003C]/10">
                Season {tournament.season}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-[#777777]">Organizers:</span>
              {tournament.admins.length > 0 ? (
                tournament.admins.map((a) => (
                  <span
                    key={a.fplId}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-semibold border ${
                      a.isPrimary
                        ? "bg-amber-500/10 text-amber-800 border-amber-500/30 shadow-2xs"
                        : "bg-[#37003C]/5 text-[#37003C] border-[#37003C]/15"
                    }`}
                  >
                    {a.isPrimary ? (
                      <Crown className="h-3.5 w-3.5 text-amber-600" />
                    ) : (
                      <Shield className="h-3.5 w-3.5 text-[#37003C]" />
                    )}
                    <span>{a.name || `Admin #${a.fplId}`}</span>
                    <span className="font-mono text-[10px] opacity-70">#{a.fplId}</span>
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-semibold bg-[#37003C]/5 text-[#37003C] border border-[#37003C]/15">
                  <Crown className="h-3.5 w-3.5 text-amber-600" />
                  <span>Admin #{tournament.adminFplId}</span>
                </span>
              )}
            </div>
          </div>

          {/* Tournament Status Badge */}
          <div className="self-start sm:self-center shrink-0">
            {tournament.status === "PUBLISHED" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>PUBLISHED</span>
              </span>
            ) : tournament.status === "DRAFT" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>DRAFT</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 shadow-2xs">
                <span>{tournament.status}</span>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 3. Group Manager Workspace */}
      <GroupManager
        tournamentId={tournament.id}
        tournamentName={tournament.name}
        initialGroups={tournament.groups}
        initialAdmins={tournament.admins.map((a) => ({
          fplId: a.fplId,
          name: a.name,
          teamName: a.teamName,
          isPrimary: a.isPrimary,
        }))}
        gameweek={defaultGameweek}
        allowBenchBoost={tournament.allowBenchBoost}
        allowTripleCaptain={tournament.allowTripleCaptain}
      />
    </div>
  );
}
