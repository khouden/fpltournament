import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterChipProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value?: string;
  onRemove?: () => void;
  active?: boolean;
}

export function FilterChip({
  label,
  value,
  onRemove,
  active = true,
  className,
  ...props
}: FilterChipProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors shadow-xs select-none",
        active
          ? "border-[#37003C] bg-[#37003C] text-white"
          : "border-[#E5E5E5] bg-white text-[#555555] hover:border-[#37003C]",
        className
      )}
      {...props}
    >
      <span>{label}</span>
      {value && <span className="text-gray-300 font-normal">({value})</span>}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="rounded-full p-0.5 hover:bg-white/20 transition cursor-pointer"
          aria-label={`Remove filter ${label}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
