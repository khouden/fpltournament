import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ScheduleBuilder } from "@/components/schedule-builder";
import { TournamentWizardStepper } from "@/components/tournament-wizard-stepper";
import { ArrowLeft, ArrowRight, AlertTriangle, ChevronRight, Crown, Shield, Rocket, Calendar } from "lucide-react";
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
  const isDraft = tournament.status === "DRAFT";

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
            Tournament Schedule &amp; Fixtures
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] font-medium max-w-2xl">
            Build rounds, manage fixtures, calculate scores, and finalize results.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="shrink-0 self-start sm:self-center flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-9 px-3.5 text-xs font-semibold text-[#1F1F1F] border-[#E5E5E5] bg-white hover:bg-[#F7F7F7] hover:border-[#37003C]/40 hover:text-[#37003C] rounded-[8px] transition-colors gap-1.5 shadow-2xs cursor-pointer"
          >
            <Link href={`/admin/tournaments/${id}/groups?wizard=true`}>
              <ArrowLeft className="h-4 w-4 text-[#37003C]" />
              <span>Groups</span>
            </Link>
          </Button>

          <Button
            variant="default"
            size="sm"
            asChild
            className="h-9 px-4 text-xs font-bold bg-[#37003C] hover:bg-[#5A0A63] text-white rounded-[8px] transition-colors gap-2 shadow-xs cursor-pointer"
          >
            <Link href={`/admin/tournaments/${id}/publish`}>
              <span>Next: Review &amp; Publish</span>
              <ArrowRight className="h-4 w-4 text-[#00FF87]" />
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Wizard Stepper Bar */}
      <TournamentWizardStepper
        currentStep={3}
        tournamentId={tournament.id}
        tournamentStatus={tournament.status as "DRAFT" | "PUBLISHED" | "FINISHED"}
      />

      {/* Wizard Guidance Banner */}
      {isDraft && (
        <div className="rounded-[12px] border border-[#00FF87]/40 bg-[#00FF87]/10 p-4 text-[#1F1F1F] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fpl-fade-in">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-[#37003C] text-[#00FF87] flex items-center justify-center shrink-0 text-xs font-black mt-0.5 sm:mt-0">
              3
            </div>
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-[#37003C]">
                Step 3 of 4: Build Rounds &amp; Generate Fixtures
              </p>
              <p className="text-xs text-[#555555] mt-0.5">
                Use Auto-Generate Round-Robin or manually create rounds for each FPL Gameweek. Once fixtures are generated, advance to Review &amp; Publish.
              </p>
            </div>
          </div>

          <div className="shrink-0 self-end sm:self-center flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border bg-white text-[#37003C] border-[#37003C]/20 shadow-2xs">
              <Calendar className="h-3.5 w-3.5 text-[#37003C]" />
              <span>
                {tournament.rounds.length} {tournament.rounds.length === 1 ? "Round" : "Rounds"} · {totalMatches} {totalMatches === 1 ? "Match" : "Matches"}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* 3. Tournament Context Card */}
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

      {/* 4. Groups Warning (if < 2 groups) */}
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
            <Link href={`/admin/tournaments/${id}/groups?wizard=true`}>
              <span>Import Groups</span>
            </Link>
          </Button>
        </div>
      )}

      {/* 5. Schedule Builder Workspace */}
      <ScheduleBuilder
        tournamentId={tournament.id}
        initialRounds={tournament.rounds}
        groups={tournament.groups.map((g) => ({
          id: g.id,
          name: g.name,
          logo: g.logo,
        }))}
      />

      {/* 6. Bottom Wizard Navigation Footer */}
      <div className="rounded-[16px] border border-[#E5E5E5] bg-white p-4 sm:p-5 shadow-fpl-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-10 px-4 text-xs font-semibold text-[#555555] hover:text-[#1F1F1F] border-[#D5D5D5] bg-white hover:bg-[#F9F9F9] rounded-[8px] gap-2 w-full sm:w-auto cursor-pointer"
        >
          <Link href={`/admin/tournaments/${tournament.id}/groups?wizard=true`}>
            <ArrowLeft className="h-4 w-4" />
            <span>Step 2: Groups &amp; Rosters</span>
          </Link>
        </Button>

        <div className="text-center sm:text-right flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-xs text-[#777777] font-medium hidden md:inline">
            {tournament.rounds.length > 0 && totalMatches > 0
              ? `${tournament.rounds.length} rounds and ${totalMatches} matches ready for publishing`
              : "Generate fixtures before publishing live"}
          </span>

          <Button
            size="sm"
            asChild
            className="h-10 px-6 text-xs sm:text-sm font-bold bg-[#37003C] hover:bg-[#5A0A63] text-white rounded-[8px] gap-2 shadow-sm w-full sm:w-auto cursor-pointer"
          >
            <Link href={`/admin/tournaments/${tournament.id}/publish`}>
              <span>Step 4: Continue to Review &amp; Publish</span>
              <ArrowRight className="h-4 w-4 text-[#00FF87]" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
