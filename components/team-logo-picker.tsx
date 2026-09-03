"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  TEAM_LEAGUES,
  TEAM_LOGOS,
  suggestLogoForTeamName,
} from "@/lib/team-logos";
import {
  Search,
  X,
  Check,
  Shield,
  Sparkles,
  ImageOff,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Reset/sync state when modal opens without setting state inside an effect
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setSelectedPath(currentLogo || null);
      setSearchQuery("");
      setSelectedLeague("ALL");
    }
  }

  // Auto suggestion based on teamName
  const suggestedLogo = useMemo(() => {
    if (!teamName) return null;
    return suggestLogoForTeamName(teamName);
  }, [teamName]);

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

  const handleConfirm = () => {
    onSelect(selectedPath);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 flex flex-col overflow-hidden bg-white shadow-2xl border-gray-200">
        {/* Modal Header */}
        <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">{title}</DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Choose from 390+ authentic club badges across 20 leagues
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Suggestion Banner */}
        {suggestedLogo && (
          <div className="mx-6 mt-4 flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/80 p-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1 border border-indigo-100 shadow-xs">
                <Image
                  src={suggestedLogo.path}
                  alt={suggestedLogo.name}
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-indigo-900">
                    Suggested for &quot;{teamName}&quot;
                  </span>
                  <Badge variant="secondary" className="gap-1 text-[10px] font-bold bg-indigo-200/60 text-indigo-800">
                    <Sparkles className="h-2.5 w-2.5" />
                    <span>Auto-Match</span>
                  </Badge>
                </div>
                <p className="text-xs text-indigo-700">
                  {suggestedLogo.name} ({suggestedLogo.league})
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => setSelectedPath(suggestedLogo.path)}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              <span>Use Suggested</span>
            </Button>
          </div>
        )}

        {/* Search & Filters */}
        <div className="px-6 pt-4 pb-2 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search club name or league (e.g., Arsenal, Real Madrid, Bayern, Chelsea)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 bg-gray-50/50"
              autoFocus
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* League Filter Scrollable Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <Button
              type="button"
              variant={selectedLeague === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedLeague("ALL")}
              className="rounded-full text-xs h-7 px-3 whitespace-nowrap"
            >
              All Leagues ({TEAM_LOGOS.length})
            </Button>
            {TEAM_LEAGUES.map((league) => (
              <Button
                key={league}
                type="button"
                variant={selectedLeague === league ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedLeague(league)}
                className="rounded-full text-xs h-7 px-3 whitespace-nowrap"
              >
                {league}
              </Button>
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
                      <Image
                        src={logo.path}
                        alt={logo.name}
                        width={48}
                        height={48}
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
              <Badge variant="success" className="gap-1 text-xs">
                <Check className="h-3 w-3" />
                <span>Logo Selected</span>
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
            >
              Confirm Selection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
