import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ScheduleBuilder } from "@/components/schedule-builder";
import { ArrowLeft, AlertTriangle, ChevronRight, Crown, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function SchedulePage(
  props: PageProps<"/admin/tournaments/[id]/schedule">
) {
  const { id } = await props.params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      admins: {
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      },
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

  const totalMatches = tournament.rounds.reduce(
    (acc, r) => acc + r.matches.length,
    0
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-fpl-fade-in">
      {/* 1. Breadcrumb & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs sm:text-sm text-[#777777]"
          >
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
            <span className="font-semibold text-[#1F1F1F]">Schedule</span>
          </nav>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F1F1F] tracking-tight leading-tight">
            Tournament Schedule
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] font-medium max-w-2xl">
            Build rounds, manage fixtures, calculate scores, and finalize results.
          </p>
        </div>

        {/* Header Action: Back to Groups */}
        <div className="shrink-0 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-9 px-3.5 text-xs font-semibold text-[#1F1F1F] border-[#E5E5E5] bg-white hover:bg-[#F7F7F7] hover:border-[#37003C]/40 hover:text-[#37003C] rounded-[8px] transition-colors gap-1.5 shadow-2xs"
          >
            <Link href={`/admin/tournaments/${id}/groups`}>
              <ArrowLeft className="h-4 w-4 text-[#37003C]" />
              <span>Groups</span>
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
              <span className="text-xs text-[#666666] font-medium">
                · {tournament.groups.length}{" "}
                {tournament.groups.length === 1 ? "Group" : "Groups"} ·{" "}
                {totalMatches} {totalMatches === 1 ? "Match" : "Matches"}
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
                    <span className="font-mono text-[10px] opacity-70">
                      #{a.fplId}
                    </span>
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

      {/* 3. Groups Warning (if < 2 groups) */}
      {tournament.groups.length < 2 && (
        <div
          role="alert"
          className="rounded-[12px] border border-amber-300 bg-amber-50/90 p-4 text-amber-900 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-900">
                Minimum Groups Required
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                You need at least 2 groups to create matches. Import groups first.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="self-start sm:self-center shrink-0 h-8 px-3 text-xs font-bold border-amber-300 bg-white text-amber-900 hover:bg-amber-100/60 shadow-2xs"
          >
            <Link href={`/admin/tournaments/${id}/groups`}>
              <span>Import Groups</span>
            </Link>
          </Button>
        </div>
      )}

      {/* 4. Schedule Builder Workspace */}
      <ScheduleBuilder
        tournamentId={tournament.id}
        initialRounds={tournament.rounds}
        groups={tournament.groups.map((g) => ({
          id: g.id,
          name: g.name,
          logo: g.logo,
        }))}
      />
    </div>
  );
}
