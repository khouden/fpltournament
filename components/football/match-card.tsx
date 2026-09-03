import * as React from "react";
import Link from "next/link";
import { ArrowRight, ShieldAlert, Sparkles } from "lucide-react";
import { ClubBadge } from "@/components/football/club-badge";
import { StatusBadge, type FootballStatus } from "@/components/football/status-badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface MatchTeamData {
  id?: number | string;
  name: string;
  logoUrl?: string | null;
  score: number;
  managerCount?: number;
  chipActive?: string | null;
}

export interface MatchCardProps extends React.HTMLAttributes<HTMLDivElement> {
  matchId?: number | string;
  gameweek: number | string;
  status: FootballStatus;
  homeTeam: MatchTeamData;
  awayTeam: MatchTeamData;
  matchHref?: string;
}

export function MatchCard({
  matchId,
  gameweek,
  status,
  homeTeam,
  awayTeam,
  matchHref,
  className,
  ...props
}: MatchCardProps) {
  const isLive = status === "live";
  const isFinished = status === "completed";
  const homeWinner = isFinished && homeTeam.score > awayTeam.score;
  const awayWinner = isFinished && awayTeam.score > homeTeam.score;

  const cardContent = (
    <Card
      variant={matchHref ? "interactive" : "default"}
      className={cn(
        "p-5 bg-white overflow-hidden space-y-4",
        isLive && "border-[#E9007F]/40 shadow-fpl-glow-magenta",
        className
      )}
      {...props}
    >
      {/* Header with GW & Status */}
      <div className="flex items-center justify-between pb-3 border-b border-[#EEEEEE]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-[#37003C] uppercase">
            Gameweek {gameweek}
          </span>
        </div>
        <StatusBadge status={status} size="sm" />
      </div>

      {/* Teams Grid */}
      <div className="space-y-3">
        {/* Home Team */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <ClubBadge name={homeTeam.name} logoUrl={homeTeam.logoUrl} size="md" />
            <div className="truncate">
              <span
                className={cn(
                  "font-bold text-sm truncate block leading-snug",
                  homeWinner ? "text-[#37003C] font-extrabold" : "text-[#1F1F1F]"
                )}
              >
                {homeTeam.name}
              </span>
              {homeTeam.chipActive && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#00a859] uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" /> {homeTeam.chipActive}
                </span>
              )}
            </div>
          </div>
          <div className="font-mono text-xl font-black text-[#37003C] shrink-0">
            {homeTeam.score}
          </div>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <ClubBadge name={awayTeam.name} logoUrl={awayTeam.logoUrl} size="md" />
            <div className="truncate">
              <span
                className={cn(
                  "font-bold text-sm truncate block leading-snug",
                  awayWinner ? "text-[#37003C] font-extrabold" : "text-[#1F1F1F]"
                )}
              >
                {awayTeam.name}
              </span>
              {awayTeam.chipActive && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#00a859] uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" /> {awayTeam.chipActive}
                </span>
              )}
            </div>
          </div>
          <div className="font-mono text-xl font-black text-[#37003C] shrink-0">
            {awayTeam.score}
          </div>
        </div>
      </div>

      {/* Footer link / note */}
      <div className="pt-3 border-t border-[#EEEEEE] flex items-center justify-between text-xs text-[#777777]">
        <span className="text-[11px] font-medium text-[#777777]">
          Admin points excluded
        </span>
        {matchHref && (
          <span className="inline-flex items-center gap-1 font-bold text-[#37003C] group-hover:text-[#5A0A63]">
            Match Breakdown <ArrowRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </Card>
  );

  if (matchHref) {
    return (
      <Link href={matchHref} className="block group">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
