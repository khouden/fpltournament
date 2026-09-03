"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface GameweekPoint {
  gameweek: number | string;
  points: number;
  average?: number;
}

export interface PointsChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: GameweekPoint[];
  title?: string;
  height?: number;
}

export function PointsChart({
  data,
  title = "Gameweek Points History",
  height = 160,
  className,
  ...props
}: PointsChartProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-[#777777]">
        No points history recorded yet.
      </div>
    );
  }

  const maxPoints = Math.max(...data.map((d) => d.points), 50);

  return (
    <div className={cn("w-full bg-white rounded-[10px] border border-[#E5E5E5] p-5 shadow-fpl-sm space-y-3", className)} {...props}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#777777]">
          {title}
        </h4>
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div className="font-mono text-xs font-bold text-[#37003C]">
            GW {data[hoveredIndex].gameweek}:{" "}
            <span className="text-[#00a859]">{data[hoveredIndex].points} pts</span>
          </div>
        )}
      </div>

      {/* SVG Responsive Bar Chart */}
      <div className="relative w-full overflow-x-auto pb-1" style={{ height: `${height}px` }}>
        <div className="flex items-end justify-between gap-1 sm:gap-2 h-full min-w-[280px] pt-4">
          {data.map((item, idx) => {
            const barHeight = Math.max(8, (item.points / maxPoints) * (height - 36));
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
              >
                {/* Bar */}
                <div
                  style={{ height: `${barHeight}px` }}
                  className={cn(
                    "w-full max-w-[24px] rounded-t-[4px] transition-all duration-200",
                    isHovered
                      ? "bg-[#00FF87] shadow-fpl-glow-green"
                      : "bg-[#37003C] group-hover:bg-[#5A0A63]"
                  )}
                />

                {/* GW Label */}
                <div className="mt-1.5 font-mono text-[9px] sm:text-[10px] text-[#777777] font-semibold truncate">
                  {item.gameweek}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
