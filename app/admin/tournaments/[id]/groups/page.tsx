import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { GroupManager } from "@/components/group-manager";
import { TournamentWizardStepper } from "@/components/tournament-wizard-stepper";
import { ArrowLeft, ArrowRight, ChevronRight, Crown, Shield, Users, Info, Calendar } from "lucide-react";
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
        include: {
          members: true,
          _count: {
            select: {
              homeMatches: true,
              awayMatches: true,
            },
          },
        },
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
  const isDraft = tournament.status === "DRAFT";
  const hasEnoughGroups = tournament.groups.length >= 2;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fpl-fade-in">
      {/* 1. Breadcrumb & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            <Link
              href="/admin"
              className="font-semibold text-gray-600 hover:text-[#37003C] transition-colors"
            >
              Dashboard
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <Link
              href={`/admin/tournaments/${id}`}
              className="font-semibold text-gray-600 hover:text-[#37003C] transition-colors truncate max-w-[180px] sm:max-w-xs"
              title={tournament.name}
            >
              {tournament.name}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span className="font-bold text-[#1F1F1F]">Groups &amp; Rosters</span>
          </nav>

          <h1 className="text-2xl sm:text-3xl font-black text-[#1F1F1F] tracking-tight leading-tight flex items-center gap-2.5">
            <span>Manage Groups &amp; Rosters</span>
            <Users className="h-6 w-6 text-[#37003C]" />
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-2xl">
            Import FPL Classic Leagues, assign team logos, and configure active player rosters.
          </p>
        </div>

        {/* Header Action: Navigate to Schedule */}
        <div className="shrink-0 self-start sm:self-center flex items-center gap-2">
          <Button
            size="sm"
            asChild
            className="h-9 px-4 text-xs font-black bg-[#37003C] hover:bg-[#5A0A63] text-white rounded-xl transition-all gap-2 shadow-xs cursor-pointer"
          >
            <Link href={`/admin/tournaments/${id}/schedule?wizard=true`}>
              <span>Next: Schedule</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#00FF87]" />
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Wizard Stepper Bar */}
      <TournamentWizardStepper
        currentStep={2}
        tournamentId={tournament.id}
        tournamentStatus={tournament.status as "DRAFT" | "PUBLISHED" | "FINISHED"}
      />

      {/* Wizard Guidance Banner */}
      {isDraft && (
        <div className="rounded-2xl border border-[#00FF87]/40 bg-[#00FF87]/10 p-4 text-[#1F1F1F] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fpl-fade-in">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-[#37003C] text-[#00FF87] flex items-center justify-center shrink-0 text-xs font-black mt-0.5 sm:mt-0 shadow-xs">
              2
            </div>
            <div>
              <p className="text-xs sm:text-sm font-black text-[#37003C]">
                Step 2 of 4: Add Participating Groups
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                Import or configure at least 2 groups. Once ready, proceed to build your tournament match schedule.
              </p>
            </div>
          </div>

          <div className="shrink-0 self-end sm:self-center flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border shadow-2xs ${
                hasEnoughGroups
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : "bg-amber-100 text-amber-800 border-amber-300"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>
                {tournament.groups.length}{" "}
                {tournament.groups.length === 1 ? "Group" : "Groups"} Added
              </span>
            </span>
          </div>
        </div>
      )}

      {/* 3. Tournament Context Card */}
      <section
        aria-label="Tournament Context"
        className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <h2 className="text-base sm:text-lg font-black text-[#1F1F1F]">
                {tournament.name}
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#37003C]/5 text-[#37003C] border border-[#37003C]/10">
                Season {tournament.season}/{tournament.season + 1}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-gray-500">Organizers:</span>
              {tournament.admins.length > 0 ? (
                tournament.admins.map((a) => (
                  <span
                    key={a.fplId}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      a.isPrimary
                        ? "bg-amber-50 text-amber-800 border-amber-300 shadow-2xs"
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
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#37003C]/5 text-[#37003C] border border-[#37003C]/15">
                  <Crown className="h-3.5 w-3.5 text-amber-600" />
                  <span>Admin #{tournament.adminFplId}</span>
                </span>
              )}
            </div>
          </div>

          {/* Tournament Status Badge */}
          <div className="self-start sm:self-center shrink-0">
            {tournament.status === "PUBLISHED" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>PUBLISHED LIVE</span>
              </span>
            ) : tournament.status === "DRAFT" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>DRAFT SETUP</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 shadow-2xs">
                <span>{tournament.status}</span>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 4. Group Manager Workspace */}
      <GroupManager
        tournamentId={tournament.id}
        tournamentName={tournament.name}
        initialGroups={tournament.groups.map((g) => ({
          id: g.id,
          name: g.name,
          logo: g.logo,
          fplLeagueId: g.fplLeagueId,
          members: g.members,
          matchesCount: (g._count?.homeMatches || 0) + (g._count?.awayMatches || 0),
        }))}
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

      {/* 5. Bottom Wizard Navigation Footer */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-10 px-4 text-xs font-bold text-gray-700 hover:text-[#1F1F1F] border-gray-200 bg-white hover:bg-gray-50 rounded-xl gap-2 w-full sm:w-auto cursor-pointer"
        >
          <Link href={`/admin/tournaments/${tournament.id}/edit`}>
            <ArrowLeft className="h-4 w-4" />
            <span>Step 1: Tournament Details</span>
          </Link>
        </Button>

        <div className="text-center sm:text-right flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-xs text-gray-500 font-medium hidden md:inline">
            {hasEnoughGroups
              ? `${tournament.groups.length} groups configured — ready for fixtures`
              : "Add at least 2 groups to generate fixtures"}
          </span>

          <Button
            size="sm"
            asChild
            className="h-10 px-6 text-xs sm:text-sm font-black bg-[#37003C] hover:bg-[#5A0A63] text-white rounded-xl gap-2 shadow-sm w-full sm:w-auto cursor-pointer"
          >
            <Link href={`/admin/tournaments/${tournament.id}/schedule?wizard=true`}>
              <span>Step 3: Continue to Schedule</span>
              <ArrowRight className="h-4 w-4 text-[#00FF87]" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
