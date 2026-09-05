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
  Trash2,
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

export interface TeamLogoPickerProps {
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

  // Sync state when modal opens without calling setState in an effect
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

  // Filtered logos list
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

  // Monogram initials for fallback tile
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

  const handleRemove = () => {
    setSelectedPath(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] p-0 flex flex-col overflow-hidden bg-white shadow-2xl border border-[#E5E5E5] rounded-2xl"
        aria-describedby="team-logo-picker-description"
      >
        {/* Header: Clean FPL light styling */}
        <DialogHeader className="px-5 sm:px-6 py-4 border-b border-[#E5E5E5] bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#37003C] text-white shadow-xs">
              <Shield className="h-5 w-5 text-[#00FF87]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black tracking-tight text-[#37003C]">
                {title}
              </DialogTitle>
              <DialogDescription
                id="team-logo-picker-description"
                className="text-xs text-[#666666] mt-0.5"
              >
                Select a football crest for this tournament team.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Suggestion Banner */}
        {suggestedLogo && (
          <div className="mx-4 sm:mx-6 mt-3.5 flex items-center justify-between gap-3 rounded-xl border border-[#37003C]/20 bg-[#37003C]/5 p-3 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 border border-[#E5E5E5] shadow-xs">
                <Image
                  src={suggestedLogo.path}
                  alt={suggestedLogo.name}
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                  unoptimized
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#37003C] truncate">
                    Suggested for &quot;{teamName}&quot;
                  </span>
                  <Badge
                    variant="secondary"
                    className="gap-1 text-[10px] font-black bg-[#00FF87]/20 text-[#008744] border-[#00FF87]/40 shrink-0"
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    <span>Auto-Match</span>
                  </Badge>
                </div>
                <p className="text-xs text-[#666666] truncate">
                  {suggestedLogo.name} ({suggestedLogo.league})
                </p>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={() => setSelectedPath(suggestedLogo.path)}
              className="bg-[#37003C] hover:bg-[#5A0A63] text-white h-8 text-xs font-bold shrink-0 rounded-lg"
            >
              <Check className="h-3.5 w-3.5 mr-1 text-[#00FF87]" />
              <span>Use Suggested</span>
            </Button>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="px-4 sm:px-6 pt-3 pb-2 space-y-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777777]" />
            <Input
              type="text"
              placeholder="Search team or club name (e.g. Arsenal, Real Madrid, Bayern, Liverpool)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 bg-[#F7F7F7] border-[#E5E5E5] focus-visible:ring-[#37003C] rounded-xl h-10 text-sm"
              autoFocus
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-[#777777] hover:text-[#1F1F1F]"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* League Filter Scrollable Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Button
              type="button"
              variant={selectedLeague === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedLeague("ALL")}
              className={`rounded-full text-xs h-7 px-3.5 font-bold whitespace-nowrap transition-colors ${
                selectedLeague === "ALL"
                  ? "bg-[#37003C] text-white hover:bg-[#5A0A63]"
                  : "bg-white border-[#E5E5E5] text-[#555555] hover:bg-[#F7F7F7] hover:text-[#1F1F1F]"
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
                className={`rounded-full text-xs h-7 px-3 font-semibold whitespace-nowrap transition-colors ${
                  selectedLeague === league
                    ? "bg-[#37003C] text-white hover:bg-[#5A0A63]"
                    : "bg-white border-[#E5E5E5] text-[#555555] hover:bg-[#F7F7F7] hover:text-[#1F1F1F]"
                }`}
              >
                {league}
              </Button>
            ))}
          </div>
        </div>

        {/* Logos Responsive Grid */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 min-h-[260px] bg-[#FAFAFA]">
          {filteredLogos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center text-[#777777]">
              <ImageOff className="h-10 w-10 text-[#CCCCCC] mb-2" />
              <p className="text-sm font-bold text-[#1F1F1F]">No logos found</p>
              <p className="text-xs text-[#777777] mt-1">
                Try a different search term or select another league.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-2.5">
              {/* Monogram / Clear Crest Fallback Tile */}
              <button
                type="button"
                onClick={() => setSelectedPath(null)}
                className={`group relative flex flex-col items-center justify-between rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                  selectedPath === null
                    ? "border-[#37003C] bg-[#37003C]/5 ring-2 ring-[#37003C] shadow-xs"
                    : "border-[#E5E5E5] bg-white hover:border-[#37003C]/40 hover:bg-[#F7F7F7]"
                }`}
                aria-label="Default Monogram - Initials fallback"
              >
                {selectedPath === null && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#37003C] text-white shadow-xs">
                    <Check className="h-2.5 w-2.5 text-[#00FF87]" />
                  </span>
                )}

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#37003C] text-white font-black text-sm shadow-2xs mt-1">
                  {monogram}
                </div>

                <div className="w-full mt-2">
                  <p className="text-xs font-bold text-[#1F1F1F] truncate">
                    Default Monogram
                  </p>
                  <p className="text-[10px] text-[#777777] truncate">
                    Initials fallback
                  </p>
                </div>
              </button>

              {/* Club Crest Tiles */}
              {filteredLogos.map((logo) => {
                const isSelected = selectedPath === logo.path;
                return (
                  <button
                    key={logo.id}
                    type="button"
                    onClick={() => setSelectedPath(logo.path)}
                    className={`group relative flex flex-col items-center justify-between rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#37003C] bg-[#37003C]/5 ring-2 ring-[#37003C] shadow-xs"
                        : "border-[#E5E5E5] bg-white hover:border-[#37003C]/40 hover:bg-[#F7F7F7]"
                    }`}
                    aria-label={`${logo.name}, ${logo.league}`}
                  >
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#37003C] text-white shadow-xs">
                        <Check className="h-2.5 w-2.5 text-[#00FF87]" />
                      </span>
                    )}

                    <div className="flex h-12 w-12 items-center justify-center p-1 mt-1">
                      <Image
                        src={logo.path}
                        alt={logo.name}
                        width={44}
                        height={44}
                        className="max-h-11 max-w-11 object-contain transition-transform duration-150 group-hover:scale-110"
                        loading="lazy"
                        unoptimized
                      />
                    </div>

                    <div className="w-full mt-2">
                      <p
                        className="text-xs font-bold text-[#1F1F1F] truncate"
                        title={logo.name}
                      >
                        {logo.name}
                      </p>
                      <p
                        className="text-[10px] text-[#777777] truncate"
                        title={logo.league}
                      >
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-[#E5E5E5] bg-white">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-xs text-[#777777] font-medium">
              {filteredLogos.length} clubs available
            </span>

            {/* Remove Logo button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={selectedPath === null && !currentLogo}
              className="text-[#E9007F] hover:bg-[#E9007F]/10 hover:text-[#E9007F] text-xs font-semibold gap-1 h-8 px-2 disabled:opacity-40"
              title="Remove assigned logo and use default monogram"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Remove Logo</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-[#E5E5E5] text-[#555555] hover:bg-[#F7F7F7] font-semibold rounded-lg h-9 px-4"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              className="bg-[#37003C] hover:bg-[#5A0A63] text-white font-bold rounded-lg h-9 px-5 shadow-xs"
            >
              Confirm Selection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
