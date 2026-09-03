import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type FantasyStatType =
  | "points"
  | "rank"
  | "budget"
  | "transfers"
  | "overall"
  | "gameweek";

export interface FantasyStatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  type: FantasyStatType;
  label: string;
  value: string | number;
  secondaryValue?: string | number;
  rankDelta?: number; // e.g. -120 or +50
  icon?: React.ReactNode;
}

export function FantasyStatCard({
  type,
  label,
  value,
  secondaryValue,
  rankDelta,
  icon,
  className,
  ...props
}: FantasyStatCardProps) {
  const accentBorders = {
    points: "border-l-4 border-l-[#00FF87]",
    rank: "border-l-4 border-l-[#E7FF00]",
    budget: "border-l-4 border-l-[#00D9FF]",
    transfers: "border-l-4 border-l-[#E9007F]",
    overall: "border-l-4 border-l-[#37003C]",
    gameweek: "border-l-4 border-l-[#00FF87]",
  };

  return (
    <Card
      className={cn(
        "p-5 bg-white shadow-fpl-sm flex flex-col justify-between space-y-2 relative overflow-hidden",
        accentBorders[type],
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#777777]">
        <span>{label}</span>
        {icon && <span className="text-[#37003C]">{icon}</span>}
      </div>

      <div className="flex items-baseline justify-between pt-1">
        <div className="font-mono text-3xl font-black text-[#1F1F1F] tracking-tight">
          {value}
        </div>

        {secondaryValue && (
          <div className="text-xs font-mono font-semibold text-[#777777]">
            {secondaryValue}
          </div>
        )}
      </div>

      {typeof rankDelta === "number" && (
        <div className="flex items-center gap-1 text-xs font-mono font-bold pt-1">
          {rankDelta > 0 ? (
            <span className="flex items-center text-[#00a859]">
              <TrendingUp className="h-3.5 w-3.5 mr-0.5" /> +{rankDelta}
            </span>
          ) : rankDelta < 0 ? (
            <span className="flex items-center text-[#E9007F]">
              <TrendingDown className="h-3.5 w-3.5 mr-0.5" /> {rankDelta}
            </span>
          ) : (
            <span className="text-[#777777]">No change</span>
          )}
          <span className="text-[#777777] font-normal text-[11px]">this gameweek</span>
        </div>
      )}
    </Card>
  );
}
