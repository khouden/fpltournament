import * as React from "react";
import { cn } from "@/lib/utils";

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  label?: string;
}

export function Divider({
  orientation = "horizontal",
  label,
  className,
  ...props
}: DividerProps) {
  if (orientation === "vertical") {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn("inline-block w-px self-stretch bg-[#E5E5E5]", className)}
        {...props}
      />
    );
  }

  if (label) {
    return (
      <div
        role="separator"
        aria-orientation="horizontal"
        className={cn("flex items-center my-4 w-full", className)}
        {...props}
      >
        <div className="flex-grow border-t border-[#E5E5E5]" />
        <span className="px-3 text-xs font-semibold uppercase tracking-wider text-[#777777]">
          {label}
        </span>
        <div className="flex-grow border-t border-[#E5E5E5]" />
      </div>
    );
  }

  return (
    <hr
      role="separator"
      className={cn("my-4 border-0 border-t border-[#E5E5E5] w-full", className)}
      {...props}
    />
  );
}
