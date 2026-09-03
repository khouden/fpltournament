import * as React from "react";
import { cn } from "@/lib/utils";

export interface GeometricBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  density?: "subtle" | "normal";
}

export function GeometricBackground({
  density = "subtle",
  className,
  children,
  ...props
}: GeometricBackgroundProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[#240027] text-white",
        className
      )}
      {...props}
    >
      {/* Subtle angled SVG geometry */}
      <svg
        className="absolute inset-0 h-full w-full pointer-events-none opacity-20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="fpl-grid-pattern"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="#00FF87"
              strokeWidth="0.5"
              strokeOpacity={density === "subtle" ? "0.15" : "0.3"}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#fpl-grid-pattern)" />
      </svg>

      {/* Angled polygon streak */}
      <div
        aria-hidden="true"
        className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#E9007F]/20 via-[#37003C]/10 to-transparent rotate-45 transform pointer-events-none blur-2xl"
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
