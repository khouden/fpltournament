"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useId,
} from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TeamMember {
  id: string;
  fplName: string;
  fplTeamName: string | null;
  fplId: number;
  isAdmin?: boolean;
}

export interface TeamGroupOption {
  id: string;
  name: string;
  logo?: string | null;
  isManual?: boolean;
  members?: TeamMember[];
}

export interface SearchableTeamSelectProps {
  value: string;
  onChange: (value: string) => void;
  groups: TeamGroupOption[];
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  align?: "left" | "right";
}

export function SearchableTeamSelect({
  value,
  onChange,
  groups,
  disabled = false,
  placeholder = "Select Team...",
  ariaLabel,
  className,
  align = "left",
}: SearchableTeamSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    placement: "bottom" | "top";
  }>({
    top: 0,
    left: 0,
    width: 240,
    placement: "bottom",
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listboxId = useId();

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === value),
    [groups, value]
  );

  // Filter groups by name or member details, prioritizing starting-with matches
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groups;

    const matches = groups.filter((g) => {
      if (g.name.toLowerCase().includes(q)) return true;
      if (g.members && g.members.length > 0) {
        return g.members.some(
          (m) =>
            m.fplName.toLowerCase().includes(q) ||
            (m.fplTeamName && m.fplTeamName.toLowerCase().includes(q))
        );
      }
      return false;
    });

    // Sort: teams starting with the search query come first
    return matches.sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(q);
      const bStarts = b.name.toLowerCase().startsWith(q);

      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      return 0;
    });
  }, [groups, searchQuery]);

  // Position calculation for the portal menu
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 310;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const placement: "bottom" | "top" =
      spaceBelow < dropdownHeight && spaceAbove > spaceBelow ? "top" : "bottom";

    const width = Math.max(rect.width, 240);
    let left = align === "right" ? rect.right - width : rect.left;

    // Viewport clamping
    if (left + width > window.innerWidth - 8) {
      left = window.innerWidth - width - 8;
    }
    if (left < 8) {
      left = 8;
    }

    const top = placement === "bottom" ? rect.bottom + 4 : rect.top - 4;

    setCoords({
      top,
      left,
      width,
      placement,
    });
  }, [align]);

  // Reposition on scroll, resize, or open
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
      setHighlightedIndex(-1);
    }, 30);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Outside click listener
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      closeMenu();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen, closeMenu]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex]?.scrollIntoView({
        block: "nearest",
      });
    }
  }, [highlightedIndex]);

  const handleSelect = (groupId: string) => {
    onChange(groupId);
    closeMenu();
    triggerRef.current?.focus();
  };

  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange("");
    closeMenu();
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const isSearching = searchQuery.trim().length > 0;
    const showClearOption = Boolean(value && !isSearching);
    const totalItems = filteredGroups.length + (showClearOption ? 1 : 0);

    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
      triggerRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < totalItems ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (showClearOption && highlightedIndex === 0) {
        handleClear();
      } else {
        const itemIdx = showClearOption
          ? highlightedIndex - 1
          : highlightedIndex >= 0
            ? highlightedIndex
            : 0;
        if (itemIdx >= 0 && itemIdx < filteredGroups.length) {
          handleSelect(filteredGroups[itemIdx].id);
        } else if (filteredGroups.length > 0) {
          // If user pressed Enter, pick the first one in the list automatically
          handleSelect(filteredGroups[0].id);
        }
      }
    } else if (e.key === "Tab") {
      closeMenu();
    }
  };

  if (disabled) {
    return (
      <div
        className={cn(
          "w-full rounded-[8px] px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-[#1F1F1F] bg-transparent flex items-center gap-2",
          className
        )}
        aria-label={ariaLabel}
      >
        {selectedGroup ? (
          <div className="flex items-center gap-2 min-w-0 truncate">
            {selectedGroup.logo ? (
              <img
                src={selectedGroup.logo}
                alt=""
                className="h-4 w-4 object-contain shrink-0 rounded"
              />
            ) : (
              <div className="h-4 w-4 rounded bg-[#37003C]/10 text-[#37003C] flex items-center justify-center font-bold text-[9px] shrink-0">
                {selectedGroup.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="truncate font-bold text-[#1F1F1F]">
              {selectedGroup.name}
            </span>
          </div>
        ) : (
          <span className="text-[#888888] italic text-xs">Unassigned</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative w-full", className)}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel || placeholder}
        className={cn(
          "w-full rounded-[8px] border border-[#E5E5E5] bg-white px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-[#1F1F1F] transition-all hover:border-[#37003C]/40 focus:outline-none focus:ring-1 focus:ring-[#37003C] shadow-2xs flex items-center justify-between gap-1.5 cursor-pointer text-left",
          isOpen && "border-[#37003C] ring-1 ring-[#37003C]"
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedGroup ? (
            <>
              {selectedGroup.logo ? (
                <img
                  src={selectedGroup.logo}
                  alt=""
                  className="h-4 w-4 object-contain shrink-0 rounded"
                />
              ) : (
                <div className="h-4 w-4 rounded bg-[#37003C]/10 text-[#37003C] flex items-center justify-center font-bold text-[9px] shrink-0">
                  {selectedGroup.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="truncate text-[#1F1F1F] font-bold">
                {selectedGroup.name}
              </span>
            </>
          ) : (
            <span className="truncate text-[#777777] font-normal">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-[#888888]">
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              isOpen && "rotate-180 text-[#37003C]"
            )}
          />
        </div>
      </button>

      {/* Floating Searchable Menu Portal */}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            style={{
              position: "fixed",
              top: coords.placement === "bottom" ? `${coords.top}px` : "auto",
              bottom:
                coords.placement === "top"
                  ? `${window.innerHeight - coords.top}px`
                  : "auto",
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 9999,
            }}
            className="rounded-[10px] border border-gray-200 bg-white shadow-xl overflow-hidden flex flex-col max-h-[340px] animate-in fade-in-0 zoom-in-95 duration-100"
          >
            {/* Search Input Header */}
            <div className="p-2 border-b border-[#EEEEEE] bg-[#FAFAFA]">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-[#888888] pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search team or manager..."
                  className="w-full h-8 pl-8 pr-7 text-xs rounded-[6px] border border-[#E0E0E0] bg-white text-[#1F1F1F] placeholder:text-[#999999] focus:outline-none focus:border-[#37003C] focus:ring-1 focus:ring-[#37003C] transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2 text-[#888888] hover:text-[#1F1F1F] p-0.5 rounded cursor-pointer"
                    aria-label="Clear search text"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Results List */}
            <div
              ref={listRef}
              className="overflow-y-auto p-1 space-y-0.5 max-h-[260px] scrollbar-thin scrollbar-thumb-gray-200"
            >
              {/* Optional Clear / Unassigned item - only visible when not actively searching */}
              {value && !searchQuery.trim() && (
                <button
                  ref={(el) => {
                    itemRefs.current[0] = el;
                  }}
                  type="button"
                  role="option"
                  aria-selected={!value}
                  onClick={() => handleClear()}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-[6px] text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center justify-between transition cursor-pointer",
                    highlightedIndex === 0 && "bg-rose-50"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <X className="h-3.5 w-3.5" />
                    <span>Clear selection</span>
                  </span>
                </button>
              )}

              {/* Group items */}
              {filteredGroups.length === 0 ? (
                <div className="py-6 px-3 text-center text-xs text-[#888888]">
                  <p className="font-semibold text-[#555555]">No teams found</p>
                  <p className="text-[11px] text-[#999999] mt-0.5">
                    Try another search keyword
                  </p>
                </div>
              ) : (
                filteredGroups.map((group, idx) => {
                  const showClear = Boolean(value && !searchQuery.trim());
                  const actualIdx = showClear ? idx + 1 : idx;
                  const isSelected = group.id === value;
                  const isHighlighted = highlightedIndex === actualIdx;

                  // Check if search query matched a member rather than group name
                  const matchedMember =
                    searchQuery &&
                    !group.name.toLowerCase().includes(searchQuery.toLowerCase())
                      ? group.members?.find(
                          (m) =>
                            m.fplName
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase()) ||
                            (m.fplTeamName &&
                              m.fplTeamName
                                .toLowerCase()
                                .includes(searchQuery.toLowerCase()))
                        )
                      : null;

                  return (
                    <button
                      key={group.id}
                      ref={(el) => {
                        itemRefs.current[actualIdx] = el;
                      }}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(group.id)}
                      onMouseEnter={() => setHighlightedIndex(actualIdx)}
                      className={cn(
                        "w-full text-left px-2.5 py-2 rounded-[6px] text-xs transition cursor-pointer flex items-center justify-between gap-2",
                        isSelected
                          ? "bg-[#37003C]/10 text-[#37003C] font-black"
                          : isHighlighted
                            ? "bg-gray-100 text-[#1F1F1F]"
                            : "text-[#1F1F1F] hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {group.logo ? (
                          <img
                            src={group.logo}
                            alt=""
                            className="h-5 w-5 object-contain shrink-0 rounded"
                          />
                        ) : (
                          <div className="h-5 w-5 rounded bg-[#37003C]/10 text-[#37003C] flex items-center justify-center font-bold text-[10px] shrink-0">
                            {group.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold leading-tight">
                            {group.name}
                          </p>
                          {matchedMember && (
                            <p className="text-[10px] text-[#777777] truncate mt-0.5">
                              Manager: {matchedMember.fplName}{" "}
                              {matchedMember.fplTeamName &&
                                `(${matchedMember.fplTeamName})`}
                            </p>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="h-4 w-4 text-[#37003C] shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* List Footer with Count */}
            <div className="px-2.5 py-1.5 border-t border-[#EEEEEE] bg-[#FAFAFA] flex items-center justify-between text-[10px] text-[#888888]">
              <span>
                {filteredGroups.length}{" "}
                {filteredGroups.length === 1 ? "team" : "teams"}
              </span>
              <span className="text-[9px] text-[#AAAAAA]">
                Press Esc to close
              </span>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
