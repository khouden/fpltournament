import * as React from "react";
import { ArrowRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "@/components/football/player-avatar";
import { cn } from "@/lib/utils";

export interface TransferPlayerInfo {
  name: string;
  clubName: string;
  photoUrl?: string | null;
  position?: "GKP" | "DEF" | "MID" | "FWD";
  price?: number | string;
}

export interface TransferCardProps extends React.HTMLAttributes<HTMLDivElement> {
  playerOut: TransferPlayerInfo;
  playerIn: TransferPlayerInfo;
  cost?: number | string; // e.g. 0 or 4, or "Free" or "-4 pts"
  gameweek?: number | string;
  transferTime?: string;
}

export function TransferCard({
  playerOut,
  playerIn,
  cost = 0,
  gameweek,
  transferTime,
  className,
  ...props
}: TransferCardProps) {
  const isFree = cost === 0 || cost === "Free" || cost === "0";

  return (
    <Card className={cn("p-4 bg-white shadow-fpl-sm space-y-3", className)} {...props}>
      <div className="flex items-center justify-between text-xs border-b border-[#EEEEEE] pb-2">
        <div className="flex items-center gap-2">
          {gameweek && (
            <span className="font-mono font-bold text-[#37003C]">GW {gameweek}</span>
          )}
          {transferTime && <span className="text-[#777777]">{transferTime}</span>}
        </div>
        <Badge variant={isFree ? "success" : "destructive"} size="sm">
          {isFree ? "Free Transfer" : `${cost} pts hit`}
        </Badge>
      </div>

      <div className="grid grid-cols-12 items-center gap-2">
        {/* Player OUT */}
        <div className="col-span-5 flex items-center gap-2.5">
          <div className="relative">
            <PlayerAvatar src={playerOut.photoUrl} name={playerOut.name} size="sm" />
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#E9007F] text-white">
              <ArrowDownLeft className="h-2.5 w-2.5" />
            </span>
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-[#1F1F1F] truncate leading-tight">
              {playerOut.name}
            </div>
            <div className="text-[10px] text-[#777777] truncate">
              {playerOut.clubName}
            </div>
          </div>
        </div>

        {/* Center Divider Arrow */}
        <div className="col-span-2 flex justify-center">
          <ArrowRight className="h-4 w-4 text-[#777777]" />
        </div>

        {/* Player IN */}
        <div className="col-span-5 flex items-center justify-end gap-2.5 text-right">
          <div className="truncate">
            <div className="text-xs font-bold text-[#00a859] truncate leading-tight">
              {playerIn.name}
            </div>
            <div className="text-[10px] text-[#777777] truncate">
              {playerIn.clubName}
            </div>
          </div>
          <div className="relative">
            <PlayerAvatar src={playerIn.photoUrl} name={playerIn.name} size="sm" />
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#00FF87] text-[#37003C]">
              <ArrowUpRight className="h-2.5 w-2.5" />
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
