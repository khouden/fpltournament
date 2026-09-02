"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  TEAM_LEAGUES,
  TEAM_LOGOS,
  TeamLogo,
  suggestLogoForTeamName,
} from "@/lib/team-logos";
import {
  Search,
  X,
  Check,
  Shield,
  Sparkles,
  Filter,
  ImageOff,
} from "lucide-react";

interface TeamLogoPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (logoPath: string | null) => void;
  currentLogo?: string | null;
  teamName?: string;
  title?: string;
}

export function TeamLogoPicker({
  isOpen,
  onClose,
  onSelect,
  currentLogo,
  teamName,
  title = "Choose Team Logo",
}: TeamLogoPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeague, setSelectedLeague] = useState<string>("ALL");
  const [selectedPath, setSelectedPath] = useState<string | null>(
    currentLogo || null
  );

  // Auto suggestion based on teamName
  const suggestedLogo = useMemo(() => {
    if (!teamName) return null;
    return suggestLogoForTeamName(teamName);
  }, [teamName]);

  // Sync currentLogo when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedPath(currentLogo || null);
      setSearchQuery("");
      setSelectedLeague("ALL");
    }
  }, [isOpen, currentLogo]);

  // Filtered logos
  const filteredLogos = useMemo(() => {
    let list = TEAM_LOGOS;

    if (selectedLeague !== "ALL") {
      list = list.filter((t) => t.league === selectedLeague);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.league.toLowerCase().includes(q) ||
          t.filename.toLowerCase().includes(q)
      );
    }

    return list;
  }, [searchQuery, selectedLeague]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onSelect(selectedPath);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="relative flex flex-col w-full max-w-3xl max-h-[85vh] rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <p className="text-xs text-gray-500">
                Choose from 390+ authentic club badges across 20 leagues
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Suggestion Banner */}
        {suggestedLogo && (
          <div className="mx-6 mt-4 flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/80 p-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1 border border-indigo-100 shadow-xs">
                <img
                  src={suggestedLogo.path}
                  alt={suggestedLogo.name}
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-indigo-900">
                    Suggested for &quot;{teamName}&quot;
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-indigo-200/60 px-1.5 py-0.2 text-[10px] font-bold text-indigo-800">
                    <Sparkles className="h-2.5 w-2.5" />
                    Auto-Match
                  </span>
                </div>
                <p className="text-xs text-indigo-700">
                  {suggestedLogo.name} ({suggestedLogo.league})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPath(suggestedLogo.path)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Use Suggested</span>
            </button>
          </div>
        )}

        {/* Search & Filters */}
        <div className="px-6 pt-4 pb-2 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search club name or league (e.g., Arsenal, Real Madrid, Bayern, Chelsea)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-gray-50/50 pl-9 pr-8 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* League Filter Scrollable Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedLeague("ALL")}
              className={`rounded-full px-3 py-1 font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedLeague === "ALL"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All Leagues ({TEAM_LOGOS.length})
            </button>
            {TEAM_LEAGUES.map((league) => (
              <button
                key={league}
                type="button"
                onClick={() => setSelectedLeague(league)}
                className={`rounded-full px-3 py-1 font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedLeague === league
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {league}
              </button>
            ))}
          </div>
        </div>

        {/* Logos Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-3 min-h-[260px]">
          {filteredLogos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
              <ImageOff className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm font-semibold">No logos found</p>
              <p className="text-xs text-gray-400 mt-1">
                Try a different search term or select another league.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {/* Option to clear logo */}
              <button
                type="button"
                onClick={() => setSelectedPath(null)}
                className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition cursor-pointer ${
                  selectedPath === null
                    ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                  <ImageOff className="h-6 w-6" />
                </div>
                <span className="mt-2 text-xs font-bold text-gray-700">
                  No Logo
                </span>
                <span className="text-[10px] text-gray-400">Default badge</span>
              </button>

              {filteredLogos.map((logo) => {
                const isSelected = selectedPath === logo.path;
                return (
                  <button
                    key={logo.id}
                    type="button"
                    onClick={() => setSelectedPath(logo.path)}
                    className={`group relative flex flex-col items-center justify-between rounded-xl border p-2.5 text-center transition cursor-pointer ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/30 shadow-xs"
                        : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50/80"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}

                    <div className="flex h-14 w-14 items-center justify-center p-1">
                      <img
                        src={logo.path}
                        alt={logo.name}
                        className="max-h-12 max-w-12 object-contain transition group-hover:scale-110"
                        loading="lazy"
                      />
                    </div>

                    <div className="w-full mt-1.5">
                      <p className="text-xs font-bold text-gray-900 truncate" title={logo.name}>
                        {logo.name}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate" title={logo.league}>
                        {logo.league}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {filteredLogos.length} clubs available
            </span>
            {selectedPath && (
              <span className="inline-flex items-center gap-1 text-xs text-indigo-700 font-semibold">
                <Check className="h-3 w-3" />
                <span>Logo Selected</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
