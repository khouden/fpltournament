import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TournamentActions } from "@/components/tournament-actions";
import { calculateLeagueStandings } from "@/lib/scoring";
import { LeagueTable } from "@/components/league-table";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const standings = await calculateLeagueStandings(tournament.id);
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
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs sm:text-sm text-[#777777]">
        <Link
          href="/admin"
          className="font-medium text-[#666666] hover:text-[#37003C] transition-colors"
        >
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-[#AAAAAA] shrink-0" />
        <span
          className="font-semibold text-[#1F1F1F] truncate max-w-[200px] sm:max-w-md"
          title={tournament.name}
        >
          {tournament.name}
        </span>
      </nav>

      {/* 2. Tournament Header & Identity */}
      <section aria-label="Tournament Header" className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-1">
        <div className="space-y-2.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1F1F1F] tracking-tight leading-tight">
              {tournament.name}
            </h1>

            {/* Status Badge */}
            {tournament.status === "PUBLISHED" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 shadow-2xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
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

            {/* Chip Badges */}
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-[6px] border ${
                tournament.allowBenchBoost
                  ? "bg-[#00FF87]/15 text-[#008744] border-[#00FF87]/40 shadow-2xs"
                  : "bg-[#F4F4F5] text-[#777777] border-[#E5E5E5]"
              }`}
              title={tournament.allowBenchBoost ? "Bench Boost chip is allowed" : "Bench Boost chip is disabled"}
            >
              {tournament.allowBenchBoost ? (
                <>
                  <Armchair className="h-3.5 w-3.5 text-[#008744]" />
                  <span>BB: Allowed</span>
                </>
              ) : (
                <>
                  <Ban className="h-3.5 w-3.5 text-[#888888]" />
                  <span>BB: Disabled</span>
                </>
              )}
            </span>

            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-[6px] border ${
                tournament.allowTripleCaptain
                  ? "bg-amber-500/15 text-amber-800 border-amber-500/40 shadow-2xs"
                  : "bg-[#F4F4F5] text-[#777777] border-[#E5E5E5]"
              }`}
              title={tournament.allowTripleCaptain ? "Triple Captain chip is allowed (3x points)" : "Triple Captain chip is reduced (2x points)"}
            >
              {tournament.allowTripleCaptain ? (
                <>
                  <Crown className="h-3.5 w-3.5 text-amber-600" />
                  <span>TC: Allowed (3x)</span>
                </>
              ) : (
                <>
                  <Ban className="h-3.5 w-3.5 text-[#888888]" />
                  <span>TC: Reduced (2x)</span>
                </>
              )}
            </span>

            {tournament.admins.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-[6px] border border-[#37003C]/20 bg-[#37003C]/5 text-[#37003C] shadow-2xs">
                <Shield className="h-3.5 w-3.5 text-[#37003C]" />
                <span>
                  {tournament.admins.length} Admin{tournament.admins.length > 1 ? "s" : ""}
                </span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#666666] font-medium">
            <span>Season {tournament.season}</span>
            <span className="text-[#CCCCCC]">·</span>
            <span>
              {tournament.groups.length}{" "}
              {tournament.groups.length === 1 ? "Group" : "Groups"}
            </span>
            <span className="text-[#CCCCCC]">·</span>
            <span>
              {allMatches.length} {allMatches.length === 1 ? "Fixture" : "Fixtures"}
            </span>
          </div>
        </div>

        {/* Global Header Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
          {tournament.status === "PUBLISHED" && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-9 px-3.5 text-xs font-semibold text-[#1F1F1F] border-[#E5E5E5] bg-white hover:bg-[#F7F7F7] hover:border-[#37003C]/40 hover:text-[#37003C] rounded-[8px] transition-colors gap-1.5 shadow-2xs"
            >
              <Link
                href={`/tournaments/${tournament.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5 text-[#37003C]" />
                <span>View Public Page</span>
              </Link>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-9 px-3.5 text-xs font-semibold text-[#1F1F1F] border-[#E5E5E5] bg-white hover:bg-[#F7F7F7] hover:border-[#37003C]/40 hover:text-[#37003C] rounded-[8px] transition-colors gap-1.5 shadow-2xs"
          >
            <Link href={`/admin/tournaments/${tournament.id}/edit`}>
              <Pencil className="h-3.5 w-3.5 text-[#37003C]" />
              <span>Edit Info</span>
            </Link>
          </Button>
        </div>
      </section>

      {/* 3. 4-Card Key Metrics Grid */}
      <section
        aria-label="Tournament Management Metrics"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
      >
        {/* Metric 1: Season & Admins */}
        <div className="bg-white border border-[#E5E5E5] rounded-[14px] p-5 shadow-fpl-sm flex flex-col justify-between transition-all duration-200 hover:border-[#37003C]/30">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[#777777] uppercase tracking-wider">
                Season &amp; Admins
              </p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#37003C]/10 text-[#37003C]">
                <Crown className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#1F1F1F] tracking-tight">
              {tournament.season}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F0F0F0] space-y-1">
            {tournament.admins.length > 0 ? (
              <>
                {tournament.admins.slice(0, 2).map((admin) => (
                  <div
                    key={admin.id || admin.fplId}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-[#1F1F1F] flex items-center gap-1 truncate max-w-[140px]">
                      {admin.isPrimary ? (
                        <span title="Primary Admin">👑</span>
                      ) : (
                        <span title="Co-Admin">🛡️</span>
                      )}
                      <span className="truncate">{admin.name || `Admin #${admin.fplId}`}</span>
                    </span>
                    <span className="text-[11px] font-mono font-medium text-[#777777]">
                      #{admin.fplId}
                    </span>
                  </div>
                ))}
                {tournament.admins.length > 2 && (
                  <p className="text-[11px] font-semibold text-[#37003C]">
                    +{tournament.admins.length - 2} more co-admin{tournament.admins.length - 2 > 1 ? "s" : ""}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs font-medium text-[#777777]">
                Admin FPL ID: <span className="font-mono text-[#1F1F1F]">#{tournament.adminFplId}</span>
              </p>
            )}
          </div>
        </div>

        {/* Metric 2: Participating Groups */}
        <div className="bg-white border border-[#E5E5E5] rounded-[14px] p-5 shadow-fpl-sm flex flex-col justify-between transition-all duration-200 hover:border-[#37003C]/30">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[#777777] uppercase tracking-wider">
                Participating Groups
              </p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#37003C]/10 text-[#37003C]">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#1F1F1F] tracking-tight">
              {tournament.groups.length} {tournament.groups.length === 1 ? "Group" : "Groups"}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F0F0F0]">
            {tournament.groups.length > 0 ? (
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#1F1F1F]">
                  {totalNonAdminPlayers} active players
                </span>
                <span className="text-[11px] font-semibold text-[#008744]">
                  Imported
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#888888]">No groups imported</span>
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
        <div className="bg-white border border-[#E5E5E5] rounded-[14px] p-5 shadow-fpl-sm flex flex-col justify-between transition-all duration-200 hover:border-[#37003C]/30">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[#777777] uppercase tracking-wider">
                Gameweek Rounds
              </p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#37003C]/10 text-[#37003C]">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#1F1F1F] tracking-tight">
              {tournament.rounds.length} {tournament.rounds.length === 1 ? "Round" : "Rounds"}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F0F0F0]">
            {tournament.rounds.length > 0 ? (
              <p className="text-xs font-medium text-[#666666]">
                Scheduled in competition
              </p>
            ) : (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#888888]">No rounds created</span>
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
        <div className="bg-white border border-[#E5E5E5] rounded-[14px] p-5 shadow-fpl-sm flex flex-col justify-between transition-all duration-200 hover:border-[#37003C]/30">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[#777777] uppercase tracking-wider">
                Fixtures
              </p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CalendarCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl sm:text-3xl font-extrabold text-[#1F1F1F] tracking-tight">
                {completedMatches.length} / {allMatches.length}
              </p>
              <span className="text-xs font-bold text-[#666666]">
                {fixtureCompletionPercentage}%
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F0F0F0] space-y-2">
            {/* Progress Bar */}
            <div
              role="progressbar"
              aria-label="Fixture completion progress"
              aria-valuenow={completedMatches.length}
              aria-valuemin={0}
              aria-valuemax={allMatches.length}
              className="h-2 w-full overflow-hidden rounded-full bg-[#EEEEEE]"
            >
              <div
                className="h-full rounded-full bg-[#00FF87] transition-all duration-500 ease-out"
                style={{ width: `${fixtureCompletionPercentage}%` }}
              />
            </div>
            <p className="text-[11px] font-medium text-[#777777]">
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
              className="text-lg sm:text-xl font-bold text-[#1F1F1F] tracking-tight flex items-center gap-2"
            >
              <Trophy className="h-5 w-5 text-amber-500" />
              <span>Live League Standings</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#666666] mt-0.5">
              Win +3 · Draw +1 · Loss 0 · Live calculated points table
            </p>
          </div>

          {tournament.status === "PUBLISHED" && (
            <div className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full border border-[#00FF87]/40 bg-[#00FF87]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#008744]">
              <span className="h-2 w-2 rounded-full bg-[#008744] animate-pulse" />
              <span>LIVE TABLE</span>
            </div>
          )}
        </div>

        {/* Embedded League Table */}
        <LeagueTable standings={standings} />
      </section>

      {/* 5. Management Hub (2-Column Cards) */}
      <section aria-label="Tournament Management Hub" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Participating Groups */}
        <div className="bg-white border border-[#E5E5E5] rounded-[16px] p-6 shadow-fpl-sm flex flex-col justify-between transition-all duration-200 hover:border-[#37003C]/30">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0]">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#37003C]/10 text-[#37003C]">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#1F1F1F]">
                    Participating Groups
                  </h3>
                  <p className="text-xs text-[#777777]">
                    {tournament.groups.length} {tournament.groups.length === 1 ? "group" : "groups"} configured
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-8 px-3 text-xs font-semibold text-[#37003C] border-[#37003C]/20 bg-[#37003C]/5 hover:bg-[#37003C]/10 rounded-[6px] gap-1 transition-colors"
              >
                <Link href={`/admin/tournaments/${tournament.id}/groups`}>
                  <span>Manage Groups</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <p className="mt-3 text-xs sm:text-sm text-[#666666]">
              Import Classic Leagues from FPL, verify admin membership, and view team rosters.
            </p>

            {/* Groups Preview or Empty State */}
            <div className="mt-4">
              {tournament.groups.length === 0 ? (
                <div className="rounded-[10px] border border-dashed border-[#DDDDDD] bg-[#FAFAFA] p-5 text-center">
                  <p className="text-xs font-semibold text-[#555555]">
                    No groups imported yet.
                  </p>
                  <p className="mt-1 text-xs text-[#888888]">
                    Import your FPL Classic League groups to start building the tournament.
                  </p>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      asChild
                      className="h-8 px-3.5 text-xs font-semibold bg-[#37003C] hover:bg-[#5A0A63] text-white rounded-[6px]"
                    >
                      <Link href={`/admin/tournaments/${tournament.id}/groups`}>
                        Import Groups
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-[#F0F0F0]">
                  {tournament.groups.slice(0, 4).map((g) => {
                    const nonAdminMemberCount = g.members.filter((m) => !m.isAdmin).length;
                    return (
                      <div
                        key={g.id}
                        className="py-2.5 flex items-center justify-between text-xs sm:text-sm"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {g.logo ? (
                            <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-white p-0.5 border border-[#E5E5E5]">
                              <img
                                src={g.logo}
                                alt={g.name}
                                className="h-5 w-5 object-contain"
                              />
                            </div>
                          ) : (
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-[#37003C] text-[10px] font-bold text-[#00FF87]">
                              {g.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="font-semibold text-[#1F1F1F] truncate">
                            {g.name}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-[#777777] shrink-0 ml-2">
                          {nonAdminMemberCount} players
                        </span>
                      </div>
                    );
                  })}
                  {tournament.groups.length > 4 && (
                    <div className="pt-2 text-xs font-semibold text-[#37003C]">
                      + {tournament.groups.length - 4} more groups...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Card: Schedule & Fixtures */}
        <div className="bg-white border border-[#E5E5E5] rounded-[16px] p-6 shadow-fpl-sm flex flex-col justify-between transition-all duration-200 hover:border-[#37003C]/30">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0]">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#37003C]/10 text-[#37003C]">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#1F1F1F]">
                    Schedule &amp; Fixtures
                  </h3>
                  <p className="text-xs text-[#777777]">
                    {tournament.rounds.length} {tournament.rounds.length === 1 ? "round" : "rounds"} · {allMatches.length} fixtures
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-8 px-3 text-xs font-semibold text-[#37003C] border-[#37003C]/20 bg-[#37003C]/5 hover:bg-[#37003C]/10 rounded-[6px] gap-1 transition-colors"
              >
                <Link href={`/admin/tournaments/${tournament.id}/schedule`}>
                  <span>Manage Schedule</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <p className="mt-3 text-xs sm:text-sm text-[#666666]">
              Build rounds, assign Gameweeks, set up knockout fixtures, and resolve winner progression.
            </p>

            {/* Schedule Preview or Empty State */}
            <div className="mt-4">
              {tournament.rounds.length === 0 ? (
                <div className="rounded-[10px] border border-dashed border-[#DDDDDD] bg-[#FAFAFA] p-5 text-center">
                  <p className="text-xs font-semibold text-[#555555]">
                    No schedule created yet.
                  </p>
                  <p className="mt-1 text-xs text-[#888888]">
                    Create tournament rounds and fixtures to start managing matches.
                  </p>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      asChild
                      className="h-8 px-3.5 text-xs font-semibold bg-[#37003C] hover:bg-[#5A0A63] text-white rounded-[6px]"
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
                    const roundTotal = round.matches.length;
                    const isRoundComplete = roundTotal > 0 && roundCompleted === roundTotal;

                    return (
                      <div
                        key={round.id}
                        className="flex items-center justify-between rounded-[10px] border border-[#EEEEEE] bg-[#FAFAFA] p-2.5 text-xs transition-colors hover:bg-[#F5F5F5]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1F1F1F]">
                            {round.name || `Round ${round.roundNumber}`}
                          </span>
                          <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-[#555555] border border-[#E5E5E5] text-[10px]">
                            GW {round.gameweek}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold ${
                              isRoundComplete
                                ? "text-[#008744]"
                                : roundCompleted > 0
                                  ? "text-[#37003C]"
                                  : "text-[#777777]"
                            }`}
                          >
                            {roundCompleted} / {roundTotal} {isRoundComplete ? "completed" : "matches"}
                          </span>
                          {isRoundComplete && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#008744]" />
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
        <div className="bg-white border border-[#E5E5E5] rounded-[16px] p-6 shadow-fpl-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-[#F0F0F0]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#37003C]/10 text-[#37003C]">
              <Settings className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1F1F1F]">
                Lifecycle &amp; Controls
              </h2>
              <p className="text-xs text-[#777777]">
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
