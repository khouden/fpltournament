"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  shortcutBadge?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onChange, onClear, shortcutBadge, ...props }, ref) => {
    const hasValue = Boolean(value && String(value).length > 0);

    return (
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3.5 h-4 w-4 text-[#777777] pointer-events-none" />
        <input
          ref={ref}
          type="search"
          value={value}
          onChange={onChange}
          className={cn(
            "flex h-10 w-full rounded-[8px] border border-[#E5E5E5] bg-white pl-10 pr-9 py-2 text-sm text-[#1F1F1F] shadow-xs transition-colors placeholder:text-[#777777] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#37003C] focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        {hasValue ? (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2.5 flex h-5 w-5 items-center justify-center rounded-full text-[#777777] hover:bg-[#EEEEEE] hover:text-[#1F1F1F] transition cursor-pointer"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : shortcutBadge ? (
          <div className="absolute right-2.5 hidden sm:flex items-center pointer-events-none">
            <kbd className="rounded-[4px] border border-[#E5E5E5] bg-[#F7F7F7] px-1.5 py-0.5 text-[10px] font-bold text-[#777777]">
              {shortcutBadge}
            </kbd>
          </div>
        ) : null}
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";
