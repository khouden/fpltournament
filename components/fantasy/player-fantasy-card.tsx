"use client";

import * as React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface PlayerFantasyCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  clubShortName: string;
  position: "GKP" | "DEF" | "MID" | "FWD";
  points: number;
  multiplier?: number;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  isStarter?: boolean;
  price?: number | string;
  photoUrl?: string | null;
  activeChip?: string | null;
  onSelect?: () => void;
}

export function PlayerFantasyCard({
  name,
  clubShortName,
  position,
  points,
  multiplier = 1,
  isCaptain = false,
  isViceCaptain = false,
  isStarter = true,
  price,
  photoUrl,
  activeChip,
  onSelect,
  className,
  ...props
}: PlayerFantasyCardProps) {
  const [imgError, setImgError] = React.useState(false);
  const totalPoints = points * multiplier;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col items-center w-24 sm:w-28 text-center transition-transform duration-200 select-none",
        onSelect && "cursor-pointer hover:scale-105",
        !isStarter && "opacity-85",
        className
      )}
      {...props}
    >
      {/* Captain / Vice Captain Badge */}
      <div className="absolute -top-1.5 -right-1 z-20">
        {isCaptain && (
          <Badge variant="captain" size="sm" className="shadow-xs text-[10px] font-black px-1.5 py-0">
            C {multiplier > 2 ? `${multiplier}x` : ""}
          </Badge>
        )}
        {isViceCaptain && (
          <Badge variant="viceCaptain" size="sm" className="shadow-xs text-[10px] font-black px-1.5 py-0">
            V
          </Badge>
        )}
      </div>

      {/* Jersey / Player Cutout */}
      <div className="relative h-16 w-16 sm:h-20 sm:w-20 mb-1 flex items-center justify-center">
        {photoUrl && !imgError ? (
          <Image
            src={photoUrl}
            alt={name}
            fill
            sizes="80px"
            className="object-contain object-bottom drop-shadow-md"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#37003C] to-[#5A0A63] text-white font-extrabold text-sm sm:text-base border-2 border-white shadow-xs">
            {name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name and Club Banner */}
      <div className="w-full rounded-[4px] bg-[#37003C] text-white py-0.5 px-1 shadow-xs truncate">
        <div className="text-[11px] sm:text-xs font-black truncate leading-tight">
          {name}
        </div>
      </div>

      {/* Points Banner */}
      <div className="w-full mt-0.5 rounded-[4px] bg-white text-[#1F1F1F] py-0.5 px-1 border border-[#E5E5E5] shadow-xs flex items-center justify-between font-mono text-[10px] sm:text-[11px] font-bold">
        <span className="text-[#777777] uppercase">{clubShortName}</span>
        <span className={cn("font-black", totalPoints > 5 && "text-[#00a859]")}>
          {totalPoints} pts
        </span>
      </div>
    </div>
  );
}
