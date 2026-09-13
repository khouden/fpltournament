import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { getTournamentBannerOrDefault } from "@/lib/tournament-banners";
import { TournamentActions } from "@/components/tournament-actions";
import {
  Trophy,
  Plus,
  FileText,
  CheckCircle2,
  Calendar,
  Users,
  Clock,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
  const tournaments = await prisma.tournament.findMany({
    include: {
      groups: true,
      rounds: {
        include: {
          matches: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const publishedCount = tournaments.filter((t) => t.status === "PUBLISHED").length;
  const draftCount = tournaments.filter((t) => t.status === "DRAFT").length;
  const totalMatches = tournaments.reduce(
    (acc, t) =>
      acc + t.rounds.reduce((rAcc, r) => rAcc + r.matches.length, 0),
    0
  );
  const totalGroups = tournaments.reduce((acc, t) => acc + t.groups.length, 0);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fpl-fade-in">
      {/* 1. Command Center Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#170020] via-[#240030] to-[#180022] text-white p-6 sm:p-8 md:p-10 shadow-xl border border-white/10">
        {/* Ambient neon radial glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 bg-[#00FF87]/15 rounded-full blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 bg-[#00D9FF]/10 rounded-full blur-3xl"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#00FF87]/15 border border-[#00FF87]/30 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#00FF87]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>COMMAND CENTER · PREMIER LEAGUE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
              Competition Hub
            </h1>
            <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
              Manage custom fantasy knockout tournaments, import FPL Classic League groups, schedule gameweek fixtures, and calculate live fantasy scores.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              asChild
              className="h-11 px-5 bg-gradient-to-r from-[#00FF87] to-[#00D9FF] hover:opacity-95 text-[#063319] font-black rounded-xl shadow-lg shadow-[#00FF87]/20 gap-2 transition-all cursor-pointer border-0"
            >
              <Link href="/admin/tournaments/new">
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>Create Tournament</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="h-11 px-4 border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl gap-2 backdrop-blur-sm transition-colors cursor-pointer"
            >
              <Link href="/tournaments" target="_blank" rel="noopener noreferrer">
                <span>Public Site</span>
                <ExternalLink className="h-3.5 w-3.5 text-[#00D9FF]" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. KPI Summary Cards Grid */}
      <section
        aria-label="Tournament Statistics"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
      >
        {/* KPI 1: Total Competitions */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-[#37003C]/30 transition-all duration-200 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#37003C]" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Total Tournaments
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#37003C]/10 text-[#37003C] group-hover:scale-105 transition-transform">
                <Trophy className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-[#1F1F1F] mt-2 tracking-tight">
              {tournaments.length}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>{totalGroups} groups enrolled</span>
            <span className="text-[#37003C] font-semibold">Active Hub</span>
          </div>
        </div>

        {/* KPI 2: Published Live */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-emerald-300 transition-all duration-200 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#00A855]" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Published Live
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-emerald-600 mt-2 tracking-tight">
              {publishedCount}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-emerald-700 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Publicly visible
            </span>
            <span className="font-bold">{tournaments.length > 0 ? Math.round((publishedCount / tournaments.length) * 100) : 0}%</span>
          </div>
        </div>

        {/* KPI 3: In Draft Setup */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-amber-300 transition-all duration-200 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                In Setup (Draft)
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-amber-600 mt-2 tracking-tight">
              {draftCount}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-amber-700 font-medium">
            <span>Rosters / Schedule pending</span>
            <span className="font-semibold">Setup</span>
          </div>
        </div>

        {/* KPI 4: Total Fixtures */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-cyan-300 transition-all duration-200 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#00D9FF]" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Total Matches
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 group-hover:scale-105 transition-transform">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-[#1F1F1F] mt-2 tracking-tight">
              {totalMatches}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Across all gameweeks</span>
            <span className="text-cyan-700 font-bold">Fixtures</span>
          </div>
        </div>
      </section>

      {/* 3. Tournaments Management Section */}
      <section aria-label="Tournament Management" className="space-y-4">
        <div className="flex items-center justify-between px-0.5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1F1F1F] tracking-tight">
              Tournaments
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Select a tournament to enter its control center or adjust settings
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#37003C]/5 text-[#37003C] border border-[#37003C]/10">
            {tournaments.length} {tournaments.length === 1 ? "Competition" : "Competitions"}
          </span>
        </div>

        {/* Empty State */}
        {tournaments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 sm:p-14 text-center shadow-xs">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#37003C] text-[#00FF87] mb-4 shadow-lg shadow-[#00FF87]/15">
              <Trophy className="h-8 w-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-[#1F1F1F]">
              No tournaments yet
            </h3>
            <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
              Create your first tournament to start importing FPL leagues, generating match fixtures, and tracking scores.
            </p>
            <div className="mt-6">
              <Button
                asChild
                className="h-11 px-6 bg-[#37003C] hover:bg-[#5A0A63] text-white font-bold rounded-xl shadow-md gap-2 cursor-pointer"
              >
                <Link href="/admin/tournaments/new">
                  <Plus className="h-4 w-4" />
                  <span>Create First Tournament</span>
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {tournaments.map((tournament) => {
              const allMatches = tournament.rounds.flatMap((r) => r.matches);
              const completedMatches = allMatches.filter(
                (m) => m.status === "COMPLETED" || m.status === "FINALIZED"
              );
              const matchCount = allMatches.length;
              const completionPercentage =
                matchCount > 0
                  ? Math.round((completedMatches.length / matchCount) * 100)
                  : 0;

              return (
                <div
                  key={tournament.id}
                  className="group rounded-2xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-xs hover:border-[#37003C]/40 hover:shadow-md transition-all duration-200"
                >
                  {/* Top Row: Thumbnail + Title & Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {(() => {
                        const bannerSrc = getTournamentBannerOrDefault(tournament.banner, tournament.id);
                        return (
                          <div className="relative h-12 w-20 sm:h-14 sm:w-24 rounded-xl overflow-hidden bg-[#1F0022] shrink-0 border border-gray-200 shadow-2xs group-hover:scale-102 transition-transform">
                            <Image
                              src={bannerSrc}
                              alt=""
                              fill
                              unoptimized={bannerSrc.startsWith("http")}
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                          </div>
                        );
                      })()}
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/admin/tournaments/${tournament.id}`}
                          className="text-lg sm:text-xl font-black text-[#1F1F1F] group-hover:text-[#37003C] transition-colors leading-tight inline-block hover:underline truncate max-w-full"
                        >
                          {tournament.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 font-medium">
                          <span>Season {tournament.season}</span>
                          <span>·</span>
                          <span>{tournament.groups.length} Groups</span>
                          <span>·</span>
                          <span>{tournament.rounds.length} Rounds</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 shrink-0">
                      {tournament.status === "PUBLISHED" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 shadow-2xs">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>PUBLISHED</span>
                        </span>
                      ) : tournament.status === "DRAFT" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 shadow-2xs">
                          <FileText className="h-3.5 w-3.5 text-amber-600" />
                          <span>DRAFT SETUP</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 shadow-2xs">
                          <Clock className="h-3.5 w-3.5 text-gray-600" />
                          <span>{tournament.status}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Row: Rule Chips & Match Progress */}
                  <div className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-gray-600">
                    {/* Chip Rules */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${
                          tournament.allowBenchBoost
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        }`}
                      >
                        {tournament.allowBenchBoost ? "✓ Bench Boost ON" : "✕ Bench Boost OFF"}
                      </span>
                      <span
                        className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${
                          tournament.allowTripleCaptain
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        }`}
                      >
                        {tournament.allowTripleCaptain ? "✓ Triple Captain (3x)" : "✕ Triple Captain (2x)"}
                      </span>
                    </div>

                    {/* Completion Mini Progress Bar */}
                    {matchCount > 0 && (
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 mb-1">
                            <span>Matches Complete</span>
                            <span>{completedMatches.length}/{matchCount} ({completionPercentage}%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#37003C] to-[#00FF87] rounded-full transition-all duration-300"
                              style={{ width: `${completionPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Row: Actions */}
                  <div className="pt-2">
                    <TournamentActions
                      tournamentId={tournament.id}
                      tournamentName={tournament.name}
                      status={tournament.status as "DRAFT" | "PUBLISHED" | "FINISHED"}
                      hasGroups={tournament.groups.length > 0}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
