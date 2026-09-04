import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/stats/progress-bar";

export interface TournamentCardData {
  id: string;
  name: string;
  season: number;
  allowBenchBoost: boolean;
  allowTripleCaptain: boolean;
  status: string;
  groups: { id: string }[];
  rounds: {
    roundNumber?: number;
    gameweek?: number;
    matches: { status: string }[];
  }[];
}

export interface TournamentCardProps {
  tournament: TournamentCardData;
  className?: string;
}

export function TournamentCard({ tournament, className }: TournamentCardProps) {
  const isPublished = tournament.status === "PUBLISHED";
  const isCompleted = tournament.status === "FINISHED";

  const totalMatches = tournament.rounds.reduce(
    (acc, r) => acc + r.matches.length,
    0
  );
  const completedMatches = tournament.rounds.reduce(
    (acc, r) =>
      acc +
      r.matches.filter(
        (m) => m.status === "COMPLETED" || m.status === "FINALIZED"
      ).length,
    0
  );

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className={cn(
        "group block rounded-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#37003C] focus-visible:ring-offset-2",
        className
      )}
    >
      <article
        className={cn(
          "relative overflow-hidden rounded-[14px] border border-[#E5E5E5] bg-white p-5 sm:p-6 transition-all duration-200",
          "shadow-fpl-sm hover:shadow-fpl-md hover:-translate-y-0.5 hover:border-[#37003C]/30",
          isCompleted && "bg-white/95 border-[#EFEFEF]"
        )}
      >
        {/* Subtle top accent gradient line */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-x-0 top-0 h-[3px] transition-opacity",
            isPublished
              ? "bg-gradient-to-r from-[#00D9FF] via-[#00FF87] to-[#E7FF00] opacity-80 group-hover:opacity-100"
              : "bg-gradient-to-r from-[#5A0A63] to-[#37003C] opacity-40 group-hover:opacity-80"
          )}
        />

        {/* Top Header Row: Status & Season */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {isPublished ? (
            <Badge
              variant="outline"
              className="gap-1.5 border-[#00FF87]/30 bg-[#00FF87]/10 text-[#008744] font-extrabold uppercase tracking-wider text-[11px] px-2.5 py-0.5"
            >
              <span className="h-2 w-2 rounded-full bg-[#00FF87] animate-fpl-pulse-dot" />
              <span>ACTIVE</span>
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="gap-1.5 border-[#BDBDBD] bg-[#F4F4F5] text-[#555555] font-bold uppercase tracking-wider text-[11px] px-2.5 py-0.5"
            >
              <span>COMPLETED</span>
            </Badge>
          )}

          <span className="rounded-full bg-[#F7F7F7] border border-[#EBEBEB] px-2.5 py-0.5 text-xs font-semibold text-[#555555]">
            Season {tournament.season}
          </span>
        </div>

        {/* Tournament Title */}
        <div className="mt-3.5">
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[#37003C] transition-colors duration-150 group-hover:text-[#5A0A63] line-clamp-1">
            {tournament.name}
          </h3>
          <p className="mt-0.5 text-xs text-[#777777] font-medium">
            FPL Classic League Knockout
          </p>
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-[#F0F0F0]" />

        {/* 3-Column Tournament Metrics */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
          {/* Groups */}
          <div className="rounded-[8px] bg-[#F9F9F9] py-2.5 px-2">
            <div className="text-xl sm:text-2xl font-black text-[#1F1F1F] leading-none">
              {tournament.groups.length}
            </div>
            <div className="mt-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#777777]">
              Groups
            </div>
          </div>

          {/* Matches & Progress */}
          <div className="rounded-[8px] bg-[#F9F9F9] py-2.5 px-2 flex flex-col justify-between">
            <div>
              <div className="text-xl sm:text-2xl font-black text-[#1F1F1F] leading-none">
                {completedMatches}{" "}
                <span className="text-xs sm:text-sm font-semibold text-[#888888]">
                  / {totalMatches}
                </span>
              </div>
              <div className="mt-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#777777]">
                Matches
              </div>
            </div>
            {totalMatches > 0 && (
              <ProgressBar
                value={completedMatches}
                max={totalMatches}
                variant={isPublished ? "fantasy" : "purple"}
                size="sm"
                className="mt-2"
              />
            )}
          </div>

          {/* Rounds */}
          <div className="rounded-[8px] bg-[#F9F9F9] py-2.5 px-2">
            <div className="text-xl sm:text-2xl font-black text-[#1F1F1F] leading-none">
              {tournament.rounds.length}
            </div>
            <div className="mt-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#777777]">
              Rounds
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-[#F0F0F0]" />

        {/* Bottom Area: Chip Rules & View Tournament Action */}
        <div className="flex items-center justify-between gap-3 pt-0.5">
          {/* Chip Rules */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            {/* Bench Boost */}
            <div
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-colors",
                tournament.allowBenchBoost
                  ? "bg-[#00FF87]/15 text-[#007038] border border-[#00FF87]/30"
                  : "bg-[#F4F4F5] text-[#888888] border border-[#E5E5E5]"
              )}
              title={
                tournament.allowBenchBoost
                  ? "Bench Boost allowed"
                  : "Bench Boost disabled"
              }
            >
              <span>BB</span>
              {tournament.allowBenchBoost ? (
                <Check className="h-3 w-3 text-[#008744] stroke-[2.5]" />
              ) : (
                <Minus className="h-3 w-3 text-[#888888]" />
              )}
            </div>

            {/* Triple Captain */}
            <div
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-colors",
                tournament.allowTripleCaptain
                  ? "bg-[#00D9FF]/15 text-[#006080] border border-[#00D9FF]/30"
                  : "bg-[#F4F4F5] text-[#888888] border border-[#E5E5E5]"
              )}
              title={
                tournament.allowTripleCaptain
                  ? "Triple Captain allowed"
                  : "Triple Captain disabled"
              }
            >
              <span>TC</span>
              {tournament.allowTripleCaptain ? (
                <Check className="h-3 w-3 text-[#008744] stroke-[2.5]" />
              ) : (
                <Minus className="h-3 w-3 text-[#888888]" />
              )}
            </div>
          </div>

          {/* Action Link */}
          <div className="inline-flex items-center gap-1.5 text-sm font-extrabold text-[#37003C] transition-colors group-hover:text-[#5A0A63]">
            <span>View Tournament</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1" />
          </div>
        </div>
      </article>
    </Link>
  );
}
