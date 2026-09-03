"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type PositionOption = "ALL" | "GKP" | "DEF" | "MID" | "FWD";

export interface PositionFilterProps {
  value: PositionOption;
  onChange: (pos: PositionOption) => void;
  className?: string;
}

export function PositionFilter({ value, onChange, className }: PositionFilterProps) {
  const options: PositionOption[] = ["ALL", "GKP", "DEF", "MID", "FWD"];

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-[8px] bg-[#EEEEEE] p-1 shadow-xs",
        className
      )}
    >
      {options.map((opt) => {
        const isSelected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "rounded-[6px] px-3 py-1 text-xs font-bold transition-all cursor-pointer",
              isSelected
                ? "bg-[#37003C] text-white shadow-xs"
                : "text-[#555555] hover:text-[#1F1F1F]"
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
