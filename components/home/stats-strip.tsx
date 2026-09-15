import * as React from "react";
import { Trophy, Shield, Calendar } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

interface StatsStripProps {
  activeTournaments?: number;
  teamsCount?: number | string;
  managersCount?: number | string;
  matchesPlayed?: number;
  className?: string;
}

export function StatsStrip({
  activeTournaments = 24,
  teamsCount,
  managersCount,
  matchesPlayed = 96,
  className,
}: StatsStripProps) {
  const displayTeams = teamsCount ?? managersCount ?? 48;

  return (
    <div className={cn("w-full max-w-5xl mx-auto px-4 sm:px-6 relative z-30", className)}>
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E8ECF2] p-5 sm:p-7 shadow-[0_20px_50px_rgba(11,8,30,0.08)]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {/* Stat 1: Active Tournaments */}
          <div className="flex items-center gap-4 sm:justify-center pt-2 sm:pt-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#00FFA3] text-[#0B081E] shadow-sm">
              <Trophy className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#0B081E] leading-none">
                {activeTournaments}
              </span>
              <span className="mt-1 text-xs sm:text-sm font-semibold text-[#64748B]">
                Active tournaments
              </span>
            </div>
          </div>

          {/* Stat 2: Teams */}
          <div className="flex items-center gap-4 sm:justify-center pt-4 sm:pt-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#00FFA3] text-[#0B081E] shadow-sm">
              <Shield className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#0B081E] leading-none" suppressHydrationWarning>
                {formatNumber(displayTeams)}
              </span>
              <span className="mt-1 text-xs sm:text-sm font-semibold text-[#64748B]">
                Teams
              </span>
            </div>
          </div>

          {/* Stat 3: Matches Played */}
          <div className="flex items-center gap-4 sm:justify-center pt-4 sm:pt-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#00FFA3] text-[#0B081E] shadow-sm">
              <Calendar className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#0B081E] leading-none">
                {matchesPlayed}
              </span>
              <span className="mt-1 text-xs sm:text-sm font-semibold text-[#64748B]">
                Matches played
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
