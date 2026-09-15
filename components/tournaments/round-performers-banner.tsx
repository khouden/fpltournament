"use client";

import React, { useState } from "react";
import { Crown, Trophy, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  RoundPerformersResult,
  RoundMVPInfo,
  RoundBestTeamInfo,
} from "@/lib/round-performers";

export interface RoundPerformersBannerProps {
  performers: RoundPerformersResult;
  onSelectPlayer?: (player: RoundMVPInfo) => void;
  onSelectTeam?: (teamId: string) => void;
  className?: string;
}

export function RoundPerformersBanner({
  performers,
  onSelectPlayer,
  onSelectTeam,
  className,
}: RoundPerformersBannerProps) {
  const { mvp, bestTeam, isLive, hasScores, roundNumber, gameweek, roundName } = performers;
  const [failedTeamLogos, setFailedTeamLogos] = useState<Record<string, boolean>>({});

  // If no scores recorded yet (scheduled round)
  if (!hasScores || (!mvp && !bestTeam)) {
    const displayName = roundName || `Round ${roundNumber}`;
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 p-3.5 text-center transition-all max-w-md mx-auto",
          className
        )}
      >
        <p className="text-xs text-gray-500 font-medium">
          {displayName} MVP &amp; Best Team will appear once Gameweek {gameweek} matches kick off.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:gap-4 max-w-md sm:max-w-lg mx-auto",
        className
      )}
    >
      {/* =================================================================== */}
      {/* CARD 1: MVP OF THE ROUND                                            */}
      {/* =================================================================== */}
      {mvp ? (
        <div
          onClick={() => onSelectPlayer?.(mvp)}
          className={cn(
            "relative aspect-[4/5] sm:aspect-square rounded-2xl border p-3 sm:p-4 flex flex-col justify-between items-center text-center transition-all group overflow-hidden select-none",
            onSelectPlayer ? "cursor-pointer hover:shadow-md hover:border-amber-400 hover:-translate-y-0.5" : "",
            isLive
              ? "bg-gradient-to-b from-rose-50/70 via-white to-amber-50/40 border-rose-200/90 shadow-2xs"
              : "bg-gradient-to-b from-amber-50/40 via-white to-amber-50/20 border-amber-200/80 shadow-2xs"
          )}
        >
          {/* Header Row: Badge & Gameweek */}
          <div className="w-full flex items-center justify-between z-10">
            {isLive ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-2xs animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                LIVE MVP
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-2xs">
                <Crown className="h-3 w-3 fill-current text-white" />
                MVP
              </span>
            )}
            <span className="text-[10px] sm:text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
              GW {gameweek}
            </span>
          </div>

          {/* Center: MVP Illustration (No border, no background, bigger size) */}
          <div className="relative my-auto flex items-center justify-center">
            <div className="relative group-hover:scale-105 transition-transform duration-200">
              <img
                src="/images/players/mvp of the match.png"
                alt={mvp.fplName}
                className="h-28 w-28 sm:h-32 sm:w-32 object-contain drop-shadow-md"
                onError={(e) => {
                  e.currentTarget.src = "/images/players/player-placeholder.svg";
                }}
              />
              {mvp.tournamentTeamLogo && (
                <div className="absolute -bottom-1 -right-1 h-10 w-10 sm:h-7 sm:w-7 rounded-full bg-white p-0.5 border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden z-10">
                  <img
                    src={mvp.tournamentTeamLogo}
                    alt={mvp.tournamentTeamName}
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row: Name, Team & Points */}
          <div className="w-full space-y-1 z-10">
            <div className="min-w-0">
              <h4 className="font-black text-xs sm:text-sm text-gray-900 truncate leading-tight group-hover:text-[#37003C] transition-colors">
                {mvp.fplName}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate">
                {mvp.tournamentTeamName}
              </p>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#37003C] text-[#00FF87] font-black text-xs sm:text-sm shadow-2xs">
              <span>{mvp.gameweekPoints}</span>
              <span className="text-[9px] font-bold text-white/70 uppercase">PTS</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* =================================================================== */}
      {/* CARD 2: BEST TEAM IN THE ROUND                                      */}
      {/* =================================================================== */}
      {bestTeam ? (
        <div
          onClick={() => onSelectTeam?.(bestTeam.teamId)}
          className={cn(
            "relative aspect-[4/5] sm:aspect-square rounded-2xl border p-3 sm:p-4 flex flex-col justify-between items-center text-center transition-all group overflow-hidden select-none",
            onSelectTeam ? "cursor-pointer hover:shadow-md hover:border-emerald-400 hover:-translate-y-0.5" : "",
            isLive
              ? "bg-gradient-to-b from-rose-50/70 via-white to-emerald-50/40 border-rose-200/90 shadow-2xs"
              : "bg-gradient-to-b from-emerald-50/40 via-white to-emerald-50/20 border-emerald-200/80 shadow-2xs"
          )}
        >
          {/* Header Row: Badge & Gameweek */}
          <div className="w-full flex items-center justify-between z-10">
            {isLive ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-2xs animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                LIVE TEAM
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00A855] text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-2xs">
                <Trophy className="h-3 w-3 fill-current text-white" />
                BEST TEAM
              </span>
            )}
            <span className="text-[10px] sm:text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
              GW {gameweek}
            </span>
          </div>

          {/* Center: Team Logo */}
          <div className="relative my-auto flex items-center justify-center py-1">
            <div className="relative group-hover:scale-105 transition-transform duration-200 flex items-center justify-center">
              {bestTeam.teamLogo && !failedTeamLogos[bestTeam.teamId] ? (
                <img
                  src={bestTeam.teamLogo}
                  alt={bestTeam.teamName}
                  className="h-24 w-24 sm:h-28 sm:w-28 object-contain drop-shadow-md"
                  onError={() =>
                    setFailedTeamLogos((prev) => ({
                      ...prev,
                      [bestTeam.teamId]: true,
                    }))
                  }
                />
              ) : (
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex flex-col items-center justify-center text-emerald-700 shadow-2xs p-2">
                  <Shield className="h-10 w-10 text-emerald-600 mb-1" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-center truncate max-w-full">
                    {bestTeam.teamName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row: Name, Match & Points */}
          <div className="w-full space-y-1 z-10">
            <div className="min-w-0">
              <h4 className="font-black text-xs sm:text-sm text-gray-900 truncate leading-tight group-hover:text-[#37003C] transition-colors">
                {bestTeam.teamName}
              </h4>
              <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate">
                {bestTeam.opponentName ? `vs ${bestTeam.opponentName}` : "Matchday"}
              </p>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#37003C] text-[#00FF87] font-black text-xs sm:text-sm shadow-2xs">
              <span>{bestTeam.score}</span>
              <span className="text-[9px] font-bold text-white/70 uppercase">PTS</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
