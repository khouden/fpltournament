import * as React from "react";
import { cn } from "@/lib/utils";

export interface DecorativeWaveProps extends React.HTMLAttributes<HTMLDivElement> {
  fill?: string;
  inverted?: boolean;
}

export function DecorativeWave({
  fill = "#F7F7F7",
  inverted = false,
  className,
  ...props
}: DecorativeWaveProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "w-full overflow-hidden leading-none pointer-events-none select-none",
        inverted && "rotate-180",
        className
      )}
      {...props}
    >
      <svg
        className="relative block w-full h-8 sm:h-12 lg:h-16"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,0 C150,90 350,-40 500,60 C650,160 900,10 1200,40 L1200,120 L0,120 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}
