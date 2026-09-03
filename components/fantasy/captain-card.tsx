import * as React from "react";
import { Crown, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "@/components/football/player-avatar";
import { cn } from "@/lib/utils";

export interface CaptainPlayer {
  name: string;
  clubName: string;
  photoUrl?: string | null;
  basePoints: number;
  multiplier: number; // 2 or 3
  isTripleCaptain?: boolean;
}

export interface CaptainCardProps extends React.HTMLAttributes<HTMLDivElement> {
  captain: CaptainPlayer;
  viceCaptain?: {
    name: string;
    clubName: string;
    photoUrl?: string | null;
    points: number;
  };
}

export function CaptainCard({
  captain,
  viceCaptain,
  className,
  ...props
}: CaptainCardProps) {
  const totalCaptainPoints = captain.basePoints * captain.multiplier;

  return (
    <Card className={cn("p-5 bg-white shadow-fpl-sm space-y-4", className)} {...props}>
      <div className="flex items-center justify-between pb-2 border-b border-[#EEEEEE]">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#37003C]">
          <Crown className="h-4 w-4 text-[#E7FF00]" />
          <span>Armband Selection</span>
        </div>
        {captain.isTripleCaptain && (
          <Badge variant="warning" size="sm" className="gap-1">
            <Sparkles className="h-3 w-3" /> Triple Captain (3x)
          </Badge>
        )}
      </div>

      {/* Main Captain View */}
      <div className="flex items-center justify-between gap-4 p-3 rounded-[8px] bg-gradient-to-r from-[#37003C] to-[#5A0A63] text-white">
        <div className="flex items-center gap-3">
          <PlayerAvatar src={captain.photoUrl} name={captain.name} size="md" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm">{captain.name}</span>
              <Badge variant="captain" size="sm">
                C ({captain.multiplier}x)
              </Badge>
            </div>
            <div className="text-[11px] text-gray-300">{captain.clubName}</div>
          </div>
        </div>

        <div className="text-right font-mono">
          <div className="text-xl font-black text-[#00FF87] leading-none">
            {totalCaptainPoints} <span className="text-[10px] font-normal text-white">pts</span>
          </div>
          <div className="text-[10px] text-gray-300 mt-0.5">
            {captain.basePoints} × {captain.multiplier}
          </div>
        </div>
      </div>

      {/* Vice Captain */}
      {viceCaptain && (
        <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-[6px] bg-[#F7F7F7] text-[#1F1F1F]">
          <div className="flex items-center gap-2.5">
            <PlayerAvatar src={viceCaptain.photoUrl} name={viceCaptain.name} size="xs" />
            <div>
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="font-bold text-xs">{viceCaptain.name}</span>
                <Badge variant="viceCaptain" size="sm">
                  V
                </Badge>
              </div>
              <div className="text-[10px] text-[#777777]">{viceCaptain.clubName}</div>
            </div>
          </div>

          <div className="font-mono text-xs font-bold text-[#555555]">
            {viceCaptain.points} pts
          </div>
        </div>
      )}
    </Card>
  );
}
