"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { createBatchMatchesFromTextAction } from "@/lib/schedule-actions";

export interface GroupItem {
  id: string;
  name: string;
  logo?: string | null;
}

export interface QuickTextFixtureModalProps {
  isOpen: boolean;
  onClose: () => void;
  roundId: string;
  roundName: string;
  tournamentId: string;
  groups: GroupItem[];
  onSuccess: (count: number) => void;
}

interface ParsedFixture {
  rawLine: string;
  homeRaw: string;
  awayRaw: string;
  homeGroup: GroupItem | null;
  awayGroup: GroupItem | null;
  isValid: boolean;
  error?: string;
}

export function QuickTextFixtureModal({
  isOpen,
  onClose,
  roundId,
  roundName,
  tournamentId,
  groups,
  onSuccess,
}: QuickTextFixtureModalProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // Clean group names for fuzzy matching (remove common suffixes)
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .replace(/\bfc\b/g, "")
      .replace(/\bcf\b/g, "")
      .replace(/\bafc\b/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();

  const findBestMatch = useCallback(
    (query: string): GroupItem | null => {
      const cleanQuery = normalize(query);
      if (!cleanQuery) return null;

      // 1. Exact match
      const exact = groups.find((g) => g.name.toLowerCase() === query.trim().toLowerCase());
      if (exact) return exact;

      // 2. Normalized exact match
      const normExact = groups.find((g) => normalize(g.name) === cleanQuery);
      if (normExact) return normExact;

      // 3. Starts with or includes
      const starts = groups.find(
        (g) => normalize(g.name).startsWith(cleanQuery) || cleanQuery.startsWith(normalize(g.name))
      );
      if (starts) return starts;

      const includes = groups.find((g) => normalize(g.name).includes(cleanQuery));
      if (includes) return includes;

      return null;
    },
    [groups]
  );

  const parsedFixtures = useMemo<ParsedFixture[]>(() => {
    if (!text.trim()) return [];

    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const seenGroupsInRound = new Set<string>();

    return lines.map((line) => {
      // Split by 'vs', 'v', '-', or ','
      let parts: string[] = [];
      if (/\bvs\b/i.test(line)) {
        parts = line.split(/\bvs\b/i);
      } else if (/\bv\b/i.test(line)) {
        parts = line.split(/\bv\b/i);
      } else if (line.includes("-")) {
        parts = line.split("-");
      } else if (line.includes(",")) {
        parts = line.split(",");
      } else if (line.includes("\t")) {
        parts = line.split("\t");
      }

      if (parts.length < 2) {
        return {
          rawLine: line,
          homeRaw: line,
          awayRaw: "",
          homeGroup: null,
          awayGroup: null,
          isValid: false,
          error: "Format must be: Team A vs Team B",
        };
      }

      const homeRaw = parts[0].trim();
      const awayRaw = parts.slice(1).join(" ").trim();

      const homeGroup = findBestMatch(homeRaw);
      const awayGroup = findBestMatch(awayRaw);

      if (!homeGroup) {
        return {
          rawLine: line,
          homeRaw,
          awayRaw,
          homeGroup: null,
          awayGroup,
          isValid: false,
          error: `Unrecognized team: "${homeRaw}"`,
        };
      }

      if (!awayGroup) {
        return {
          rawLine: line,
          homeRaw,
          awayRaw,
          homeGroup,
          awayGroup: null,
          isValid: false,
          error: `Unrecognized team: "${awayRaw}"`,
        };
      }

      if (homeGroup.id === awayGroup.id) {
        return {
          rawLine: line,
          homeRaw,
          awayRaw,
          homeGroup,
          awayGroup,
          isValid: false,
          error: "Home and Away cannot be the same group",
        };
      }

      if (seenGroupsInRound.has(homeGroup.id)) {
        return {
          rawLine: line,
          homeRaw,
          awayRaw,
          homeGroup,
          awayGroup,
          isValid: false,
          error: `"${homeGroup.name}" is already scheduled in this batch`,
        };
      }

      if (seenGroupsInRound.has(awayGroup.id)) {
        return {
          rawLine: line,
          homeRaw,
          awayRaw,
          homeGroup,
          awayGroup,
          isValid: false,
          error: `"${awayGroup.name}" is already scheduled in this batch`,
        };
      }

      seenGroupsInRound.add(homeGroup.id);
      seenGroupsInRound.add(awayGroup.id);

      return {
        rawLine: line,
        homeRaw,
        awayRaw,
        homeGroup,
        awayGroup,
        isValid: true,
      };
    });
  }, [text, findBestMatch]);

  const validCount = parsedFixtures.filter((f) => f.isValid).length;
  const hasErrors = parsedFixtures.some((f) => !f.isValid);

  const handleCreate = async () => {
    if (validCount === 0 || hasErrors) return;

    setLoading(true);
    setServerError("");

    const pairings = parsedFixtures.map((f) => ({
      homeGroupId: f.homeGroup!.id,
      awayGroupId: f.awayGroup!.id,
    }));

    const result = await createBatchMatchesFromTextAction(roundId, tournamentId, pairings);
    if (result.success) {
      onSuccess(result.count || validCount);
      onClose();
      setText("");
    } else {
      setServerError(result.error || "Failed to create fixtures");
    }
    setLoading(false);
  };

  const handlePasteSample = () => {
    if (groups.length < 2) return;
    const lines: string[] = [];
    for (let i = 0; i < Math.min(6, groups.length - 1); i += 2) {
      lines.push(`${groups[i].name} vs ${groups[i + 1].name}`);
    }
    setText(lines.join("\n"));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl rounded-[16px] p-6 space-y-4">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-[#1F1F1F] flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#37003C]" />
            <span>Paste Fixtures — {roundName}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Paste plain text matches. Team names are automatically matched against tournament groups.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="paste-area" className="text-xs font-bold text-[#1F1F1F]">
              Matches (one per line):
            </Label>
            {groups.length >= 2 && (
              <button
                type="button"
                onClick={handlePasteSample}
                className="text-[11px] font-semibold text-[#37003C] hover:underline cursor-pointer"
              >
                Insert sample pairings
              </button>
            )}
          </div>

          <textarea
            id="paste-area"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Arsenal vs Chelsea\nLiverpool vs Man City\nAston Villa vs Spurs`}
            className="w-full rounded-[10px] border border-gray-300 p-3 text-xs font-mono focus:border-[#37003C] focus:ring-1 focus:ring-[#37003C] outline-none transition-colors"
          />

          {/* Real-time Match Validation Table */}
          {parsedFixtures.length > 0 && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto border border-gray-200 rounded-[10px] p-2.5 bg-gray-50/50">
              <div className="flex items-center justify-between pb-1 border-b border-gray-200 text-[10px] font-black uppercase text-gray-500">
                <span>Detected Matchup</span>
                <span>Status</span>
              </div>
              {parsedFixtures.map((fix, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-1.5 rounded text-xs ${
                    fix.isValid ? "bg-white border border-gray-200" : "bg-rose-50 border border-rose-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`font-bold truncate max-w-[140px] ${fix.homeGroup ? "text-[#1F1F1F]" : "text-rose-600 italic"}`}>
                      {fix.homeGroup?.name || fix.homeRaw || "?"}
                    </span>
                    <ArrowRight className="h-3 w-3 text-gray-400 shrink-0" />
                    <span className={`font-bold truncate max-w-[140px] ${fix.awayGroup ? "text-[#1F1F1F]" : "text-rose-600 italic"}`}>
                      {fix.awayGroup?.name || fix.awayRaw || "?"}
                    </span>
                  </div>

                  <div className="shrink-0 pl-2">
                    {fix.isValid ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" />
                        Matched
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-full border border-rose-200"
                        title={fix.error}
                      >
                        <AlertCircle className="h-3 w-3" />
                        {fix.error || "Error"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {serverError && (
            <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2.5 rounded border border-rose-200">
              {serverError}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9 px-4 text-xs font-semibold rounded-[8px]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={validCount === 0 || hasErrors || loading}
            className="h-9 px-4 text-xs font-bold bg-[#37003C] hover:bg-[#5A0A63] text-white rounded-[8px] gap-1.5 cursor-pointer shadow-xs"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00FF87]" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 text-[#00FF87]" />
            )}
            <span>
              {loading
                ? "Creating Fixtures..."
                : validCount > 0
                ? `Create ${validCount} ${validCount === 1 ? "Fixture" : "Fixtures"}`
                : "Enter Matches Above"}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
