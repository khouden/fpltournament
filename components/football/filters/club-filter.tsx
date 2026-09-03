"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { ClubBadge } from "@/components/football/club-badge";
import { cn } from "@/lib/utils";

export interface ClubOption {
  name: string;
  logoUrl?: string | null;
}

export interface ClubFilterProps {
  clubs: ClubOption[];
  selectedClub: string | null; // null = all clubs
  onSelect: (club: string | null) => void;
  className?: string;
}

export function ClubFilter({
  clubs,
  selectedClub,
  onSelect,
  className,
}: ClubFilterProps) {
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

  const currentClub = clubs.find((c) => c.name === selectedClub);

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 items-center justify-between gap-3 rounded-[8px] border border-[#E5E5E5] bg-white px-3 py-2 text-sm font-semibold text-[#1F1F1F] shadow-xs hover:bg-[#F7F7F7] focus:outline-none focus:ring-2 focus:ring-[#37003C] cursor-pointer min-w-[180px]"
      >
        <div className="flex items-center gap-2 truncate">
          {currentClub ? (
            <>
              <ClubBadge name={currentClub.name} logoUrl={currentClub.logoUrl} size="xs" />
              <span className="truncate">{currentClub.name}</span>
            </>
          ) : (
            <span className="text-[#555555]">All Clubs</span>
          )}
        </div>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-60 max-h-64 overflow-y-auto rounded-[8px] border border-[#E5E5E5] bg-white p-1 shadow-fpl-md z-50 animate-fpl-fade-in">
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setIsOpen(false);
            }}
            className={cn(
              "flex w-full items-center justify-between px-3 py-2 text-xs font-bold rounded-[6px] transition-colors cursor-pointer",
              selectedClub === null
                ? "bg-[#37003C] text-white"
                : "text-[#1F1F1F] hover:bg-[#F7F7F7]"
            )}
          >
            <span>All Clubs</span>
            {selectedClub === null && <Check className="h-3.5 w-3.5" />}
          </button>

          <div className="my-1 border-t border-[#EEEEEE]" />

          {clubs.map((c) => {
            const isSelected = selectedClub === c.name;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => {
                  onSelect(c.name);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer",
                  isSelected
                    ? "bg-[#37003C] text-white"
                    : "text-[#1F1F1F] hover:bg-[#F7F7F7]"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <ClubBadge name={c.name} logoUrl={c.logoUrl} size="xs" />
                  <span className="truncate">{c.name}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
