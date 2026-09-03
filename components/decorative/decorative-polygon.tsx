import * as React from "react";
import { cn } from "@/lib/utils";

export interface DecorativePolygonProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: "lime" | "green" | "cyan" | "magenta" | "purple";
  size?: "sm" | "md" | "lg";
}

export function DecorativePolygon({
  color = "green",
  size = "md",
  className,
  ...props
}: DecorativePolygonProps) {
  const colorMap = {
    lime: "#E7FF00",
    green: "#00FF87",
    cyan: "#00D9FF",
    magenta: "#E9007F",
    purple: "#37003C",
  };

  const sizePixels = {
    sm: 40,
    md: 80,
    lg: 140,
  };

  const px = sizePixels[size];

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none select-none overflow-hidden", className)}
      {...props}
    >
      <svg width={px} height={px} viewBox="0 0 100 100" fill="none">
        <polygon
          points="0,0 100,0 50,100"
          fill={colorMap[color]}
          fillOpacity="0.25"
        />
      </svg>
    </div>
  );
}
