import * as React from "react";
import { cn } from "@/lib/utils";

export interface ComparisonBarProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  valueA: number;
  valueB: number;
  format?: (v: number) => string | number;
  highlightDominant?: boolean;
}

export function ComparisonBar({
  label,
  valueA,
  valueB,
  format = (v) => v,
  highlightDominant = true,
  className,
  ...props
}: ComparisonBarProps) {
  const total = valueA + valueB;
  const pctA = total > 0 ? (valueA / total) * 100 : 50;
  const pctB = total > 0 ? (valueB / total) * 100 : 50;

  const aDominant = highlightDominant && valueA > valueB;
  const bDominant = highlightDominant && valueB > valueA;

  return (
    <div className={cn("w-full space-y-1.5", className)} {...props}>
      {/* Numbers & Label */}
      <div className="flex items-center justify-between text-xs">
        <span
          className={cn(
            "font-mono font-black",
            aDominant ? "text-[#00a859] font-black" : "text-[#1F1F1F]"
          )}
        >
          {format(valueA)}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
          {label}
        </span>
        <span
          className={cn(
            "font-mono font-black",
            bDominant ? "text-[#00a859] font-black" : "text-[#1F1F1F]"
          )}
        >
          {format(valueB)}
        </span>
      </div>

      {/* Dual Bar */}
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#EEEEEE] gap-0.5">
        <div
          className={cn(
            "h-full rounded-l-full transition-all duration-300",
            aDominant ? "bg-[#37003C]" : "bg-[#777777]"
          )}
          style={{ width: `${pctA}%` }}
        />
        <div
          className={cn(
            "h-full rounded-r-full transition-all duration-300",
            bDominant ? "bg-[#37003C]" : "bg-[#777777]"
          )}
          style={{ width: `${pctB}%` }}
        />
      </div>
    </div>
  );
}
