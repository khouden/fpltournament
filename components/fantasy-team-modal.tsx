"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  ExternalLink,
  Crown,
  Zap,
  Loader2,
  AlertCircle,
  LayoutGrid,
  List,
  Shield,
  RefreshCw,
} from "lucide-react";
import type { FantasyTeamSquadView, FantasyPlayerPick } from "@/lib/fpl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export interface FantasyTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  fplId: number;
  managerName?: string;
  fplTeamName?: string | null;
  tournamentTeamName?: string;
  tournamentTeamLogo?: string | null;
  gameweek: number;
  allowBenchBoost?: boolean;
  allowTripleCaptain?: boolean;
}

export function FantasyTeamModal({
  isOpen,
  onClose,
  fplId,
  managerName,
  fplTeamName,
  tournamentTeamName,
  tournamentTeamLogo,
  gameweek,
  allowBenchBoost = true,
  allowTripleCaptain = true,
}: FantasyTeamModalProps) {
  const [squad, setSquad] = useState<FantasyTeamSquadView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pitch" | "list">("pitch");
  const [logoFailed, setLogoFailed] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Sync state when modal closes without setting state in effect
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setSquad(null);
      setError(null);
      setLogoFailed(false);
      setLoading(false);
    }
  }

  const handleRetry = useCallback(() => {
    setRetryTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!isOpen || !fplId) return;

    let isMounted = true;
    const controller = new AbortController();

    // Avoid synchronous setState in effect body by running inside microtask
    queueMicrotask(async () => {
      if (!isMounted) return;
      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams({
          gameweek: String(gameweek),
          allowBenchBoost: String(allowBenchBoost),
          allowTripleCaptain: String(allowTripleCaptain),
        });
        const res = await fetch(
          `/api/fpl/manager/${fplId}/picks?${queryParams.toString()}`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP error ${res.status}`);
        }
        const data = await res.json();
        if (isMounted) {
          setSquad(data.squad || null);
        }
      } catch (err) {
        if (isMounted && !(err instanceof DOMException && err.name === "AbortError")) {
          setError(
            err instanceof Error ? err.message : "Failed to retrieve fantasy squad"
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [isOpen, fplId, gameweek, allowBenchBoost, allowTripleCaptain, retryTrigger]);

  const displayManager =
    squad?.managerName || managerName || `Manager #${fplId}`;
  const displayTeamName = squad?.teamName || fplTeamName || "Fantasy Team";
  const fplProfileUrl = `https://fantasy.premierleague.com/entry/${
    squad?.managerId || fplId
  }/event/${gameweek}`;

  // Group starters by tactical position
  const gkps = squad?.starters.filter((p) => p.positionType === "GKP") || [];
  const defs = squad?.starters.filter((p) => p.positionType === "DEF") || [];
  const mids = squad?.starters.filter((p) => p.positionType === "MID") || [];
  const fwds = squad?.starters.filter((p) => p.positionType === "FWD") || [];

  const benchTotal =
    squad?.bench.reduce((sum, p) => sum + p.points, 0) ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-4xl lg:max-w-5xl max-h-[94vh] p-0 overflow-hidden flex flex-col bg-white border border-[#E5E5E5] text-[#1F1F1F] shadow-2xl rounded-2xl"
        aria-describedby="fantasy-team-modal-description"
      >
        {/* Screen-reader accessible dialog header */}
        <DialogHeader className="sr-only">
          <DialogTitle>
            {displayTeamName} - {displayManager} (Gameweek {gameweek})
          </DialogTitle>
          <DialogDescription id="fantasy-team-modal-description">
            Fantasy Premier League squad lineup and tactical performance for{" "}
            {displayTeamName} managed by {displayManager} in Gameweek {gameweek}.
          </DialogDescription>
        </DialogHeader>

        {/* Visible Header: Light FPL Brand Style */}
        <div className="border-b border-[#E5E5E5] bg-white px-4 sm:px-6 pt-4 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            {/* Team Crest & Manager Meta */}
            <div className="flex items-center gap-3 min-w-0">
              {tournamentTeamLogo && !logoFailed ? (
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-1 border border-[#E5E5E5] shadow-xs">
                  <Image
                    src={tournamentTeamLogo}
                    alt={tournamentTeamName || "Team Crest"}
                    width={36}
                    height={36}
                    className="h-8 w-8 object-contain"
                    onError={() => setLogoFailed(true)}
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#37003C] text-white shadow-xs">
                  <Shield className="h-5 w-5 text-[#00FF87]" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black tracking-tight text-[#37003C] truncate">
                    {displayTeamName}
                  </h2>
                  <a
                    href={fplProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#555555] hover:text-[#37003C] transition-colors shrink-0 bg-[#F7F7F7] hover:bg-[#EEEEEE] px-2 py-0.5 rounded-full border border-[#E5E5E5]"
                    title="Open on official Fantasy Premier League website"
                  >
                    <span>View on FPL</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="text-xs text-[#666666] flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 font-medium">
                  <span className="font-bold text-[#1F1F1F] truncate">
                    {displayManager}
                  </span>
                  <span className="text-[#CCCCCC]">•</span>
                  <span className="text-[#555555] font-semibold">
                    Gameweek {gameweek}
                  </span>
                  {tournamentTeamName && (
                    <>
                      <span className="text-[#CCCCCC]">•</span>
                      <span className="text-[#37003C] font-extrabold truncate">
                        {tournamentTeamName}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Score Callout & Chip Indicator */}
            {squad && (
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#EEEEEE]">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-[#37003C] tracking-tight leading-none">
                    {squad.adjustedPoints}
                  </span>
                  <span className="text-xs font-black uppercase text-[#008744] bg-[#00FF87]/20 border border-[#00FF87]/40 px-1.5 py-0.5 rounded-[4px]">
                    PTS
                  </span>
                </div>

                {/* Active Chip Badge with scoring rule explanation */}
                <div className="mt-1">
                  {squad.activeChip ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-[#E7FF00]/30 border border-[#E7FF00] px-2.5 py-0.5 text-[10px] font-black text-[#37003C] shadow-2xs"
                      title={
                        squad.activeChip === "3xc"
                          ? allowTripleCaptain
                            ? "Triple Captain: 3× captain points applied"
                            : "Triple Captain: Limited to 2× per tournament rules"
                          : squad.activeChip === "bboost"
                          ? allowBenchBoost
                            ? "Bench Boost: Bench points included"
                            : "Bench Boost: Excluded by tournament rules"
                          : `${squad.activeChip} Active`
                      }
                    >
                      <Zap className="h-3 w-3 text-[#37003C]" />
                      <span>
                        {squad.activeChip === "3xc"
                          ? allowTripleCaptain
                            ? "Triple Captain (3x)"
                            : "Triple Captain (2x limited)"
                          : squad.activeChip === "bboost"
                          ? allowBenchBoost
                            ? "Bench Boost (+pts)"
                            : "Bench Boost (excluded)"
                          : squad.activeChip === "freehit"
                          ? "Free Hit"
                          : squad.activeChip === "wildcard"
                          ? "Wildcard"
                          : squad.activeChip}
                      </span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#888888] font-medium">
                      No chip played
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Subheader Toolbar: Formation & View Switcher */}
          <div className="mt-3 pt-2.5 border-t border-[#EEEEEE] flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#777777] font-semibold">Formation:</span>
              <span className="font-extrabold text-[#37003C] bg-[#37003C]/5 px-2 py-0.5 rounded-[6px] border border-[#37003C]/10">
                {squad?.formation || "—"}
              </span>

              {squad?.activeChip === "bboost" && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-[6px] ${
                    allowBenchBoost
                      ? "bg-[#00FF87]/20 text-[#008744] border border-[#00FF87]/40"
                      : "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
                  }`}
                >
                  {allowBenchBoost
                    ? "Bench Boost Counted (+pts)"
                    : "Bench Boost Excluded by Rules"}
                </span>
              )}

              {squad?.activeChip === "3xc" && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-[6px] ${
                    allowTripleCaptain
                      ? "bg-[#00FF87]/20 text-[#008744] border border-[#00FF87]/40"
                      : "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
                  }`}
                >
                  {allowTripleCaptain
                    ? "3x Captain Multiplier Applied"
                    : "Captain Limited to 2x (Tournament Rule)"}
                </span>
              )}

              {squad && squad.transfersCost > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-[6px] bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]">
                  -{squad.transfersCost} Transfer Cost
                </span>
              )}
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "pitch" | "list")}
            >
              <TabsList className="bg-[#F5F5F5] border border-[#E5E5E5] p-0.5 rounded-[8px] h-8">
                <TabsTrigger
                  value="pitch"
                  className="gap-1 text-xs font-bold px-3 py-1 data-[state=active]:bg-[#37003C] data-[state=active]:text-white rounded-[6px] transition-all"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Pitch View</span>
                </TabsTrigger>
                <TabsTrigger
                  value="list"
                  className="gap-1 text-xs font-bold px-3 py-1 data-[state=active]:bg-[#37003C] data-[state=active]:text-white rounded-[6px] transition-all"
                >
                  <List className="h-3.5 w-3.5" />
                  <span>List View</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-[#F7F7F7]">
          {/* Loading Skeleton */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-[#777777]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#37003C]/5 text-[#37003C] mb-3">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <p className="text-sm font-bold text-[#1F1F1F]">
                Fetching squad line-up from FPL...
              </p>
              <p className="text-xs text-[#777777] mt-1">
                Loading official Gameweek picks and points
              </p>
            </div>
          )}

          {/* Error State with Retry */}
          {error && !loading && (
            <div className="my-6 max-w-md mx-auto">
              <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="font-bold">Unable to Load Squad</AlertTitle>
                <AlertDescription className="text-xs mt-1 text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
              <div className="mt-3 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="gap-1.5 font-bold border-[#E5E5E5] text-[#37003C] hover:bg-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Try Again</span>
                </Button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && !squad && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-[#777777]">
              <Shield className="h-10 w-10 text-[#CCCCCC] mb-2" />
              <p className="text-sm font-bold text-[#1F1F1F]">Squad Unavailable</p>
              <p className="text-xs text-[#777777] mt-1">
                No player data was returned for this Gameweek.
              </p>
            </div>
          )}

          {/* Squad Content */}
          {!loading && !error && squad && (
            <>
              {activeTab === "pitch" ? (
                /* -------------------------------------------------------------
                 * Pitch View
                 * ------------------------------------------------------------- */
                <div className="space-y-4">
                  {/* Clean Football Pitch */}
                  <div className="relative rounded-2xl border border-[#0d4f26] bg-gradient-to-b from-[#095228] via-[#0b5c2d] to-[#073d1b] p-3 sm:p-5 shadow-md select-none">
                    {/* Pitch line markings - clipped to rounded corners */}
                    <div className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden opacity-25">
                      {/* Outer boundary */}
                      <div className="absolute inset-2 sm:inset-4 rounded-xl border-2 border-white" />
                      {/* Halfway line */}
                      <div className="absolute top-1/2 left-2 sm:left-4 right-2 sm:right-4 h-0.5 bg-white -translate-y-1/2" />
                      {/* Center circle */}
                      <div className="absolute top-1/2 left-1/2 h-24 w-24 sm:h-32 sm:w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" />
                      {/* Center spot */}
                      <div className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
                      {/* Top penalty box */}
                      <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 w-44 sm:w-56 h-14 sm:h-20 border-2 border-t-0 border-white rounded-b-lg" />
                      {/* Top goal area (6-yard) */}
                      <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 w-20 sm:w-28 h-6 sm:h-9 border-2 border-t-0 border-white rounded-b-md" />
                      {/* Top penalty spot */}
                      <div className="absolute top-12 sm:top-16 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-white" />
                      {/* Bottom penalty box */}
                      <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 w-44 sm:w-56 h-14 sm:h-20 border-2 border-b-0 border-white rounded-t-lg" />
                      {/* Bottom goal area (6-yard) */}
                      <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 w-20 sm:w-28 h-6 sm:h-9 border-2 border-b-0 border-white rounded-t-md" />
                      {/* Bottom penalty spot */}
                      <div className="absolute bottom-12 sm:bottom-16 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-white" />
                    </div>

                    {/* Tactical Formation Rows: GKP -> DEF -> MID -> FWD */}
                    <div className="relative z-10 flex flex-col justify-between gap-2 sm:gap-3.5 py-1.5 min-h-[340px] sm:min-h-[390px]">
                      {/* Row 1: Goalkeeper (tooltip renders downward) */}
                      <div className="flex justify-around items-center pt-1">
                        {gkps.map((p) => (
                          <PitchPlayerCard
                            key={p.elementId}
                            player={p}
                            isTopRow={true}
                            align="center"
                          />
                        ))}
                      </div>

                      {/* Row 2: Defenders */}
                      <div className="flex justify-around items-center gap-1 sm:gap-2">
                        {defs.map((p, idx) => (
                          <PitchPlayerCard
                            key={p.elementId}
                            player={p}
                            align={
                              idx === 0
                                ? "left"
                                : idx === defs.length - 1
                                ? "right"
                                : "center"
                            }
                          />
                        ))}
                      </div>

                      {/* Row 3: Midfielders */}
                      <div className="flex justify-around items-center gap-1 sm:gap-2">
                        {mids.map((p, idx) => (
                          <PitchPlayerCard
                            key={p.elementId}
                            player={p}
                            align={
                              idx === 0
                                ? "left"
                                : idx === mids.length - 1
                                ? "right"
                                : "center"
                            }
                          />
                        ))}
                      </div>

                      {/* Row 4: Forwards */}
                      <div className="flex justify-around items-center gap-1 sm:gap-2">
                        {fwds.map((p, idx) => (
                          <PitchPlayerCard
                            key={p.elementId}
                            player={p}
                            align={
                              fwds.length > 1
                                ? idx === 0
                                  ? "left"
                                  : idx === fwds.length - 1
                                  ? "right"
                                  : "center"
                                : "center"
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bench / Reserves Container */}
                  <div className="rounded-2xl border border-[#E5E5E5] bg-white p-3.5 sm:p-4 shadow-fpl-sm">
                    <div className="flex items-center justify-between text-xs pb-2 mb-3 border-b border-[#EEEEEE]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black uppercase tracking-wider text-[#37003C]">
                          Bench / Reserves
                        </span>
                        {squad.activeChip === "bboost" ? (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-[6px] ${
                              allowBenchBoost
                                ? "bg-[#00FF87]/20 text-[#008744] border border-[#00FF87]/40"
                                : "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
                            }`}
                          >
                            {allowBenchBoost
                              ? "Bench Boost Active · Counted in Score"
                              : "Bench Boost Excluded by Rules"}
                          </span>
                        ) : (
                          <span className="text-[#888888] text-[11px] font-medium">
                            (Excluded from match total per rules)
                          </span>
                        )}
                      </div>

                      <span className="font-bold text-[#37003C] text-xs">
                        Bench:{" "}
                        <span className="font-black text-sm text-[#1F1F1F]">
                          {benchTotal} pts
                        </span>
                      </span>
                    </div>

                    {/* 4 Bench Players */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {squad.bench.map((p, idx) => (
                        <div
                          key={p.elementId}
                          className="flex items-center justify-between rounded-xl bg-[#F9F9F9] p-2 sm:p-2.5 border border-[#EAEAEA] hover:border-[#37003C]/30 transition-colors shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-1">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EEEEEE] text-[10px] font-black text-[#555555]">
                              {idx === 0 ? "GK" : idx}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-[#1F1F1F] text-xs truncate">
                                {p.webName}
                              </p>
                              <p className="text-[10px] text-[#777777] truncate">
                                {p.teamShortName} · {p.positionType}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <span
                              className={`font-black text-xs px-2 py-0.5 rounded-[6px] ${
                                squad.activeChip === "bboost" && allowBenchBoost
                                  ? "bg-[#00FF87]/20 text-[#008744] border border-[#00FF87]/40"
                                  : "bg-[#EEEEEE] text-[#555555]"
                              }`}
                            >
                              {p.points} <span className="text-[9px] font-normal">pts</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* -------------------------------------------------------------
                 * List View (Detailed Statistical Table)
                 * ------------------------------------------------------------- */
                <div className="space-y-4">
                  {/* Starters Table */}
                  <div className="rounded-2xl border border-[#E5E5E5] bg-white overflow-hidden shadow-fpl-sm">
                    <div className="bg-[#FAFAFA] px-4 py-2.5 border-b border-[#E5E5E5] flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-[#37003C]">
                        Starting XI ({squad.formation})
                      </span>
                      <span className="text-xs text-[#37003C] font-black">
                        {squad.starters.reduce((acc, p) => acc + p.totalPoints, 0)} PTS
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
                          <TableRow className="border-[#E5E5E5] hover:bg-transparent">
                            <TableHead className="py-2.5 px-3 text-[#777777] font-bold text-xs whitespace-nowrap">
                              Player
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-[#777777] font-bold text-xs">
                              Club
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-[#777777] font-bold text-xs">
                              Pos
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-[#777777] font-bold text-xs">
                              Role
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-center text-[#777777] font-bold text-xs">
                              Mins
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-center text-[#777777] font-bold text-xs">
                              G / A
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-center text-[#777777] font-bold text-xs">
                              CS
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-center text-[#777777] font-bold text-xs">
                              Bonus
                            </TableHead>
                            <TableHead className="py-2.5 px-3 text-right text-[#777777] font-bold text-xs">
                              GW Pts
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-[#E5E5E5]/70 text-[#1F1F1F]">
                          {squad.starters.map((p) => (
                            <TableRow
                              key={p.elementId}
                              className="border-[#E5E5E5]/70 hover:bg-[#F9F9F9] transition-colors"
                            >
                              <TableCell className="py-2.5 px-3 whitespace-nowrap">
                                <div className="font-bold text-[#37003C] text-sm">
                                  {p.webName}
                                </div>
                                <div className="text-[10px] text-[#777777]">
                                  {p.fullName}
                                </div>
                              </TableCell>
                              <TableCell className="py-2.5 px-2 font-bold text-xs text-[#555555]">
                                {p.teamShortName}
                              </TableCell>
                              <TableCell className="py-2.5 px-2">
                                <span className="text-[10px] font-bold text-[#37003C] bg-[#37003C]/5 px-1.5 py-0.5 rounded">
                                  {p.positionType}
                                </span>
                              </TableCell>
                              <TableCell className="py-2.5 px-2">
                                {p.isCaptain ? (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-[#FFD700] text-[#37003C] px-1.5 py-0.5 text-[10px] font-black shadow-2xs">
                                    {p.multiplier === 3 ? (
                                      <>
                                        <Crown className="h-3 w-3" />
                                        <span>TC (3x)</span>
                                      </>
                                    ) : (
                                      <span>C ({p.multiplier}x)</span>
                                    )}
                                  </span>
                                ) : p.isViceCaptain ? (
                                  <span className="rounded bg-[#E2E8F0] text-[#37003C] px-1.5 py-0.5 text-[10px] font-black">
                                    V
                                  </span>
                                ) : (
                                  <span className="text-[#888888] text-[10px] font-medium">
                                    Starter
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="py-2.5 px-2 text-center text-xs font-semibold text-[#555555]">
                                {p.stats?.minutes ?? "—"}&apos;
                              </TableCell>
                              <TableCell className="py-2.5 px-2 text-center text-xs font-semibold text-[#37003C]">
                                {(p.stats?.goals || 0) > 0 || (p.stats?.assists || 0) > 0
                                  ? `${p.stats?.goals || 0} / ${p.stats?.assists || 0}`
                                  : "—"}
                              </TableCell>
                              <TableCell className="py-2.5 px-2 text-center text-xs font-semibold text-[#555555]">
                                {p.stats?.cleanSheets ? "Yes" : "—"}
                              </TableCell>
                              <TableCell className="py-2.5 px-2 text-center text-xs font-semibold text-[#666666]">
                                {p.stats?.bonus ? `+${p.stats.bonus}` : "—"}
                              </TableCell>
                              <TableCell className="py-2.5 px-3 text-right whitespace-nowrap">
                                <span className="font-black text-sm text-[#37003C]">
                                  {p.totalPoints}
                                </span>
                                {p.multiplier > 1 && (
                                  <span className="text-[10px] text-[#777777] ml-1">
                                    ({p.points}×{p.multiplier})
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Bench Table */}
                  <div className="rounded-2xl border border-[#E5E5E5] bg-white overflow-hidden shadow-fpl-sm">
                    <div className="bg-[#FAFAFA] px-4 py-2.5 border-b border-[#E5E5E5] flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#777777]">
                        Substitutes / Bench
                      </span>
                      <span className="text-xs text-[#777777] font-bold">
                        {benchTotal} PTS
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
                          <TableRow className="border-[#E5E5E5] hover:bg-transparent">
                            <TableHead className="py-2.5 px-3 text-[#777777] font-bold text-xs whitespace-nowrap">
                              Player
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-[#777777] font-bold text-xs">
                              Club
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-[#777777] font-bold text-xs">
                              Pos
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-[#777777] font-bold text-xs">
                              Sub Order
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-center text-[#777777] font-bold text-xs">
                              Mins
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-center text-[#777777] font-bold text-xs">
                              G / A
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-center text-[#777777] font-bold text-xs">
                              CS
                            </TableHead>
                            <TableHead className="py-2.5 px-3 text-right text-[#777777] font-bold text-xs">
                              Pts
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-[#E5E5E5]/70 text-[#1F1F1F]">
                          {squad.bench.map((p, idx) => (
                            <TableRow
                              key={p.elementId}
                              className="border-[#E5E5E5]/70 hover:bg-[#F9F9F9] transition-colors"
                            >
                              <TableCell className="py-2.5 px-3 whitespace-nowrap">
                                <div className="font-bold text-[#1F1F1F] text-sm">
                                  {p.webName}
                                </div>
                                <div className="text-[10px] text-[#777777]">
                                  {p.fullName}
                                </div>
                              </TableCell>
                              <TableCell className="py-2.5 px-2 font-bold text-xs text-[#555555]">
                                {p.teamShortName}
                              </TableCell>
                              <TableCell className="py-2.5 px-2">
                                <span className="text-[10px] font-bold text-[#777777] bg-[#F5F5F5] px-1.5 py-0.5 rounded">
                                  {p.positionType}
                                </span>
                              </TableCell>
                              <TableCell className="py-2.5 px-2 text-[#666666] font-semibold text-xs">
                                {idx === 0 ? "Sub GK" : `Sub ${idx}`}
                              </TableCell>
                              <TableCell className="py-2.5 px-2 text-center text-xs font-semibold text-[#555555]">
                                {p.stats?.minutes ?? "—"}&apos;
                              </TableCell>
                              <TableCell className="py-2.5 px-2 text-center text-xs font-semibold text-[#37003C]">
                                {(p.stats?.goals || 0) > 0 || (p.stats?.assists || 0) > 0
                                  ? `${p.stats?.goals || 0} / ${p.stats?.assists || 0}`
                                  : "—"}
                              </TableCell>
                              <TableCell className="py-2.5 px-2 text-center text-xs font-semibold text-[#555555]">
                                {p.stats?.cleanSheets ? "Yes" : "—"}
                              </TableCell>
                              <TableCell className="py-2.5 px-3 text-right whitespace-nowrap">
                                <span className="font-black text-sm text-[#555555]">
                                  {p.points}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-[#E5E5E5] bg-white px-4 sm:px-6 py-3 flex items-center justify-between text-xs text-[#777777]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#37003C]">FPL Sync</span>
            <span className="text-[#CCCCCC]">•</span>
            <span>Official Premier League Data</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="font-bold border-[#E5E5E5] hover:bg-[#F7F7F7] text-[#37003C] rounded-lg px-4"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Individual Player Pitch Card:
 * Responsive, solid card with strong contrast on emerald pitch,
 * dynamic captain/vice-captain/multiplier badges, and performance tooltip.
 */
function PitchPlayerCard({
  player,
  align = "center",
  isTopRow = false,
}: {
  player: FantasyPlayerPick;
  align?: "left" | "center" | "right";
  isTopRow?: boolean;
}) {
  const isGkp = isTopRow || player.positionType === "GKP";

  const roleLabel = player.isCaptain
    ? player.multiplier === 3
      ? "Triple Captain"
      : "Captain"
    : player.isViceCaptain
    ? "Vice-Captain"
    : "Starter";

  const accessibleLabel = `${player.webName}, ${player.positionType}, ${roleLabel}, ${player.totalPoints} Gameweek points.`;

  const horizontalAlignClass =
    align === "left"
      ? "left-0 sm:left-1/2 sm:-translate-x-1/2"
      : align === "right"
      ? "right-0 sm:left-1/2 sm:-translate-x-1/2"
      : "left-1/2 -translate-x-1/2";

  return (
    <div
      className="group relative flex flex-col items-center select-none cursor-pointer focus:outline-none"
      tabIndex={0}
      role="button"
      aria-label={accessibleLabel}
    >
      {/* Kit / Club Badge Avatar Container */}
      <div className="relative">
        <div className="relative flex h-8 w-8 xs:h-9 xs:w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-white shadow-md border border-white/80 text-[#37003C] font-black text-xs transition-transform duration-150 group-hover:scale-110 group-focus-visible:ring-2 group-focus-visible:ring-white">
          <span className="text-[9px] xs:text-[10px] sm:text-xs font-black tracking-tight">
            {player.teamShortName}
          </span>

          {/* Captaincy Badge */}
          {player.isCaptain && (
            <span
              className="absolute -top-1.5 -right-1.5 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-[#FFD700] font-black text-[#37003C] text-[9px] sm:text-[10px] shadow-xs border border-[#FFE033]"
              title={`Captain (${player.multiplier}x points)`}
            >
              {player.multiplier === 3 ? (
                <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#37003C]" />
              ) : (
                "C"
              )}
            </span>
          )}
          {!player.isCaptain && player.isViceCaptain && (
            <span
              className="absolute -top-1.5 -right-1.5 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-[#E2E8F0] font-black text-[#37003C] text-[9px] sm:text-[10px] shadow-xs border border-white"
              title="Vice-Captain"
            >
              V
            </span>
          )}

          {/* Multiplier Tag if > 1 */}
          {player.multiplier > 1 && (
            <span className="absolute -bottom-1 -left-1 rounded bg-[#37003C] px-1 py-0.2 text-[8px] font-black text-[#00FF87] shadow-xs">
              {player.multiplier}x
            </span>
          )}
        </div>
      </div>

      {/* Name and Points Plate */}
      <div className="mt-1 flex flex-col items-center w-full">
        {/* Name Plate */}
        <div className="max-w-[56px] xs:max-w-[68px] sm:max-w-[88px] truncate rounded bg-white/95 px-1 py-0.5 text-center text-[9px] xs:text-[10px] sm:text-[11px] font-bold text-[#1F1F1F] shadow-xs border border-white/70">
          {player.webName}
        </div>

        {/* Gameweek Points Pill */}
        <div
          className={`mt-0.5 rounded-full px-1.5 sm:px-2 py-0.2 text-[8px] xs:text-[9px] sm:text-[10px] font-black shadow-xs ${
            player.totalPoints >= 10
              ? "bg-[#00FF87] text-[#37003C] ring-1 ring-white/60"
              : "bg-[#00FF87] text-[#37003C]"
          }`}
        >
          {player.totalPoints} pts
        </div>
      </div>

      {/* Hover & Focus Stat Tooltip (smart direction: top-full for goalkeeper, bottom-full for outfield) */}
      <div
        className={`pointer-events-none absolute hidden group-hover:flex group-focus-visible:flex flex-col items-center z-40 animate-fpl-fade-in ${horizontalAlignClass} ${
          isGkp ? "top-full mt-2" : "bottom-full mb-2"
        }`}
      >
        {/* If GKP: Arrow on top pointing up */}
        {isGkp && (
          <div className="h-2 w-2 translate-y-1 rotate-45 bg-[#37003C] border-l border-t border-[#5A0A63] z-10 shrink-0" />
        )}

        <div className="rounded-xl bg-[#37003C] border border-[#5A0A63] p-2.5 text-center text-[11px] text-white shadow-2xl whitespace-nowrap">
          <p className="font-bold text-xs text-[#00FF87]">{player.fullName}</p>
          <p className="text-gray-300 text-[10px] font-medium">
            {player.teamShortName} · {player.positionType}
            {player.isCaptain && ` · Captain (${player.multiplier}x)`}
            {player.isViceCaptain && " · Vice-Captain"}
          </p>
          <div className="mt-1.5 pt-1.5 border-t border-white/10 flex items-center justify-center gap-2.5 text-[10px]">
            {player.stats?.minutes !== undefined && (
              <span>⏱️ {player.stats.minutes}&apos;</span>
            )}
            {(player.stats?.goals || 0) > 0 && (
              <span className="font-bold text-[#E7FF00]">
                ⚽ {player.stats?.goals}
              </span>
            )}
            {(player.stats?.assists || 0) > 0 && (
              <span className="font-bold text-[#00D9FF]">
                👟 {player.stats?.assists}
              </span>
            )}
            {player.stats?.cleanSheets ? <span>🧤 CS</span> : null}
            {player.stats?.bonus ? (
              <span className="text-[#00FF87]">+{player.stats.bonus} bonus</span>
            ) : null}
          </div>
        </div>

        {/* If not GKP: Arrow on bottom pointing down */}
        {!isGkp && (
          <div className="h-2 w-2 -translate-y-1 rotate-45 bg-[#37003C] border-r border-b border-[#5A0A63] z-10 shrink-0" />
        )}
      </div>
    </div>
  );
}
