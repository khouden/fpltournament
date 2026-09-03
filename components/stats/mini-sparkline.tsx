import * as React from "react";
import { cn } from "@/lib/utils";

export interface MiniSparklineProps
  extends Omit<React.SVGAttributes<SVGSVGElement>, "values"> {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
}

export function MiniSparkline({
  values,
  width = 64,
  height = 20,
  color = "#00FF87",
  fillOpacity = 0.15,
  className,
  ...props
}: MiniSparklineProps) {
  if (!values || values.length < 2) {
    return null;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;
  const fillD = `${pathD} L ${width},${height} L 0,${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible shrink-0", className)}
      {...props}
    >
      <defs>
        <linearGradient id={`sparkline-grad-${width}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#sparkline-grad-${width})`} />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
