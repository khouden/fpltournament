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

  // Monogram initials for fallback
  const monogram = useMemo(() => {
    if (!teamName) return "FC";
    const parts = teamName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return teamName.slice(0, 2).toUpperCase();
  }, [teamName]);

  const handleConfirm = () => {
    onSelect(selectedPath);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 flex flex-col overflow-hidden bg-white shadow-2xl border-[#E5E5E5] rounded-2xl">
        {/* Modal Header */}
        <DialogHeader className="px-6 py-4 border-b border-[#E5E5E5] bg-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#37003C] text-white shadow-xs">
              <Shield className="h-5 w-5 text-[#00FF87]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#1F1F1F]">{title}</DialogTitle>
              <DialogDescription className="text-xs text-[#777777]">
                Choose from 390+ authentic club badges across 20 leagues
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Suggestion Banner */}
        {suggestedLogo && (
          <div className="mx-6 mt-4 flex items-center justify-between rounded-xl border border-[#37003C]/20 bg-[#37003C]/5 p-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1 border border-[#E5E5E5] shadow-xs">
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
                  <span className="text-xs font-bold text-[#37003C]">
                    Suggested for &quot;{teamName}&quot;
                  </span>
                  <Badge variant="secondary" className="gap-1 text-[10px] font-bold bg-[#00FF87]/20 text-[#008744] border-[#00FF87]/40">
                    <Sparkles className="h-2.5 w-2.5" />
                    <span>Auto-Match</span>
                  </Badge>
                </div>
                <p className="text-xs text-[#666666]">
                  {suggestedLogo.name} ({suggestedLogo.league})
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={() => setSelectedPath(suggestedLogo.path)}
              className="bg-[#37003C] hover:bg-[#5A0A63] text-white h-8 text-xs font-semibold"
            >
              <Check className="h-3.5 w-3.5 mr-1 text-[#00FF87]" />
              <span>Use Suggested</span>
            </Button>
          </div>
        )}

        {/* Search & Filters */}
        <div className="px-6 pt-4 pb-2 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777777]" />
            <Input
              type="text"
              placeholder="Search club name or league (e.g., Arsenal, Real Madrid, Bayern, Chelsea)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 bg-[#F7F7F7] border-[#E5E5E5] focus-visible:ring-[#37003C]"
              autoFocus
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-[#777777] hover:text-[#1F1F1F]"
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
              className={`rounded-full text-xs h-7 px-3 whitespace-nowrap transition-colors ${
                selectedLeague === "ALL"
                  ? "bg-[#37003C] text-white hover:bg-[#5A0A63]"
                  : "border-[#E5E5E5] text-[#555555] hover:bg-[#F7F7F7]"
              }`}
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
                className={`rounded-full text-xs h-7 px-3 whitespace-nowrap transition-colors ${
                  selectedLeague === league
                    ? "bg-[#37003C] text-white hover:bg-[#5A0A63]"
                    : "border-[#E5E5E5] text-[#555555] hover:bg-[#F7F7F7]"
                }`}
              >
                {league}
              </Button>
            ))}
          </div>
        </div>

        {/* Logos Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-3 min-h-[260px]">
          {filteredLogos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-[#777777]">
              <ImageOff className="h-10 w-10 text-[#CCCCCC] mb-2" />
              <p className="text-sm font-semibold text-[#1F1F1F]">No logos found</p>
              <p className="text-xs text-[#777777] mt-1">
                Try a different search term or select another league.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {/* Option to clear logo / monogram fallback */}
              <button
                type="button"
                onClick={() => setSelectedPath(null)}
                className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition cursor-pointer ${
                  selectedPath === null
                    ? "border-[#37003C] bg-[#37003C]/5 ring-2 ring-[#37003C]/20 shadow-xs"
                    : "border-[#E5E5E5] hover:border-[#CCCCCC] hover:bg-[#F7F7F7]"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#37003C] text-white font-extrabold text-base shadow-2xs">
                  {monogram}
                </div>
                <span className="mt-2 text-xs font-bold text-[#1F1F1F]">
                  Default Monogram
                </span>
                <span className="text-[10px] text-[#777777]">Initials fallback</span>
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
                        ? "border-[#37003C] bg-[#37003C]/5 ring-2 ring-[#37003C]/20 shadow-xs"
                        : "border-[#E5E5E5] hover:border-[#37003C]/40 hover:bg-[#F7F7F7]"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#37003C] text-white shadow-xs">
                        <Check className="h-2.5 w-2.5 text-[#00FF87]" />
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
                      <p className="text-xs font-bold text-[#1F1F1F] truncate" title={logo.name}>
                        {logo.name}
                      </p>
                      <p className="text-[10px] text-[#777777] truncate" title={logo.league}>
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E5E5E5] bg-[#F7F7F7]">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#777777]">
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
              className="border-[#E5E5E5] text-[#555555] hover:text-[#1F1F1F]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              className="bg-[#37003C] hover:bg-[#5A0A63] text-white"
            >
              Confirm Selection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
