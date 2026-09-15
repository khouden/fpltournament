"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, Zap, AlertTriangle, Loader2, ArrowRight, Shield } from "lucide-react";
import { generateKnockoutScheduleAction } from "@/lib/schedule-actions";

export interface GroupItem {
  id: string;
  name: string;
  logo?: string | null;
}

export interface KnockoutWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  groups: GroupItem[];
  existingRoundsCount: number;
  onSuccess: (message: string) => void;
}

export function KnockoutWizardModal({
  isOpen,
  onClose,
  tournamentId,
  groups,
  existingRoundsCount,
  onSuccess,
}: KnockoutWizardModalProps) {
  // Available bracket sizes based on groups count
  const maxPossible = groups.length >= 16 ? 16 : groups.length >= 8 ? 8 : 4;
  const [bracketSize, setBracketSize] = useState<4 | 8 | 16>(maxPossible);
  const [format, setFormat] = useState<"SINGLE_ELIMINATION" | "TWO_LEGGED">("SINGLE_ELIMINATION");
  const [seeding, setSeeding] = useState<"SEEDED" | "RANDOM">("SEEDED");
  const [startGW, setStartGW] = useState<number>(1);
  const [replaceExisting, setReplaceExisting] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Calculate stages and Gameweek progression
  const stageNames = useMemo(() => {
    if (bracketSize === 16) {
      return ["Round of 16", "Quarterfinals", "Semifinals", "Final"];
    } else if (bracketSize === 8) {
      return ["Quarterfinals", "Semifinals", "Final"];
    } else {
      return ["Semifinals", "Final"];
    }
  }, [bracketSize]);

  const totalGWs = useMemo(() => {
    if (format === "TWO_LEGGED") {
      return (stageNames.length - 1) * 2 + 1;
    }
    return stageNames.length;
  }, [format, stageNames]);

  const endGW = Math.min(38, startGW + totalGWs - 1);
  const exceedsMaxGW = startGW + totalGWs - 1 > 38;

  const handleGenerate = async () => {
    if (groups.length < 4 || exceedsMaxGW) return;

    setLoading(true);
    setError("");

    const result = await generateKnockoutScheduleAction(tournamentId, {
      startingGameweek: startGW,
      format,
      seeding,
      replaceExisting,
    });

    if (result.success) {
      onSuccess(result.message || "Knockout schedule generated successfully!");
      onClose();
    } else {
      setError(result.error || "Failed to generate knockout bracket");
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl rounded-[16px] p-6 space-y-5">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-[#1F1F1F] flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#37003C]/10 text-[#37003C] flex items-center justify-center">
              <Trophy className="h-4 w-4 text-[#37003C]" />
            </div>
            <span>Knockout &amp; Cup Bracket Generator</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Generate an official tournament bracket with automated winner progression references.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 1. Bracket Size Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-700">
              1. Bracket Size ({groups.length} groups available)
            </Label>
            <div className="grid grid-cols-3 gap-2.5">
              {([4, 8, 16] as const).map((size) => {
                const disabled = groups.length < size;
                const isSelected = bracketSize === size;

                return (
                  <button
                    key={size}
                    type="button"
                    disabled={disabled}
                    onClick={() => setBracketSize(size)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#37003C] bg-[#37003C]/5 text-[#37003C] ring-2 ring-[#37003C]/20 font-black"
                        : disabled
                        ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60"
                        : "border-gray-200 bg-white hover:border-gray-300 text-gray-700 font-semibold"
                    }`}
                  >
                    <span className="text-lg font-black">{size} Teams</span>
                    <span className="text-[10px] text-gray-500">
                      {size === 4
                        ? "SF ➔ Final"
                        : size === 8
                        ? "QF ➔ SF ➔ Final"
                        : "R16 ➔ QF ➔ SF ➔ Final"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Format & Seeding Options */}
          <div className="grid sm:grid-cols-2 gap-3">
            {/* Tie Format */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                2. Match Format
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat("SINGLE_ELIMINATION")}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                    format === "SINGLE_ELIMINATION"
                      ? "border-[#37003C] bg-[#37003C] text-white shadow-2xs"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Single Match
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("TWO_LEGGED")}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                    format === "TWO_LEGGED"
                      ? "border-[#37003C] bg-[#37003C] text-white shadow-2xs"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Two-Legged Tie
                </button>
              </div>
              <p className="text-[10px] text-gray-500">
                {format === "SINGLE_ELIMINATION"
                  ? "1 Gameweek per stage (Winner advances)"
                  : "Home & Away legs before Final"}
              </p>
            </div>

            {/* Seeding */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                3. Draw / Seeding
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSeeding("SEEDED")}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                    seeding === "SEEDED"
                      ? "border-[#37003C] bg-[#37003C] text-white shadow-2xs"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Seeded Draw
                </button>
                <button
                  type="button"
                  onClick={() => setSeeding("RANDOM")}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                    seeding === "RANDOM"
                      ? "border-[#37003C] bg-[#37003C] text-white shadow-2xs"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Random Draw
                </button>
              </div>
              <p className="text-[10px] text-gray-500">
                {seeding === "SEEDED"
                  ? "Top seeds kept on opposite bracket halves"
                  : "Unseeded randomized draw"}
              </p>
            </div>
          </div>

          {/* 3. Starting Gameweek & Duration */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                <Label htmlFor="knockout-gw" className="text-xs font-bold text-[#1F1F1F]">
                  Start Gameweek (GW):
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="knockout-gw"
                    type="number"
                    min={1}
                    max={38}
                    value={startGW}
                    onChange={(e) =>
                      setStartGW(Math.max(1, Math.min(38, parseInt(e.target.value) || 1)))
                    }
                    className="w-24 bg-white font-black text-center h-9"
                  />
                  <span className="text-xs font-bold text-[#37003C]">
                    ➔ GW {endGW} ({totalGWs} {totalGWs === 1 ? "Gameweek" : "Gameweeks"})
                  </span>
                </div>
              </div>

              {/* Bracket Summary Badge */}
              <div className="shrink-0 flex items-center gap-1.5 text-xs font-bold bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-2xs">
                <Shield className="h-4 w-4 text-[#37003C]" />
                <span>
                  {bracketSize} Teams · {totalGWs} Rounds ·{" "}
                  {bracketSize === 4 ? 3 : bracketSize === 8 ? 7 : 15} Total Ties
                </span>
              </div>
            </div>

            {exceedsMaxGW && (
              <p className="text-xs text-rose-600 font-bold flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Exceeds Gameweek 38. Please lower starting Gameweek.</span>
              </p>
            )}
          </div>

          {existingRoundsCount > 0 && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900">
              <input
                type="checkbox"
                id="replace-existing"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#37003C] focus:ring-[#37003C] cursor-pointer"
              />
              <Label htmlFor="replace-existing" className="text-xs font-semibold text-amber-950 cursor-pointer">
                Replace existing schedule ({existingRoundsCount} rounds)? Uncheck to append as cup stage.
              </Label>
            </div>
          )}

          {/* 4. Bracket Stages Preview */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Bracket Progression Preview:
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {stageNames.map((stage, idx) => (
                <div key={stage} className="flex items-center gap-2">
                  <span className="font-bold px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-[#37003C] shadow-2xs">
                    {stage} {format === "TWO_LEGGED" && idx < stageNames.length - 1 ? "(2 Legs)" : ""}
                  </span>
                  {idx < stageNames.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-gray-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Existing rounds replacement warning */}
          {existingRoundsCount > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-3 flex items-start gap-2.5 text-amber-900 text-xs">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Existing schedule will be replaced</p>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  Your tournament currently has {existingRoundsCount} rounds. Generating this knockout bracket will clear existing fixtures.
                </p>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded border border-rose-200">
              {error}
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
            onClick={handleGenerate}
            disabled={loading || exceedsMaxGW || groups.length < 4}
            className="h-9 px-5 text-xs font-bold bg-[#37003C] hover:bg-[#5A0A63] text-white rounded-[8px] gap-2 shadow-xs cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#00FF87]" />
            ) : (
              <Zap className="h-4 w-4 text-[#00FF87] fill-[#00FF87]" />
            )}
            <span>{loading ? "Generating Bracket..." : "Generate Knockout Bracket"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
