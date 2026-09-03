import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FilterButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  activeCount?: number;
  label?: string;
}

export const FilterButton = React.forwardRef<HTMLButtonElement, FilterButtonProps>(
  ({ activeCount = 0, label = "Filters", className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={activeCount > 0 ? "primary" : "outline"}
        size="sm"
        className={cn("gap-2 shadow-xs", className)}
        {...props}
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span>{label}</span>
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E7FF00] font-mono text-[10px] font-black text-[#37003C]">
            {activeCount}
          </span>
        )}
      </Button>
    );
  }
);
FilterButton.displayName = "FilterButton";
