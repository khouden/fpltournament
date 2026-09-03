"use client";

import * as React from "react";
import Image from "next/image";
import { ClubBadge } from "@/components/football/club-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface PlayerCardData {
  id?: number | string;
  name: string;
  fullName?: string;
  photoUrl?: string | null;
  clubName: string;
  clubLogoUrl?: string | null;
  position: "GKP" | "DEF" | "MID" | "FWD";
  price?: number | string; // e.g. "£12.5m" or 12.5
  points: number;
  status?: "available" | "doubtful" | "injured" | "suspended";
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  multiplier?: number;
}

export interface PlayerCardProps extends React.HTMLAttributes<HTMLDivElement> {
  player: PlayerCardData;
  interactive?: boolean;
}

export function PlayerCard({
  player,
  interactive = true,
  className,
  ...props
}: PlayerCardProps) {
  const [imgError, setImgError] = React.useState(false);

  const positionColors = {
    GKP: "bg-[#E7FF00]/20 text-[#7a8a00] border-[#E7FF00]/40",
    DEF: "bg-[#00D9FF]/20 text-[#0089a3] border-[#00D9FF]/40",
    MID: "bg-[#00FF87]/20 text-[#008a47] border-[#00FF87]/40",
    FWD: "bg-[#E9007F]/20 text-[#b50063] border-[#E9007F]/40",
  };

  const formattedPrice =
    typeof player.price === "number"
      ? `£${player.price.toFixed(1)}m`
      : player.price;

  return (
    <Card
      variant={interactive ? "interactive" : "default"}
      className={cn(
        "relative overflow-hidden flex flex-col justify-between w-full max-w-[240px] group bg-white",
        className
      )}
      {...props}
    >
      {/* Top Header: Club Badge & Position */}
      <div className="p-3.5 pb-0 flex items-center justify-between z-10">
        <ClubBadge
          name={player.clubName}
          logoUrl={player.clubLogoUrl}
          size="sm"
        />

        <div className="flex items-center gap-1.5">
          {player.isCaptain && (
            <Badge variant="captain" size="sm">
              C {player.multiplier && player.multiplier > 2 ? `${player.multiplier}x` : ""}
            </Badge>
          )}
          {player.isViceCaptain && (
            <Badge variant="viceCaptain" size="sm">
              V
            </Badge>
          )}
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider",
              positionColors[player.position] || positionColors.MID
            )}
          >
            {player.position}
          </span>
        </div>
      </div>

      {/* Prominent Player Image Section */}
      <div className="relative h-36 w-full flex items-center justify-center my-1 overflow-hidden px-4">
        {player.photoUrl && !imgError ? (
          <Image
            src={player.photoUrl}
            alt={player.name}
            fill
            sizes="200px"
            className="object-contain object-bottom transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="h-20 w-20 rounded-full bg-gradient-to-b from-[#37003C] to-[#240027] flex items-center justify-center text-white font-black text-2xl shadow-xs">
              {player.name.slice(0, 2).toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Player Details & Points Footer */}
      <div className="border-t border-[#EEEEEE] bg-[#FBFBFB] p-3.5">
        <div className="flex items-center justify-between">
          <div className="truncate pr-2">
            <h4 className="font-extrabold text-sm text-[#1F1F1F] tracking-tight truncate leading-tight">
              {player.name}
            </h4>
            <div className="text-[11px] text-[#777777] font-medium truncate">
              {player.fullName || player.clubName}
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="font-mono text-base font-black text-[#37003C] leading-none">
              {player.points}
              <span className="text-[10px] font-normal text-[#777777] ml-0.5">pts</span>
            </div>
            {formattedPrice && (
              <div className="font-mono text-[10px] font-bold text-[#555555] mt-0.5">
                {formattedPrice}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
