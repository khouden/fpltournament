import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { TournamentActions } from "@/components/tournament-actions";
import { computeStandingsFromData } from "@/lib/scoring";
import { LeagueTable } from "@/components/league-table";
import { getTournamentBannerOrDefault } from "@/lib/tournament-banners";
import {
  Trophy,
  Users,
  Calendar,
  CalendarCheck,
  Settings,
  ExternalLink,
  Pencil,
  ArrowRight,
  Armchair,
  Crown,
  Ban,
  ChevronRight,
  Shield,
  CheckCircle2,
  ImageIcon,
  Rocket,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TournamentWizardStepper } from "@/components/tournament-wizard-stepper";

export default async function TournamentManagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
        include: {
          matches: {
            include: {
              homeGroup: true,
              awayGroup: true,
            },
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

  const standings = computeStandingsFromData(tournament.groups, tournament.rounds);
  const allMatches = tournament.rounds.flatMap((r) => r.matches);
  const completedMatches = allMatches.filter(
    (m) => m.status === "COMPLETED" || m.status === "FINALIZED"
  );
  const finalizedMatches = allMatches.filter((m) => m.status === "FINALIZED");
  const totalNonAdminPlayers = tournament.groups.reduce(
    (acc, g) => acc + g.members.filter((m) => !m.isAdmin).length,
    0
  );
  const fixtureCompletionPercentage =
    allMatches.length > 0
      ? Math.round((completedMatches.length / allMatches.length) * 100)
      : 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fpl-fade-in">
      {/* 1. Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
        <Link
          href="/admin"
          className="font-semibold text-gray-600 hover:text-[#37003C] transition-colors"
        >
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
        <span
          className="font-bold text-[#1F1F1F] truncate max-w-[200px] sm:max-w-md"
          title={tournament.name}
        >
          {tournament.name}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
        <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#37003C]/5 text-[#37003C] border border-[#37003C]/10">
          Control Center
        </span>
      </nav>

      {/* 2. Cinematic Tournament Hero Banner */}
      {(() => {
        const bannerSrc = getTournamentBannerOrDefault(tournament.banner, tournament.id);
        return (
          <section className="relative rounded-3xl overflow-hidden bg-[#180022] text-white min-h-[280px] sm:min-h-[320px] flex flex-col justify-between p-6 sm:p-8 md:p-10 shadow-xl border border-white/10 group">
            {/* Background Banner Image */}
            <div className="absolute inset-0 z-0">
              <Image
                src={bannerSrc}
                alt={tournament.name}
                fill
                priority
                unoptimized={bannerSrc.startsWith("http")}
                className="object-cover object-center transition-transform duration-700 group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/35" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>

            {/* Top Row inside Hero: Status & Chip Badges */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {tournament.status === "PUBLISHED" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00FF87] px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#063319] shadow-md">
                    <span className="h-2 w-2 rounded-full bg-[#063319] animate-pulse" />
                    <span>PUBLISHED LIVE</span>
                  </span>
                ) : tournament.status === "DRAFT" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-md">
                    <Clock className="h-3 w-3 text-white" />
                    <span>DRAFT SETUP</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-white">
                    <span>{tournament.status}</span>
                  </span>
                )}

                <span className="inline-flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 px-3 py-1 text-xs font-semibold text-white/90">
                  <Calendar className="h-3.5 w-3.5 text-[#00D9FF]" />
                  <span>Season {tournament.season}/{tournament.season + 1}</span>
                </span>

                {tournament.admins.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 px-3 py-1 text-xs font-semibold text-white/90">
                    <Shield className="h-3.5 w-3.5 text-[#00FF87]" />
                    <span>{tournament.admins.length} Admin{tournament.admins.length > 1 ? "s" : ""}</span>
                  </span>
                )}
              </div>

              {/* Action Toolbar on Hero */}
              <div className="flex flex-wrap items-center gap-2">
                {tournament.status === "DRAFT" && (
                  <Button
                    size="sm"
                    asChild
                    className="h-9 px-4 text-xs font-black bg-gradient-to-r from-[#00FF87] to-[#00D9FF] hover:opacity-95 text-[#063319] rounded-xl transition-all shadow-md gap-1.5 border-0 cursor-pointer"
                  >
                    <Link href={`/admin/tournaments/${tournament.id}/publish`}>
                      <Rocket className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>Review &amp; Publish</span>
                    </Link>
                  </Button>
                )}

                {tournament.status === "PUBLISHED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="h-9 px-3.5 text-xs font-bold text-white border-white/30 bg-black/40 hover:bg-white hover:text-[#37003C] backdrop-blur-md rounded-xl gap-1.5 transition-colors cursor-pointer"
                  >
                    <Link
                      href={`/tournaments/${tournament.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-[#00D9FF]" />
                      <span>View Public Page</span>
                    </Link>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-9 px-3.5 text-xs font-bold text-white border-white/30 bg-black/40 hover:bg-white hover:text-[#37003C] backdrop-blur-md rounded-xl gap-1.5 transition-colors cursor-pointer"
                >
                  <Link href={`/admin/tournaments/${tournament.id}/edit`}>
                    <Pencil className="h-3.5 w-3.5 text-[#00FF87]" />
                    <span>Edit Settings</span>
                  </Link>
                </Button>
              </div>
            </div>

            {/* Bottom Row inside Hero: Big Title & Rules Chips */}
            <div className="relative z-10 space-y-4 pt-8">
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.1] drop-shadow-md">
                  {tournament.name}
                </h1>
                <p className="text-xs sm:text-sm text-white/70 font-medium mt-1">
                  {tournament.groups.length} Participating Groups · {allMatches.length} Total Matches · {tournament.rounds.length} Gameweek Rounds
                </p>
              </div>

              {/* Tournament Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-md border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white/95 shadow-xs">
                  <Armchair className="h-3.5 w-3.5 text-[#00FF87]" />
                  <span>Bench Boost</span>
                  {tournament.allowBenchBoost ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00FF87]" />
                  ) : (
                    <span className="text-[10px] text-white/60">(Disabled)</span>
                  )}
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-md border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white/95 shadow-xs">
                  <Crown className="h-3.5 w-3.5 text-[#00D9FF]" />
                  <span>Triple Captain</span>
                  {tournament.allowTripleCaptain ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00D9FF]" />
                  ) : (
                    <span className="text-[10px] text-white/60">(2x Reduced)</span>
                  )}
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Setup Wizard Progress for Draft Tournaments */}
      {tournament.status === "DRAFT" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-500">
              Tournament Setup Wizard Progress
            </h2>
            <Link
              href={
                tournament.groups.length < 2
                  ? `/admin/tournaments/${tournament.id}/groups?wizard=true`
                  : allMatches.length === 0
                  ? `/admin/tournaments/${tournament.id}/schedule?wizard=true`
                  : `/admin/tournaments/${tournament.id}/publish`
              }
              className="text-xs font-bold text-[#37003C] hover:underline flex items-center gap-1"
            >
              <span>Continue Setup</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#00A855]" />
            </Link>
          </div>
          <TournamentWizardStepper
            currentStep={
              tournament.groups.length < 2
                ? 2
                : allMatches.length === 0
                ? 3
                : 4
            }
            tournamentId={tournament.id}
            tournamentStatus="DRAFT"
          />
        </div>
      )}

      {/* 3. 4-Card Key Metrics Grid */}
      <section
        aria-label="Tournament Management Metrics"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
      >
        {/* Metric 1: Season & Admins */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-[#37003C]/30 transition-all duration-200">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Season &amp; Admins
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#37003C]/10 text-[#37003C]">
                <Crown className="h-4.5 w-4.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-[#1F1F1F] tracking-tight">
              {tournament.season}/{tournament.season + 1}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
            {tournament.admins.length > 0 ? (
              <>
                {tournament.admins.slice(0, 2).map((admin) => (
                  <div
                    key={admin.id || admin.fplId}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-[#1F1F1F] flex items-center gap-1 truncate max-w-[140px]">
                      {admin.isPrimary ? (
                        <span title="Primary Admin">👑</span>
                      ) : (
                        <span title="Co-Admin">🛡️</span>
                      )}
                      <span className="truncate">{admin.name || `Admin #${admin.fplId}`}</span>
                    </span>
                    <span className="text-[11px] font-mono font-medium text-gray-400">
                      #{admin.fplId}
                    </span>
                  </div>
                ))}
                {tournament.admins.length > 2 && (
                  <p className="text-[11px] font-bold text-[#37003C]">
                    +{tournament.admins.length - 2} more co-admin{tournament.admins.length - 2 > 1 ? "s" : ""}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs font-medium text-gray-500">
                Admin FPL ID: <span className="font-mono text-[#1F1F1F]">#{tournament.adminFplId}</span>
              </p>
            )}
          </div>
        </div>

        {/* Metric 2: Participating Groups */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-[#37003C]/30 transition-all duration-200">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Participating Groups
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#37003C]/10 text-[#37003C]">
                <Users className="h-4.5 w-4.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-[#1F1F1F] tracking-tight">
              {tournament.groups.length} {tournament.groups.length === 1 ? "Group" : "Groups"}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            {tournament.groups.length > 0 ? (
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#1F1F1F]">
                  {totalNonAdminPlayers} active players
                </span>
                <span className="text-[11px] font-bold text-[#008744] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Imported
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">No groups imported</span>
                <Link
                  href={`/admin/tournaments/${tournament.id}/groups`}
                  className="font-bold text-[#37003C] hover:underline"
                >
                  Import →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Metric 3: Gameweek Rounds */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-[#37003C]/30 transition-all duration-200">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Gameweek Rounds
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#37003C]/10 text-[#37003C]">
                <Calendar className="h-4.5 w-4.5" />
              </div>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-[#1F1F1F] tracking-tight">
              {tournament.rounds.length} {tournament.rounds.length === 1 ? "Round" : "Rounds"}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            {tournament.rounds.length > 0 ? (
              <p className="text-xs font-medium text-gray-500">
                Scheduled in competition
              </p>
            ) : (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">No rounds created</span>
                <Link
                  href={`/admin/tournaments/${tournament.id}/schedule`}
                  className="font-bold text-[#37003C] hover:underline"
                >
                  Create →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Metric 4: Fixtures & Progress */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-[#37003C]/30 transition-all duration-200">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Fixtures
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CalendarCheck className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl sm:text-3xl font-black text-[#1F1F1F] tracking-tight">
                {completedMatches.length} / {allMatches.length}
              </p>
              <span className="text-xs font-bold text-gray-600">
                {fixtureCompletionPercentage}%
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
            {/* Progress Bar */}
            <div
              role="progressbar"
              aria-label="Fixture completion progress"
              aria-valuenow={completedMatches.length}
              aria-valuemin={0}
              aria-valuemax={allMatches.length}
              className="h-2 w-full overflow-hidden rounded-full bg-gray-100"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#37003C] to-[#00FF87] transition-all duration-500 ease-out"
                style={{ width: `${fixtureCompletionPercentage}%` }}
              />
            </div>
            <p className="text-[11px] font-medium text-gray-500">
              {finalizedMatches.length} finalized fixture{finalizedMatches.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Live League Standings Section */}
      <section aria-labelledby="live-standings-heading" className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-0.5">
          <div>
            <h2
              id="live-standings-heading"
              className="text-lg sm:text-xl font-black text-[#1F1F1F] tracking-tight flex items-center gap-2"
            >
              <Trophy className="h-5 w-5 text-amber-500" />
              <span>Live League Standings</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Win +3 · Draw +1 · Loss 0 · Live calculated points table
            </p>
          </div>

          {tournament.status === "PUBLISHED" && (
            <div className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE TABLE</span>
            </div>
          )}
        </div>

        {/* Embedded League Table */}
        <div className="rounded-2xl border border-gray-200/80 bg-white overflow-hidden shadow-xs">
          <LeagueTable standings={standings} />
        </div>
      </section>

      {/* 5. Management Hub (2-Column Cards) */}
      <section aria-label="Tournament Management Hub" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Participating Groups */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-[#37003C]/30 hover:shadow-md transition-all duration-200">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#37003C]/10 text-[#37003C]">
                  <Users className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#1F1F1F]">
                    Participating Groups
                  </h3>
                  <p className="text-xs text-gray-500">
                    {tournament.groups.length} {tournament.groups.length === 1 ? "group" : "groups"} configured
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-8.5 px-3 text-xs font-bold text-[#37003C] border-[#37003C]/20 bg-[#37003C]/5 hover:bg-[#37003C]/10 rounded-xl gap-1 transition-colors"
              >
                <Link href={`/admin/tournaments/${tournament.id}/groups`}>
                  <span>Manage Groups</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <p className="mt-3 text-xs sm:text-sm text-gray-600">
              Import Classic Leagues from FPL, verify admin membership, and view team rosters.
            </p>

            {/* Groups Preview or Empty State */}
            <div className="mt-4">
              {tournament.groups.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                  <p className="text-xs font-bold text-gray-700">
                    No groups imported yet.
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Import your FPL Classic League groups to start building the tournament.
                  </p>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      asChild
                      className="h-8.5 px-4 text-xs font-bold bg-[#37003C] hover:bg-[#5A0A63] text-white rounded-xl"
                    >
                      <Link href={`/admin/tournaments/${tournament.id}/groups`}>
                        Import Groups
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {tournament.groups.slice(0, 4).map((g) => {
                    const nonAdminMemberCount = g.members.filter((m) => !m.isAdmin).length;
                    return (
                      <div
                        key={g.id}
                        className="py-2.5 flex items-center justify-between text-xs sm:text-sm"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {g.logo ? (
                            <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white p-0.5 border border-gray-200">
                              <img
                                src={g.logo}
                                alt={g.name}
                                className="h-5 w-5 object-contain"
                              />
                            </div>
                          ) : (
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#37003C] text-[10px] font-bold text-[#00FF87]">
                              {g.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="font-bold text-[#1F1F1F] truncate">
                            {g.name}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-gray-500 shrink-0 ml-2">
                          {nonAdminMemberCount} players
                        </span>
                      </div>
                    );
                  })}
                  {tournament.groups.length > 4 && (
                    <div className="pt-2 text-xs font-bold text-[#37003C]">
                      + {tournament.groups.length - 4} more groups...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Card: Schedule & Fixtures */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-[#37003C]/30 hover:shadow-md transition-all duration-200">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#37003C]/10 text-[#37003C]">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#1F1F1F]">
                    Schedule &amp; Fixtures
                  </h3>
                  <p className="text-xs text-gray-500">
                    {tournament.rounds.length} {tournament.rounds.length === 1 ? "round" : "rounds"} · {allMatches.length} fixtures
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-8.5 px-3 text-xs font-bold text-[#37003C] border-[#37003C]/20 bg-[#37003C]/5 hover:bg-[#37003C]/10 rounded-xl gap-1 transition-colors"
              >
                <Link href={`/admin/tournaments/${tournament.id}/schedule`}>
                  <span>Manage Schedule</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <p className="mt-3 text-xs sm:text-sm text-gray-600">
              Build rounds, assign Gameweeks, set up knockout fixtures, and resolve winner progression.
            </p>

            {/* Schedule Preview or Empty State */}
            <div className="mt-4">
              {tournament.rounds.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                  <p className="text-xs font-bold text-gray-700">
                    No schedule created yet.
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Create tournament rounds and fixtures to start managing matches.
                  </p>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      asChild
                      className="h-8.5 px-4 text-xs font-bold bg-[#37003C] hover:bg-[#5A0A63] text-white rounded-xl"
                    >
                      <Link href={`/admin/tournaments/${tournament.id}/schedule`}>
                        Create Schedule
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {tournament.rounds.map((round) => {
                    const roundCompleted = round.matches.filter(
                      (m) => m.status === "COMPLETED" || m.status === "FINALIZED"
                    ).length;
                    const roundLive = round.matches.filter(
                      (m) => m.status === "IN_PROGRESS"
                    ).length;
                    const roundTotal = round.matches.length;
                    const isRoundComplete = roundTotal > 0 && roundCompleted === roundTotal;
                    const isRoundLive = roundLive > 0;

                    return (
                      <div
                        key={round.id}
                        className="flex items-center justify-between rounded-xl border border-gray-200/80 bg-gray-50/70 p-2.5 text-xs transition-colors hover:bg-gray-100/80"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1F1F1F]">
                            {round.name || `Round ${round.roundNumber}`}
                          </span>
                          <span className="rounded-full bg-white px-2 py-0.5 font-bold text-gray-600 border border-gray-200 text-[10px]">
                            GW {round.gameweek}
                          </span>
                          {isRoundLive && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.2 text-[9px] font-black uppercase tracking-wider">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                              LIVE
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {isRoundLive ? (
                            <span className="font-bold text-rose-600 inline-flex items-center gap-1">
                              {roundLive} live {roundLive === 1 ? "fixture" : "fixtures"}
                            </span>
                          ) : isRoundComplete ? (
                            <span className="font-bold text-[#008744] inline-flex items-center gap-1">
                              {roundCompleted} / {roundTotal} completed
                              <CheckCircle2 className="h-3.5 w-3.5 text-[#008744]" />
                            </span>
                          ) : roundCompleted > 0 ? (
                            <span className="font-bold text-[#37003C]">
                              {roundCompleted} / {roundTotal} completed
                            </span>
                          ) : (
                            <span className="font-semibold text-gray-400 inline-flex items-center gap-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              Incoming ({roundTotal} fixtures)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Lifecycle & Actions Panel */}
      <section aria-label="Tournament Lifecycle and Controls">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-3.5 border-b border-gray-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#37003C]/10 text-[#37003C]">
              <Settings className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#1F1F1F]">
                Lifecycle &amp; Controls
              </h2>
              <p className="text-xs text-gray-500">
                Publish tournament to public visitors, configure rules, or manage tournament deletion.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-1">
            <TournamentActions
              tournamentId={tournament.id}
              tournamentName={tournament.name}
              status={tournament.status as "DRAFT" | "PUBLISHED" | "FINISHED"}
              hasGroups={tournament.groups.length > 0}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
