import * as React from "react";
import { cn } from "@/lib/utils";

export interface GameweekBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  gameweek: number | string;
  status?: "active" | "upcoming" | "finished" | "next";
  size?: "sm" | "default" | "lg";
}

export function GameweekBadge({
  gameweek,
  status,
  size = "default",
  className,
  ...props
}: GameweekBadgeProps) {
  const sizeClasses = {
    sm: "text-[11px] px-2 py-0.5",
    default: "text-xs px-2.5 py-1",
    lg: "text-sm px-3.5 py-1.5",
  };

  const statusColors = {
    active: "bg-[#00FF87] text-[#37003C] border-[#00FF87]",
    upcoming: "bg-[#37003C] text-white border-[#5A0A63]",
    finished: "bg-[#EEEEEE] text-[#555555] border-[#E5E5E5]",
    next: "bg-[#E7FF00] text-[#37003C] border-[#E7FF00]",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wider shadow-xs",
        sizeClasses[size],
        status ? statusColors[status] : "bg-[#37003C] text-white border-[#5A0A63]",
        className
      )}
      {...props}
    >
      <span className="font-mono">GW {gameweek}</span>
      {status && (
        <span className="opacity-80 text-[10px] lowercase font-normal">
          • {status}
        </span>
      )}
    </div>
  );
}
