"use client";

import * as React from "react";
import { ArrowUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SortOption {
  label: string;
  value: string;
}

export interface SortDropdownProps {
  options: SortOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  className?: string;
}

export function SortDropdown({
  options,
  selectedValue,
  onSelect,
  className,
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentOption = options.find((o) => o.value === selectedValue) || options[0];

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 items-center justify-between gap-2.5 rounded-[8px] border border-[#E5E5E5] bg-white px-3 py-2 text-sm font-semibold text-[#1F1F1F] shadow-xs hover:bg-[#F7F7F7] focus:outline-none focus:ring-2 focus:ring-[#37003C] cursor-pointer"
      >
        <ArrowUpDown className="h-3.5 w-3.5 text-[#777777]" />
        <span>Sort: {currentOption?.label}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-[8px] border border-[#E5E5E5] bg-white p-1 shadow-fpl-md z-50 animate-fpl-fade-in">
          {options.map((opt) => {
            const isSelected = selectedValue === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onSelect(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer",
                  isSelected
                    ? "bg-[#37003C] text-white font-bold"
                    : "text-[#1F1F1F] hover:bg-[#F7F7F7]"
                )}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
