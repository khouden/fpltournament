import * as React from "react";
import { cn } from "@/lib/utils";

export type FormResult = "W" | "D" | "L";

export interface FormIndicatorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "results"> {
  results: (FormResult | string)[]; // e.g. ["W", "W", "D", "L", "W"]
  size?: "sm" | "md";
}

export function FormIndicator({
  results,
  size = "md",
  className,
  ...props
}: FormIndicatorProps) {
  const resultColors = {
    W: "bg-[#00FF87] text-[#37003C] border-[#00FF87]",
    D: "bg-[#777777] text-white border-[#777777]",
    L: "bg-[#E9007F] text-white border-[#E9007F]",
  };

  const sizeClasses = {
    sm: "h-5 w-5 text-[10px]",
    md: "h-6 w-6 text-xs",
  };

  return (
    <div className={cn("inline-flex items-center gap-1", className)} {...props}>
      {results.slice(-5).map((res, idx) => {
        const char = res.toUpperCase()[0] as FormResult;
        const colorClass = resultColors[char] || "bg-gray-200 text-gray-700";

        return (
          <div
            key={idx}
            title={char === "W" ? "Win" : char === "D" ? "Draw" : "Loss"}
            className={cn(
              "flex items-center justify-center rounded-full font-mono font-black border shadow-xs select-none",
              sizeClasses[size],
              colorClass
            )}
          >
            {char}
          </div>
        );
      })}
    </div>
  );
}
