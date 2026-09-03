import * as React from "react";
import { ClubBadge } from "@/components/football/club-badge";
import { StatusBadge, type FootballStatus } from "@/components/football/status-badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface FixtureTeam {
  name: string;
  logoUrl?: string | null;
  score?: number | null;
}

export interface FixtureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  homeTeam: FixtureTeam;
  awayTeam: FixtureTeam;
  gameweek?: number | string;
  kickoffDate?: string;
  kickoffTime?: string;
  status?: FootballStatus;
  onClick?: () => void;
}

export function FixtureCard({
  homeTeam,
  awayTeam,
  gameweek,
  kickoffDate,
  kickoffTime,
  status = "upcoming",
  onClick,
  className,
  ...props
}: FixtureCardProps) {
  const isFinished = status === "completed";
  const isLive = status === "live";

  return (
    <Card
      variant={onClick ? "interactive" : "default"}
      onClick={onClick}
      className={cn("p-4 bg-white shadow-fpl-sm overflow-hidden", className)}
      {...props}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between mb-3 text-xs text-[#777777] border-b border-[#EEEEEE] pb-2">
        <div className="flex items-center gap-2">
          {gameweek && (
            <span className="font-mono font-bold text-[#37003C]">GW {gameweek}</span>
          )}
          {kickoffDate && <span>{kickoffDate}</span>}
        </div>
        <StatusBadge status={status} size="sm" />
      </div>

      {/* Fixture Teams Row */}
      <div className="grid grid-cols-12 items-center gap-2 py-1">
        {/* Home Team */}
        <div className="col-span-5 flex items-center gap-2 justify-end text-right">
          <span className="font-bold text-sm text-[#1F1F1F] truncate leading-tight">
            {homeTeam.name}
          </span>
          <ClubBadge name={homeTeam.name} logoUrl={homeTeam.logoUrl} size="sm" />
        </div>

        {/* Score / VS Center Column */}
        <div className="col-span-2 flex flex-col items-center justify-center text-center">
          {isFinished || isLive ? (
            <div className="flex items-center gap-1 font-mono font-black text-base text-[#37003C] bg-[#EEEEEE] px-2.5 py-0.5 rounded-[6px]">
              <span>{homeTeam.score ?? 0}</span>
              <span className="text-[#777777]">-</span>
              <span>{awayTeam.score ?? 0}</span>
            </div>
          ) : (
            <div className="font-mono text-xs font-bold text-[#777777] bg-[#F7F7F7] px-2 py-1 rounded-[4px]">
              {kickoffTime || "VS"}
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="col-span-5 flex items-center gap-2 justify-start text-left">
          <ClubBadge name={awayTeam.name} logoUrl={awayTeam.logoUrl} size="sm" />
          <span className="font-bold text-sm text-[#1F1F1F] truncate leading-tight">
            {awayTeam.name}
          </span>
        </div>
      </div>
    </Card>
  );
}
