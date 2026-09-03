import * as React from "react";
import { ClubBadge } from "@/components/football/club-badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface TeamCardData {
  id?: number | string;
  name: string;
  logoUrl?: string | null;
  managerName?: string;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  points?: number;
  rank?: number;
}

export interface TeamCardProps extends React.HTMLAttributes<HTMLDivElement> {
  team: TeamCardData;
  onClick?: () => void;
}

export function TeamCard({ team, onClick, className, ...props }: TeamCardProps) {
  return (
    <Card
      variant={onClick ? "interactive" : "default"}
      onClick={onClick}
      className={cn("p-5 flex flex-col justify-between space-y-4 bg-white", className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <ClubBadge name={team.name} logoUrl={team.logoUrl} size="lg" />
          <div className="truncate">
            <h4 className="font-extrabold text-base text-[#1F1F1F] truncate leading-snug">
              {team.name}
            </h4>
            {team.managerName && (
              <p className="text-xs text-[#777777] truncate font-medium">
                Mgr: {team.managerName}
              </p>
            )}
          </div>
        </div>

        {team.rank && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EEEEEE] font-mono text-xs font-black text-[#37003C] shrink-0">
            #{team.rank}
          </div>
        )}
      </div>

      {team.points !== undefined && (
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[#EEEEEE] text-center font-mono">
          <div>
            <div className="text-[10px] uppercase font-bold text-[#777777]">P</div>
            <div className="text-sm font-bold text-[#1F1F1F]">{team.played ?? 0}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-[#777777]">W</div>
            <div className="text-sm font-bold text-[#00a859]">{team.won ?? 0}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-[#777777]">D</div>
            <div className="text-sm font-bold text-[#555555]">{team.drawn ?? 0}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-[#777777]">PTS</div>
            <div className="text-base font-black text-[#37003C]">{team.points}</div>
          </div>
        </div>
      )}
    </Card>
  );
}
