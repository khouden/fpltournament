import * as React from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type FootballStatus =
  | "live"
  | "upcoming"
  | "completed"
  | "confirmed"
  | "updated"
  | "added"
  | "locked"
  | "captain"
  | "vice_captain";

export interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: FootballStatus;
  label?: string;
  size?: "default" | "sm" | "lg";
}

export function StatusBadge({
  status,
  label,
  size = "default",
  className,
  ...props
}: StatusBadgeProps) {
  const configs: Record<
    FootballStatus,
    { variant: BadgeProps["variant"]; defaultLabel: string; pulse?: boolean }
  > = {
    live: { variant: "live", defaultLabel: "LIVE", pulse: true },
    upcoming: { variant: "upcoming", defaultLabel: "UPCOMING" },
    completed: { variant: "completed", defaultLabel: "COMPLETED" },
    confirmed: { variant: "success", defaultLabel: "CONFIRMED" },
    updated: { variant: "cyan", defaultLabel: "UPDATED" },
    added: { variant: "fantasy", defaultLabel: "ADDED" },
    locked: { variant: "locked", defaultLabel: "LOCKED" },
    captain: { variant: "captain", defaultLabel: "CAPTAIN" },
    vice_captain: { variant: "viceCaptain", defaultLabel: "VICE CAPTAIN" },
  };

  const config = configs[status] || configs.upcoming;
  const displayLabel = label || config.defaultLabel;

  return (
    <Badge
      variant={config.variant}
      size={size}
      className={cn("gap-1.5 font-bold uppercase tracking-wider", className)}
      {...props}
    >
      {config.pulse && (
        <span className="h-2 w-2 rounded-full bg-white animate-fpl-pulse-dot" />
      )}
      <span>{displayLabel}</span>
    </Badge>
  );
}
