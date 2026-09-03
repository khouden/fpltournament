import * as React from "react";
import { Clock, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { GameweekBadge } from "@/components/football/gameweek-badge";
import { cn } from "@/lib/utils";

export interface GameweekCardProps extends React.HTMLAttributes<HTMLDivElement> {
  gameweek: number | string;
  deadline?: string;
  points?: number;
  averagePoints?: number;
  highestPoints?: number;
  rank?: string | number;
  status?: "active" | "upcoming" | "finished" | "next";
}

export function GameweekCard({
  gameweek,
  deadline,
  points,
  averagePoints,
  highestPoints,
  rank,
  status = "active",
  className,
  ...props
}: GameweekCardProps) {
  return (
    <Card className={cn("p-5 bg-white shadow-fpl-sm space-y-4", className)} {...props}>
      <div className="flex items-center justify-between pb-2 border-b border-[#EEEEEE]">
        <GameweekBadge gameweek={gameweek} status={status} />
        {deadline && (
          <div className="flex items-center gap-1.5 text-xs text-[#777777]">
            <Clock className="h-3.5 w-3.5 text-[#37003C]" />
            <span>{deadline}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {points !== undefined && (
          <div className="bg-[#F7F7F7] p-2.5 rounded-[8px]">
            <div className="text-[10px] font-bold uppercase text-[#777777]">Your Score</div>
            <div className="font-mono text-xl font-black text-[#37003C] mt-0.5">
              {points}
            </div>
          </div>
        )}

        {averagePoints !== undefined && (
          <div className="bg-[#F7F7F7] p-2.5 rounded-[8px]">
            <div className="text-[10px] font-bold uppercase text-[#777777]">Average</div>
            <div className="font-mono text-xl font-bold text-[#555555] mt-0.5">
              {averagePoints}
            </div>
          </div>
        )}

        {highestPoints !== undefined && (
          <div className="bg-[#F7F7F7] p-2.5 rounded-[8px]">
            <div className="text-[10px] font-bold uppercase text-[#777777]">Highest</div>
            <div className="font-mono text-xl font-bold text-[#00a859] mt-0.5">
              {highestPoints}
            </div>
          </div>
        )}
      </div>

      {rank && (
        <div className="pt-1 flex items-center justify-between text-xs text-[#555555]">
          <span className="font-medium">Gameweek Rank:</span>
          <span className="font-mono font-black text-[#1F1F1F]">#{rank}</span>
        </div>
      )}
    </Card>
  );
}
