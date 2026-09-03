import * as React from "react";
import { cn } from "@/lib/utils";

export interface BackgroundNumberProps extends React.HTMLAttributes<HTMLDivElement> {
  number: string | number;
  position?: "top-right" | "bottom-right" | "bottom-left" | "center";
  opacity?: number;
}

export function BackgroundNumber({
  number,
  position = "bottom-right",
  opacity = 0.05,
  className,
  ...props
}: BackgroundNumberProps) {
  const positionClasses = {
    "top-right": "-top-6 -right-4",
    "bottom-right": "-bottom-6 -right-4",
    "bottom-left": "-bottom-6 -left-4",
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  };

  return (
    <div
      aria-hidden="true"
      style={{ opacity }}
      className={cn(
        "absolute pointer-events-none select-none font-mono font-black text-7xl sm:text-9xl leading-none text-current",
        positionClasses[position],
        className
      )}
      {...props}
    >
      {number}
    </div>
  );
}
