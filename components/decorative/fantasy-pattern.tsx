import * as React from "react";
import { cn } from "@/lib/utils";

export interface FantasyPatternProps extends React.HTMLAttributes<HTMLDivElement> {
  pattern?: "dots" | "stripes";
  opacity?: number;
}

export function FantasyPattern({
  pattern = "dots",
  opacity = 0.08,
  className,
  ...props
}: FantasyPatternProps) {
  return (
    <div
      aria-hidden="true"
      style={{ opacity }}
      className={cn("absolute inset-0 pointer-events-none select-none", className)}
      {...props}
    >
      {pattern === "dots" ? (
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="fpl-dot-pattern"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.5" fill="#00FF87" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#fpl-dot-pattern)" />
        </svg>
      ) : (
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="fpl-stripe-pattern"
              width="16"
              height="16"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="16" stroke="#00D9FF" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#fpl-stripe-pattern)" />
        </svg>
      )}
    </div>
  );
}
