import * as React from "react";
import { ClubBadge } from "@/components/football/club-badge";
import { PlayerAvatar } from "@/components/football/player-avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface PlayerRowProps extends React.HTMLAttributes<HTMLDivElement> {
  player: {
    id?: number | string;
    name: string;
    fullName?: string;
    photoUrl?: string | null;
    clubName: string;
    clubLogoUrl?: string | null;
    position: "GKP" | "DEF" | "MID" | "FWD";
    price?: number | string;
    points: number;
    form?: string | number;
    status?: "available" | "doubtful" | "injured" | "suspended";
    isCaptain?: boolean;
    isViceCaptain?: boolean;
  };
  onClick?: () => void;
}

export function PlayerRow({ player, onClick, className, ...props }: PlayerRowProps) {
  const formattedPrice =
    typeof player.price === "number" ? `£${player.price.toFixed(1)}m` : player.price;

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-between gap-4 py-3 px-4 border-b border-[#EEEEEE] bg-white hover:bg-[#F7F7F7] transition-colors",
        onClick && "cursor-pointer",
        className
      )}
      {...props}
    >
      {/* Player info + photo */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <PlayerAvatar
          src={player.photoUrl}
          name={player.name}
          size="sm"
          clubLogoUrl={player.clubLogoUrl}
        />
        <div className="truncate">
          <div className="flex items-center gap-1.5 leading-tight">
            <span className="font-bold text-sm text-[#1F1F1F] truncate">
              {player.name}
            </span>
            {player.isCaptain && (
              <Badge variant="captain" size="sm">
                C
              </Badge>
            )}
            {player.isViceCaptain && (
              <Badge variant="viceCaptain" size="sm">
                V
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-[#777777] mt-0.5">
            <ClubBadge name={player.clubName} logoUrl={player.clubLogoUrl} size="xs" showName />
            <span>•</span>
            <span className="font-semibold">{player.position}</span>
          </div>
        </div>
      </div>

      {/* Stats columns */}
      <div className="flex items-center gap-4 sm:gap-8 shrink-0 text-right">
        {player.form !== undefined && (
          <div className="hidden sm:block">
            <div className="text-[10px] uppercase font-bold text-[#777777]">Form</div>
            <div className="font-mono text-xs font-semibold text-[#1F1F1F]">
              {player.form}
            </div>
          </div>
        )}

        {formattedPrice && (
          <div className="hidden sm:block">
            <div className="text-[10px] uppercase font-bold text-[#777777]">Price</div>
            <div className="font-mono text-xs font-semibold text-[#555555]">
              {formattedPrice}
            </div>
          </div>
        )}

        <div>
          <div className="text-[10px] uppercase font-bold text-[#777777]">Points</div>
          <div className="font-mono text-sm font-black text-[#37003C]">
            {player.points}
          </div>
        </div>
      </div>
    </div>
  );
}
