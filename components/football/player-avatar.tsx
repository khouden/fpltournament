"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface PlayerAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  clubLogoUrl?: string | null;
  position?: "GKP" | "DEF" | "MID" | "FWD";
}

const sizePixels = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 56,
  xl: 72,
};

const containerSizeClasses = {
  xs: "h-6 w-6",
  sm: "h-8 w-8",
  md: "h-11 w-11",
  lg: "h-14 w-14",
  xl: "h-18 w-18",
};

export function PlayerAvatar({
  src,
  name,
  size = "md",
  clubLogoUrl,
  position,
  className,
  ...props
}: PlayerAvatarProps) {
  const [imgError, setImgError] = React.useState(false);
  const px = sizePixels[size];

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn("relative inline-flex shrink-0", containerSizeClasses[size], className)}
      title={name}
      {...props}
    >
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-[#37003C] to-[#240027] border-2 border-white shadow-xs">
        {src && !imgError ? (
          <Image
            src={src}
            alt={name}
            width={px}
            height={px}
            className="h-full w-full object-cover object-top"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-bold text-white text-xs select-none">
            {initials || "PL"}
          </div>
        )}
      </div>

      {/* Mini club logo overlay on bottom right */}
      {clubLogoUrl && (
        <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white p-0.5 shadow-xs border border-[#E5E5E5]">
          <Image
            src={clubLogoUrl}
            alt="Club"
            width={12}
            height={12}
            className="h-full w-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
