import * as React from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RankingIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  rank: number | string;
  previousRank?: number;
  showChange?: boolean;
}

export function RankingIndicator({
  rank,
  previousRank,
  showChange = true,
  className,
  ...props
}: RankingIndicatorProps) {
  const currentNum = typeof rank === "number" ? rank : parseInt(String(rank), 10);
  const diff =
    previousRank !== undefined && !isNaN(currentNum)
      ? previousRank - currentNum // in ranking, lower is better! (went from 10 to 5 -> diff is +5)
      : 0;

  const isUp = diff > 0;
  const isDown = diff < 0;
  const isNeutral = diff === 0;

  return (
    <div
      className={cn("inline-flex items-center gap-1.5 font-mono select-none", className)}
      {...props}
    >
      <span className="text-sm font-black text-[#1F1F1F]">#{rank}</span>

      {showChange && previousRank !== undefined && (
        <div
          className={cn(
            "flex items-center gap-0.5 text-[11px] font-bold",
            isUp && "text-[#00a859]",
            isDown && "text-[#E9007F]",
            isNeutral && "text-[#777777]"
          )}
        >
          {isUp && <ArrowUp className="h-3 w-3 stroke-[3]" />}
          {isDown && <ArrowDown className="h-3 w-3 stroke-[3]" />}
          {isNeutral && <Minus className="h-3 w-3 stroke-[3]" />}
          <span>{Math.abs(diff)}</span>
        </div>
      )}
    </div>
  );
}
