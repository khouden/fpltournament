"use client";

import * as React from "react";
import Image from "next/image";
import { suggestLogoForTeamName } from "@/lib/team-logos";
import { cn } from "@/lib/utils";

export interface ClubBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  logoUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showName?: boolean;
  namePosition?: "right" | "bottom";
  className?: string;
}

const sizePixels = {
  xs: 20,
  sm: 28,
  md: 36,
  lg: 48,
  xl: 64,
};

const containerSizeClasses = {
  xs: "h-5 w-5",
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const textSizeClasses = {
  xs: "text-xs",
  sm: "text-xs font-semibold",
  md: "text-sm font-bold",
  lg: "text-base font-bold",
  xl: "text-lg font-extrabold",
};

export function ClubBadge({
  name = "Club",
  logoUrl,
  size = "md",
  showName = false,
  namePosition = "right",
  className,
  ...props
}: ClubBadgeProps) {
  const [imgError, setImgError] = React.useState(false);

  // Auto-resolve logo from team name if not directly provided
  const resolvedLogo = React.useMemo(() => {
    if (logoUrl) return logoUrl;
    if (!name) return null;
    const match = suggestLogoForTeamName(name);
    return match ? match.path : null;
  }, [logoUrl, name]);

  const px = sizePixels[size];
  const fallbackInitials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  const badgeGraphic = (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-0.5 shadow-xs border border-[#E5E5E5]",
        containerSizeClasses[size]
      )}
    >
      {resolvedLogo && !imgError ? (
        <Image
          src={resolvedLogo}
          alt={`${name} badge`}
          width={px}
          height={px}
          className="h-full w-full object-contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#37003C] to-[#5A0A63] text-[9px] font-black text-[#00FF87] select-none uppercase">
          {fallbackInitials || "FC"}
        </div>
      )}
    </div>
  );

  if (!showName) {
    return (
      <div className={cn("inline-flex", className)} title={name} {...props}>
        {badgeGraphic}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2",
        namePosition === "bottom" && "flex-col text-center gap-1",
        className
      )}
      {...props}
    >
      {badgeGraphic}
      <span
        className={cn(
          "text-[#1F1F1F] tracking-tight truncate leading-none",
          textSizeClasses[size]
        )}
      >
        {name}
      </span>
    </div>
  );
}
