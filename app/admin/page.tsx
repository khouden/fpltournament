import { prisma } from "@/lib/db";
import Link from "next/link";
import { TournamentActions } from "@/components/tournament-actions";
import {
  Trophy,
  Plus,
  FileText,
  CheckCircle2,
  Calendar,
  Users,
  Clock,
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

  return (
    <div className="space-y-6 sm:space-y-8 animate-fpl-fade-in">
      {/* Dashboard Page Introduction & Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F1F1F] tracking-tight">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-[#666666]">
            Manage tournaments and competitions
          </p>
        </div>
        <Button
          asChild
          className="h-11 px-5 bg-[#37003C] hover:bg-[#5A0A63] text-white font-semibold rounded-[8px] shadow-sm gap-2 self-start sm:self-auto transition-colors"
        >
          <Link href="/admin/tournaments/new">
            <Plus className="h-4 w-4" />
            <span>Create Tournament</span>
          </Link>
        </Button>
      </div>

      {/* KPI Summary Cards */}
      <section aria-label="Tournament Statistics" className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        {/* Total Tournaments KPI */}
        <div className="bg-white border border-[#E5E5E5] rounded-[14px] p-5 sm:p-6 shadow-fpl-sm flex items-center justify-between transition-all duration-200 hover:border-[#37003C]/30">
          <div>
            <p className="text-xs font-bold text-[#777777] uppercase tracking-wider">
              Total Tournaments
            </p>
            <p className="text-3xl sm:text-4xl font-extrabold text-[#1F1F1F] mt-1.5 tracking-tight">
              {tournaments.length}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#37003C]/10 text-[#37003C] shrink-0">
            <Trophy className="h-6 w-6" />
          </div>
        </div>

        {/* Published Tournaments KPI */}
        <div className="bg-white border border-[#E5E5E5] rounded-[14px] p-5 sm:p-6 shadow-fpl-sm flex items-center justify-between transition-all duration-200 hover:border-emerald-300">
          <div>
            <p className="text-xs font-bold text-[#777777] uppercase tracking-wider">
              Published
            </p>
            <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600 mt-1.5 tracking-tight">
              {publishedCount}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        {/* Draft Tournaments KPI */}
        <div className="bg-white border border-[#E5E5E5] rounded-[14px] p-5 sm:p-6 shadow-fpl-sm flex items-center justify-between transition-all duration-200 hover:border-amber-300">
          <div>
            <p className="text-xs font-bold text-[#777777] uppercase tracking-wider">
              Draft
            </p>
            <p className="text-3xl sm:text-4xl font-extrabold text-amber-600 mt-1.5 tracking-tight">
              {draftCount}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <FileText className="h-6 w-6" />
          </div>
        </div>
      </section>

      {/* Tournaments Management Section */}
      <section aria-label="Tournament Management" className="space-y-4">
        <div className="flex items-center justify-between px-0.5">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#1F1F1F] tracking-tight">
              Tournaments
            </h2>
            <p className="text-xs sm:text-sm text-[#777777]">
              All competitions
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#37003C]/5 text-[#37003C] border border-[#37003C]/10">
            {tournaments.length} {tournaments.length === 1 ? "Competition" : "Competitions"}
          </span>
        </div>

        {/* Empty State */}
        {tournaments.length === 0 ? (
          <div className="rounded-[14px] border border-[#E5E5E5] bg-white p-8 sm:p-12 text-center shadow-fpl-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#37003C]/5 text-[#37003C] mb-4">
              <Trophy className="h-7 w-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#1F1F1F]">
              No tournaments yet
            </h3>
            <p className="mt-1 text-sm text-[#666666] max-w-sm mx-auto">
              Create your first tournament to get started.
            </p>
            <div className="mt-6">
              <Button
                asChild
                className="h-10 px-5 bg-[#37003C] hover:bg-[#5A0A63] text-white font-semibold rounded-[8px] shadow-sm gap-2"
              >
                <Link href="/admin/tournaments/new">
                  <Plus className="h-4 w-4" />
                  <span>Create Tournament</span>
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {tournaments.map((tournament) => {
              const matchCount = tournament.rounds.reduce(
                (acc, r) => acc + r.matches.length,
                0
              );

              return (
                <div
                  key={tournament.id}
                  className="group rounded-[14px] border border-[#E5E5E5] bg-white p-5 sm:p-6 shadow-fpl-sm hover:border-[#37003C]/30 hover:shadow-fpl-md transition-all duration-200"
                >
                  {/* Top Row: Title Link & Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-3.5 border-b border-[#F0F0F0]">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/tournaments/${tournament.id}`}
                        className="text-lg sm:text-xl font-bold text-[#1F1F1F] group-hover:text-[#37003C] transition-colors leading-tight inline-block hover:underline"
                      >
                        {tournament.name}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {tournament.status === "PUBLISHED" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>PUBLISHED</span>
                        </span>
                      ) : tournament.status === "DRAFT" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700">
                          <FileText className="h-3.5 w-3.5 text-amber-600" />
                          <span>DRAFT</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
                          <Clock className="h-3.5 w-3.5 text-gray-600" />
                          <span>{tournament.status}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Row: Metadata & Chip Indicators */}
                  <div className="py-3 flex flex-wrap items-center gap-y-2 gap-x-3 text-xs sm:text-sm text-[#555555]">
                    <div className="flex items-center gap-1.5 font-medium text-[#444444]">
                      <Calendar className="h-3.5 w-3.5 text-[#777777]" />
                      <span>Season {tournament.season}</span>
                    </div>
                    <span className="text-[#CCCCCC] hidden sm:inline">·</span>
                    <div className="flex items-center gap-1.5 font-medium text-[#444444]">
                      <Users className="h-3.5 w-3.5 text-[#777777]" />
                      <span>
                        {tournament.groups.length}{" "}
                        {tournament.groups.length === 1 ? "group" : "groups"}
                      </span>
                    </div>
                    <span className="text-[#CCCCCC] hidden sm:inline">·</span>
                    <div className="flex items-center gap-1.5 font-medium text-[#444444]">
                      <Trophy className="h-3.5 w-3.5 text-[#777777]" />
                      <span>
                        {matchCount} {matchCount === 1 ? "match" : "matches"}
                      </span>
                    </div>
                    <span className="text-[#CCCCCC] hidden sm:inline">·</span>

                    {/* Chip Rule Indicators */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-[4px] border ${
                          tournament.allowBenchBoost
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-[#F4F4F5] text-[#777777] border-[#E5E5E5]"
                        }`}
                      >
                        {tournament.allowBenchBoost ? "BB ON" : "BB OFF"}
                      </span>
                      <span
                        className={`inline-flex items-center text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-[4px] border ${
                          tournament.allowTripleCaptain
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-[#F4F4F5] text-[#777777] border-[#E5E5E5]"
                        }`}
                      >
                        {tournament.allowTripleCaptain ? "TC ON" : "TC OFF"}
                      </span>
                    </div>
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
