import * as React from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Manager {
  rank: number;
  name: string;
  points: string;
  variant: "green" | "purple";
}

const TOP_MANAGERS: Manager[] = [
  { rank: 1, name: "AlexFPL", points: "2,348", variant: "green" },
  { rank: 2, name: "GoalDigger", points: "2,321", variant: "green" },
  { rank: 3, name: "FPLMaster", points: "2,250", variant: "green" },
  { rank: 4, name: "TeamLegend", points: "2,198", variant: "purple" },
  { rank: 5, name: "FantasyKing", points: "2,142", variant: "purple" },
];

export function HeroVisual({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center w-full max-w-2xl min-h-[380px] sm:min-h-[440px] lg:min-h-[500px] select-none",
        className
      )}
    >
      {/* Central Spacer framing the background trophy */}
      <div
        aria-hidden="true"
        className="w-52 sm:w-68 lg:w-76 h-[360px] sm:h-[440px] lg:h-[500px] pointer-events-none"
      />

      {/* Left Floating VS Match Card */}
      <div className="absolute -left-2 sm:left-2 lg:-left-6 top-1/4 sm:top-[30%] z-20 transition-transform duration-300 hover:-translate-y-1">
        <div className="rounded-2xl border border-white/20 bg-[#160B33]/85 p-3 sm:p-4 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
          {/* Shields VS Row */}
          <div className="flex items-center gap-3">
            {/* Left Purple Shield */}
            <div className="flex h-10 w-9 sm:h-11 sm:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#8B5CF6]/30 to-[#4C1D95]/40 border border-[#8B5CF6]/50 shadow-inner">
              <span className="text-sm font-black text-[#C4B5FD]">⚔</span>
            </div>

            <span className="text-xs sm:text-sm font-black tracking-wider text-white">VS</span>

            {/* Right Green Shield */}
            <div className="flex h-10 w-9 sm:h-11 sm:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#00FFA3]/30 to-[#059669]/40 border border-[#00FFA3]/50 shadow-inner">
              <span className="text-sm font-black text-[#00FFA3]">⚽</span>
            </div>
          </div>

          {/* Gameweek & Status Pill */}
          <div className="mt-3 flex flex-col gap-1.5 pt-2 border-t border-white/[0.08]">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#00FFA3]/15 border border-[#00FFA3]/30 px-2 py-0.5 self-start">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00FFA3] animate-pulse" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#00FFA3]">Upcoming</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#CBD5E1]">
              <Calendar className="h-3 w-3 text-[#A69DC6]" />
              <span>GW 12</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Floating "Top Managers" Leaderboard Card */}
      <div className="absolute -right-2 sm:right-2 lg:-right-6 top-10 sm:top-14 z-20 transition-transform duration-300 hover:-translate-y-1">
        <div className="w-56 sm:w-64 rounded-2xl border border-white/20 bg-[#160B33]/85 p-3.5 sm:p-4.5 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.65)]">
          {/* Card Title */}
          <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
            <h4 className="text-xs sm:text-sm font-extrabold tracking-tight text-white">
              Top Managers
            </h4>
          </div>

          {/* List of 5 Ranked Managers */}
          <div className="mt-2 space-y-2">
            {TOP_MANAGERS.map((m) => (
              <div
                key={m.rank}
                className="flex items-center justify-between gap-2 py-1 text-xs transition-colors hover:bg-white/[0.04] rounded-md px-1"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] font-extrabold text-[#A69DC6] w-3 shrink-0">
                    {m.rank}
                  </span>

                  {/* Tiny Avatar Badge */}
                  <div
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black",
                      m.variant === "green"
                        ? "bg-[#00FFA3]/20 text-[#00FFA3] border border-[#00FFA3]/40"
                        : "bg-[#8B5CF6]/25 text-[#C4B5FD] border border-[#8B5CF6]/40"
                    )}
                  >
                    🏆
                  </div>

                  <span className="truncate font-semibold text-white/90 text-[11px] sm:text-xs">
                    {m.name}
                  </span>
                </div>

                <span className="font-mono text-[11px] sm:text-xs font-bold text-white shrink-0">
                  {m.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
