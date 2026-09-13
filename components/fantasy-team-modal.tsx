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
  Clock,
  Award,
  CheckCircle2,
  Sparkles,
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
  const [isDeadline, setIsDeadline] = useState(false);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setSquad(null);
      setError(null);
      setLogoFailed(false);
      setLoading(false);
      setIsDeadline(false);
    }
  }

  const handleRetry = useCallback(() => {
    setRetryTrigger((prev) => prev + 1);
  }, []);

  const isManualPlayer = !fplId || fplId <= 0;

  useEffect(() => {
    if (!isOpen || !fplId) return;

    if (fplId <= 0) {
      setSquad(null);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

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
          const errorObj = new Error(errData.error || `HTTP error ${res.status}`);
          if (errData.isDeadline || res.status === 503) {
            (errorObj as { isDeadline?: boolean }).isDeadline = true;
          }
          throw errorObj;
        }
        const data = await res.json();
        if (isMounted) {
          setSquad(data.squad || null);
          setIsDeadline(false);
        }
      } catch (err) {
        if (isMounted && !(err instanceof DOMException && err.name === "AbortError")) {
          setIsDeadline(Boolean((err as { isDeadline?: boolean })?.isDeadline));
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
        className="max-w-4xl lg:max-w-5xl max-h-[94vh] p-0 overflow-hidden flex flex-col bg-[#F8F9FA] border border-gray-200 text-[#1F1F1F] shadow-2xl rounded-3xl"
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

        {/* ===================================================================== */}
        {/* PREMIUM MODAL HEADER (Dark Stadium Aesthetics)                        */}
        {/* ===================================================================== */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#170020] via-[#240030] to-[#0F0015] text-white px-5 sm:px-7 pt-5 pb-4 border-b border-white/10 shadow-md">
          {/* Subtle neon stadium glow accents */}
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#00FF87]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-56 h-56 bg-[#A855F7]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Team Crest & Manager Meta */}
            <div className="flex items-center gap-3.5 min-w-0">
              {tournamentTeamLogo && !logoFailed ? (
                <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md p-2 border border-white/20 shadow-sm">
                  <Image
                    src={tournamentTeamLogo}
                    alt={tournamentTeamName || "Team Crest"}
                    width={44}
                    height={44}
                    className="h-full w-full object-contain"
                    onError={() => setLogoFailed(true)}
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-[#37003C] border border-[#00FF87]/40 text-white shadow-sm">
                  <Shield className="h-6 w-6 text-[#00FF87]" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-sm truncate">
                    {displayTeamName}
                  </h2>
                  {isManualPlayer ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white/80 bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/15">
                      Manual Player
                    </span>
                  ) : (
                    <a
                      href={fplProfileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/15 transition-colors"
                      title="Open on official Fantasy Premier League website"
                    >
                      <span>FPL Profile</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <div className="text-xs text-white/80 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 font-medium">
                  <span className="font-bold text-white truncate">
                    {displayManager}
                  </span>
                  <span className="text-white/40">•</span>
                  <span className="text-white/90 font-semibold">
                    Gameweek {gameweek}
                  </span>
                  {tournamentTeamName && (
                    <>
                      <span className="text-white/40">•</span>
                      <span className="text-[#00FF87] font-black truncate">
                        {tournamentTeamName}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Total Points & Chip Status */}
            {squad && (
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10">
                <div className="flex items-baseline gap-2 bg-black/40 border border-white/15 rounded-2xl px-4 py-2 shadow-inner">
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                    {squad.adjustedPoints}
                  </span>
                  <span className="text-xs font-black uppercase text-[#063319] bg-[#00FF87] px-2 py-0.5 rounded-md shadow-xs">
                    PTS
                  </span>
                </div>

                {/* Active Chip Badge */}
                <div className="mt-1.5">
                  {squad.activeChip ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-400/40 px-3 py-0.5 text-[11px] font-black text-amber-300 shadow-xs">
                      <Zap className="h-3 w-3 text-amber-400" />
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
                          : squad.activeChip.toUpperCase()}
                      </span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-white/60 font-medium">
                      Standard Squad
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Subheader Toolbar: Formation & View Toggle */}
          <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-white/70 font-semibold">Formation:</span>
              <span className="font-black text-[#00FF87] bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-lg border border-white/15">
                {squad?.formation || "—"}
              </span>

              {squad?.activeChip === "bboost" && (
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                    allowBenchBoost
                      ? "bg-[#00FF87]/20 text-[#00FF87] border-[#00FF87]/40"
                      : "bg-amber-400/20 text-amber-300 border-amber-400/30"
                  }`}
                >
                  {allowBenchBoost
                    ? "Bench Boost Counted (+pts)"
                    : "Bench Boost Excluded by Rules"}
                </span>
              )}

              {squad?.activeChip === "3xc" && (
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                    allowTripleCaptain
                      ? "bg-[#00D9FF]/20 text-[#00D9FF] border-[#00D9FF]/40"
                      : "bg-amber-400/20 text-amber-300 border-amber-400/30"
                  }`}
                >
                  {allowTripleCaptain
                    ? "3x Captain Multiplier Applied"
                    : "Captain Reduced to 2x (Rules)"}
                </span>
              )}

              {squad && squad.transfersCost > 0 && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  -{squad.transfersCost} Transfer Cost
                </span>
              )}
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "pitch" | "list")}
            >
              <TabsList className="bg-black/35 backdrop-blur-md border border-white/15 p-0.5 rounded-xl h-9">
                <TabsTrigger
                  value="pitch"
                  className="gap-1.5 text-xs font-bold px-3.5 py-1 text-white/70 data-[state=active]:bg-[#00FF87] data-[state=active]:text-[#063319] rounded-lg transition-all cursor-pointer shadow-xs"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Pitch View</span>
                </TabsTrigger>
                <TabsTrigger
                  value="list"
                  className="gap-1.5 text-xs font-bold px-3.5 py-1 text-white/70 data-[state=active]:bg-[#00FF87] data-[state=active]:text-[#063319] rounded-lg transition-all cursor-pointer shadow-xs"
                >
                  <List className="h-3.5 w-3.5" />
                  <span>List View</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* MODAL BODY                                                            */}
        {/* ===================================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F8F9FA]">
          {/* Loading Skeleton */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#37003C]/5 text-[#37003C] mb-3">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
              <p className="text-base font-extrabold text-gray-900">
                Fetching tactical squad line-up from FPL...
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Loading official Gameweek picks, captain multiplier, and player scores
              </p>
            </div>
          )}

          {/* FPL Deadline Locked State */}
          {error && !loading && isDeadline && (
            <div className="my-8 max-w-md mx-auto text-center p-6 bg-white rounded-3xl border border-amber-200/90 shadow-md animate-fpl-fade-in">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mb-4 shadow-xs">
                <Clock className="h-7 w-7 animate-pulse" />
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white mb-2 shadow-xs">
                Deadline Locked
              </span>
              <h3 className="text-lg font-black text-[#37003C]">
                Squad Picks Hidden by Premier League
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                The official Fantasy Premier League website locks player picks and lineups while processing the Gameweek deadline. Full squad selections will be accessible once the game update completes and matches kick off.
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="gap-1.5 font-bold border-gray-200 text-[#37003C] hover:bg-gray-50 rounded-xl"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Check Status</span>
                </Button>
                <a
                  href={fplProfileUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#37003C] text-white hover:bg-[#250029] transition-colors shadow-xs"
                >
                  <span>Official FPL Profile</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Standard Error State with Retry */}
          {error && !loading && !isDeadline && (
            <div className="my-6 max-w-md mx-auto">
              <Alert variant="destructive" className="border-rose-200 bg-rose-50 text-rose-900 rounded-2xl">
                <AlertCircle className="h-4 w-4 text-rose-600" />
                <AlertTitle className="font-bold">Unable to Load Squad</AlertTitle>
                <AlertDescription className="text-xs mt-1 text-rose-800">
                  {error}
                </AlertDescription>
              </Alert>
              <div className="mt-3 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="gap-1.5 font-bold border-gray-200 text-[#37003C] hover:bg-white rounded-xl"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Try Again</span>
                </Button>
              </div>
            </div>
          )}

          {/* Manual Tournament Player State */}
          {isManualPlayer && !loading && (
            <div className="my-8 max-w-md mx-auto text-center p-6 bg-white rounded-3xl border border-gray-200/90 shadow-md">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#37003C]/10 border border-[#37003C]/20 text-[#37003C] mb-4 shadow-xs">
                <Shield className="h-7 w-7 text-[#37003C]" />
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#37003C] text-[#00FF87] mb-2 shadow-xs">
                Manual Tournament Player
              </span>
              <h3 className="text-lg font-black text-[#37003C]">
                Direct Roster Entry
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                This player is participating in the tournament via manual roster entry without an external Fantasy Premier League account. Their scores and statistics are entered directly by the tournament administrator for each fixture.
              </p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && !squad && !isManualPlayer && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
              <Shield className="h-10 w-10 text-gray-300 mb-2" />
              <p className="text-sm font-bold text-gray-900">Squad Unavailable</p>
              <p className="text-xs text-gray-500 mt-1">
                No player data was returned for this Gameweek.
              </p>
            </div>
          )}

          {/* =================================================================== */}
          {/* SQUAD CONTENT                                                       */}
          {/* =================================================================== */}
          {!loading && !error && squad && (
            <>
              {activeTab === "pitch" ? (
                /* -------------------------------------------------------------
                 * PITCH VIEW WITH PLAYER PLACEHOLDERS
                 * ------------------------------------------------------------- */
                <div className="space-y-5">
                  {/* Authentic Premier League Football Pitch */}
                  <div className="relative rounded-3xl border-2 border-[#094621] bg-gradient-to-b from-[#0b6330] via-[#095427] to-[#063e1c] p-3 sm:p-6 shadow-xl select-none overflow-hidden">
                    {/* Alternating horizontal grass lawn mow stripes */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 pointer-events-none opacity-20 flex flex-col justify-between"
                    >
                      <div className="h-1/6 w-full bg-black/15" />
                      <div className="h-1/6 w-full bg-white/10" />
                      <div className="h-1/6 w-full bg-black/15" />
                      <div className="h-1/6 w-full bg-white/10" />
                      <div className="h-1/6 w-full bg-black/15" />
                      <div className="h-1/6 w-full bg-white/10" />
                    </div>

                    {/* Floodlight ambience glow */}
                    <div
                      aria-hidden="true"
                      className="absolute -top-12 -left-12 w-64 h-64 bg-white/15 rounded-full blur-3xl pointer-events-none"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute -top-12 -right-12 w-64 h-64 bg-white/15 rounded-full blur-3xl pointer-events-none"
                    />

                    {/* Field Line Markings */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-3xl overflow-hidden opacity-30"
                    >
                      {/* Outer boundary */}
                      <div className="absolute inset-2 sm:inset-4 rounded-2xl border-2 border-white" />
                      {/* Halfway line */}
                      <div className="absolute top-1/2 left-2 sm:left-4 right-2 sm:right-4 h-0.5 bg-white -translate-y-1/2" />
                      {/* Center circle */}
                      <div className="absolute top-1/2 left-1/2 h-24 w-24 sm:h-32 sm:w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" />
                      {/* Center spot */}
                      <div className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
                      {/* Top penalty box */}
                      <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 w-44 sm:w-56 h-14 sm:h-20 border-2 border-t-0 border-white rounded-b-xl" />
                      {/* Top goal area */}
                      <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 w-20 sm:w-28 h-6 sm:h-9 border-2 border-t-0 border-white rounded-b-lg" />
                      {/* Top penalty spot */}
                      <div className="absolute top-12 sm:top-16 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-white" />
                      {/* Bottom penalty box */}
                      <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 w-44 sm:w-56 h-14 sm:h-20 border-2 border-b-0 border-white rounded-t-xl" />
                      {/* Bottom goal area */}
                      <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 w-20 sm:w-28 h-6 sm:h-9 border-2 border-b-0 border-white rounded-t-lg" />
                      {/* Bottom penalty spot */}
                      <div className="absolute bottom-12 sm:bottom-16 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-white" />
                    </div>

                    {/* Tactical Formation Rows: GKP -> DEF -> MID -> FWD */}
                    <div className="relative z-10 flex flex-col justify-between gap-4 sm:gap-6 py-2 min-h-[380px] sm:min-h-[440px]">
                      {/* Row 1: Goalkeeper */}
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

                  {/* ========================================================= */}
                  {/* BENCH / RESERVES SECTION                                 */}
                  {/* ========================================================= */}
                  <div className="rounded-3xl border border-gray-200/90 bg-white p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between text-xs pb-3 mb-3 border-b border-gray-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black uppercase tracking-wider text-[#37003C]">
                          Substitutes / Bench
                        </span>
                        {squad.activeChip === "bboost" ? (
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              allowBenchBoost
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : "bg-amber-50 text-amber-800 border-amber-300"
                            }`}
                          >
                            {allowBenchBoost
                              ? "Bench Boost Active · Points Counted"
                              : "Bench Boost Excluded by Rules"}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px] font-medium">
                            (Points not counted unless Bench Boost active)
                          </span>
                        )}
                      </div>

                      <span className="font-bold text-[#37003C] text-xs">
                        Bench:{" "}
                        <span className="font-black text-sm text-gray-900">
                          {benchTotal} pts
                        </span>
                      </span>
                    </div>

                    {/* 4 Bench Players with Kit Placeholders */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {squad.bench.map((p, idx) => (
                        <div
                          key={p.elementId}
                          className="flex items-center gap-2.5 rounded-2xl bg-gray-50/80 p-2.5 sm:p-3 border border-gray-200/80 hover:border-gray-300 hover:bg-white transition-all shadow-2xs group cursor-pointer"
                        >
                          {/* Mini Kit Placeholder */}
                          <div className="shrink-0">
                            <PlayerKitPlaceholder
                              positionType={p.positionType}
                              teamShortName={p.teamShortName}
                              className="w-8 h-9"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-black text-gray-400 uppercase">
                                {idx === 0 ? "GK" : `Sub ${idx}`}
                              </span>
                            </div>
                            <p className="font-bold text-gray-900 text-xs truncate group-hover:text-[#37003C] transition-colors">
                              {p.webName}
                            </p>
                            <p className="text-[10px] text-gray-500 font-medium truncate">
                              {p.teamShortName} · {p.positionType}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <span
                              className={`font-black text-xs px-2 py-0.5 rounded-md ${
                                squad.activeChip === "bboost" && allowBenchBoost
                                  ? "bg-[#00FF87]/30 text-[#008744] font-black"
                                  : "bg-gray-200 text-gray-700"
                              }`}
                            >
                              {p.points} <span className="text-[9px] font-medium">pts</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* -------------------------------------------------------------
                 * LIST VIEW (Detailed Statistical Table)
                 * ------------------------------------------------------------- */
                <div className="space-y-5">
                  {/* Starters Table */}
                  <div className="rounded-3xl border border-gray-200/90 bg-white overflow-hidden shadow-xs">
                    <div className="bg-gray-50/80 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-[#37003C]">
                        Starting XI ({squad.formation})
                      </span>
                      <span className="text-xs text-gray-900 font-black">
                        {squad.starters.reduce((acc, p) => acc + p.totalPoints, 0)} PTS
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-50/50 border-b border-gray-200">
                          <TableRow className="border-gray-200 hover:bg-transparent">
                            <TableHead className="py-2.5 px-4 text-gray-500 font-bold text-xs whitespace-nowrap">
                              Player
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-gray-500 font-bold text-xs">
                              Club
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-gray-500 font-bold text-xs">
                              Pos
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-gray-500 font-bold text-xs">
                              Role
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-center text-gray-500 font-bold text-xs">
                              Mins
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-center text-gray-500 font-bold text-xs">
                              G / A
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-center text-gray-500 font-bold text-xs">
                              CS
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-center text-gray-500 font-bold text-xs">
                              Bonus
                            </TableHead>
                            <TableHead className="py-2.5 px-4 text-right text-gray-900 font-black text-xs">
                              GW Pts
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 text-gray-900">
                          {squad.starters.map((p) => (
                            <TableRow
                              key={p.elementId}
                              className="border-gray-100 hover:bg-gray-50/80 transition-colors"
                            >
                              <TableCell className="py-3 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <PlayerKitPlaceholder
                                    positionType={p.positionType}
                                    teamShortName={p.teamShortName}
                                    className="w-7 h-8 shrink-0"
                                  />
                                  <div>
                                    <div className="font-bold text-gray-900 text-sm">
                                      {p.webName}
                                    </div>
                                    <div className="text-[11px] text-gray-500">
                                      {p.fullName}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-3 px-2 font-bold text-xs text-gray-600">
                                {p.teamShortName}
                              </TableCell>
                              <TableCell className="py-3 px-2">
                                <span className="text-[10px] font-bold text-[#37003C] bg-[#37003C]/5 px-2 py-0.5 rounded-md border border-[#37003C]/10">
                                  {p.positionType}
                                </span>
                              </TableCell>
                              <TableCell className="py-3 px-2">
                                {p.isCaptain ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-[#FFD700] text-[#37003C] px-2 py-0.5 text-[10px] font-black shadow-2xs">
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
                                  <span className="rounded-md bg-gray-200 text-gray-800 px-2 py-0.5 text-[10px] font-black">
                                    V
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-[10px] font-medium">
                                    Starter
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="py-3 px-2 text-center text-xs font-semibold text-gray-600">
                                {p.stats?.minutes ?? "—"}&apos;
                              </TableCell>
                              <TableCell className="py-3 px-2 text-center text-xs font-bold text-[#37003C]">
                                {(p.stats?.goals || 0) > 0 || (p.stats?.assists || 0) > 0
                                  ? `${p.stats?.goals || 0} / ${p.stats?.assists || 0}`
                                  : "—"}
                              </TableCell>
                              <TableCell className="py-3 px-2 text-center text-xs font-semibold text-gray-600">
                                {p.stats?.cleanSheets ? "Yes" : "—"}
                              </TableCell>
                              <TableCell className="py-3 px-2 text-center text-xs font-semibold text-gray-600">
                                {p.stats?.bonus ? `+${p.stats.bonus}` : "—"}
                              </TableCell>
                              <TableCell className="py-3 px-4 text-right whitespace-nowrap">
                                <span className="font-black text-sm text-gray-900">
                                  {p.totalPoints}
                                </span>
                                {p.multiplier > 1 && (
                                  <span className="text-[10px] text-gray-500 ml-1">
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
                  <div className="rounded-3xl border border-gray-200/90 bg-white overflow-hidden shadow-xs">
                    <div className="bg-gray-50/80 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                        Substitutes / Bench
                      </span>
                      <span className="text-xs text-gray-600 font-bold">
                        {benchTotal} PTS
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-50/50 border-b border-gray-200">
                          <TableRow className="border-gray-200 hover:bg-transparent">
                            <TableHead className="py-2.5 px-4 text-gray-500 font-bold text-xs whitespace-nowrap">
                              Player
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-gray-500 font-bold text-xs">
                              Club
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-gray-500 font-bold text-xs">
                              Pos
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-gray-500 font-bold text-xs">
                              Sub Order
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-center text-gray-500 font-bold text-xs">
                              Mins
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-center text-gray-500 font-bold text-xs">
                              G / A
                            </TableHead>
                            <TableHead className="py-2.5 px-2 text-center text-gray-500 font-bold text-xs">
                              CS
                            </TableHead>
                            <TableHead className="py-2.5 px-4 text-right text-gray-900 font-black text-xs">
                              Pts
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 text-gray-900">
                          {squad.bench.map((p, idx) => (
                            <TableRow
                              key={p.elementId}
                              className="border-gray-100 hover:bg-gray-50/80 transition-colors"
                            >
                              <TableCell className="py-3 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <PlayerKitPlaceholder
                                    positionType={p.positionType}
                                    teamShortName={p.teamShortName}
                                    className="w-7 h-8 shrink-0"
                                  />
                                  <div>
                                    <div className="font-bold text-gray-900 text-sm">
                                      {p.webName}
                                    </div>
                                    <div className="text-[11px] text-gray-500">
                                      {p.fullName}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-3 px-2 font-bold text-xs text-gray-600">
                                {p.teamShortName}
                              </TableCell>
                              <TableCell className="py-3 px-2">
                                <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                                  {p.positionType}
                                </span>
                              </TableCell>
                              <TableCell className="py-3 px-2 text-gray-600 font-semibold text-xs">
                                {idx === 0 ? "Sub GK" : `Sub ${idx}`}
                              </TableCell>
                              <TableCell className="py-3 px-2 text-center text-xs font-semibold text-gray-600">
                                {p.stats?.minutes ?? "—"}&apos;
                              </TableCell>
                              <TableCell className="py-3 px-2 text-center text-xs font-bold text-[#37003C]">
                                {(p.stats?.goals || 0) > 0 || (p.stats?.assists || 0) > 0
                                  ? `${p.stats?.goals || 0} / ${p.stats?.assists || 0}`
                                  : "—"}
                              </TableCell>
                              <TableCell className="py-3 px-2 text-center text-xs font-semibold text-gray-600">
                                {p.stats?.cleanSheets ? "Yes" : "—"}
                              </TableCell>
                              <TableCell className="py-3 px-4 text-right whitespace-nowrap">
                                <span className="font-black text-sm text-gray-700">
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
        <div className="border-t border-gray-200 bg-white px-5 sm:px-7 py-3.5 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#37003C]">
              {isManualPlayer ? "Manual Scoring" : "Official FPL Data"}
            </span>
            <span className="text-gray-300">•</span>
            <span>
              {isManualPlayer ? "Admin Managed Roster" : "Premier League Scoring Engine"}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="font-bold border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl px-4 cursor-pointer"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Player Jersey Kit Placeholder:
 * SVG Vector Premier League jersey kit tailored for Goalkeepers vs Outfielders.
 */
function PlayerKitPlaceholder({
  positionType,
  teamShortName,
  isCaptain = false,
  isViceCaptain = false,
  multiplier = 1,
  className = "w-10 h-11 sm:w-12 sm:h-13",
}: {
  positionType: "GKP" | "DEF" | "MID" | "FWD";
  teamShortName: string;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  multiplier?: number;
  className?: string;
}) {
  const isGkp = positionType === "GKP";

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 110"
        className="w-full h-full drop-shadow-md transition-transform duration-200 group-hover:scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Outfield Jersey Gradients (Premier League purple & emerald) */}
          <linearGradient id="outfieldBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#37003C" />
            <stop offset="55%" stopColor="#240028" />
            <stop offset="100%" stopColor="#140016" />
          </linearGradient>
          <linearGradient id="outfieldSleevesGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00FF87" />
            <stop offset="100%" stopColor="#00A855" />
          </linearGradient>

          {/* Goalkeeper Jersey Gradients (Electric cyan & emerald) */}
          <linearGradient id="gkpBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="55%" stopColor="#0091EA" />
            <stop offset="100%" stopColor="#00609C" />
          </linearGradient>
          <linearGradient id="gkpSleevesGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00FF87" />
            <stop offset="100%" stopColor="#00C853" />
          </linearGradient>
        </defs>

        {/* Sleeves (Left & Right) */}
        <path
          d="M20 32 L2 54 L16 66 L30 48 Z"
          fill={isGkp ? "url(#gkpSleevesGrad)" : "url(#outfieldSleevesGrad)"}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.2"
        />
        <path
          d="M80 32 L98 54 L84 66 L70 48 Z"
          fill={isGkp ? "url(#gkpSleevesGrad)" : "url(#outfieldSleevesGrad)"}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.2"
        />

        {/* Main Body */}
        <path
          d="M26 30 L35 22 C44 26 56 26 65 22 L74 30 L72 96 C72 98 70 100 68 100 L32 100 C30 100 28 98 28 96 Z"
          fill={isGkp ? "url(#gkpBodyGrad)" : "url(#outfieldBodyGrad)"}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.4"
        />

        {/* Collar Trim */}
        <path
          d="M38 23 C45 32 55 32 62 23"
          stroke={isGkp ? "#FFFFFF" : "#00FF87"}
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />

        {/* Subtle Horizontal Chest Accent Line */}
        <path
          d="M30 46 L70 46"
          stroke={isGkp ? "rgba(255,255,255,0.4)" : "rgba(0,255,135,0.4)"}
          strokeWidth="1.5"
          strokeDasharray="2 2"
        />

        {/* Club Code Text on Jersey Front */}
        <text
          x="50"
          y="69"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="15"
          fontWeight="900"
          letterSpacing="0.6"
          fontFamily="system-ui, -apple-system, sans-serif"
          className="select-none"
        >
          {teamShortName}
        </text>
      </svg>

      {/* Captaincy Badges */}
      {isCaptain && (
        <span
          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#FFD700] font-black text-[#37003C] text-[10px] shadow-md border border-[#FFF066] z-10"
          title={`Captain (${multiplier}x points)`}
        >
          {multiplier === 3 ? (
            <Crown className="h-3 w-3 text-[#37003C]" />
          ) : (
            "C"
          )}
        </span>
      )}
      {!isCaptain && isViceCaptain && (
        <span
          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white font-black text-[#37003C] text-[10px] shadow-md border border-gray-200 z-10"
          title="Vice-Captain"
        >
          V
        </span>
      )}

      {/* Multiplier Tag if > 1 */}
      {multiplier > 1 && (
        <span className="absolute -bottom-1 -left-1 rounded-md bg-[#37003C] px-1 py-0.2 text-[8px] font-black text-[#00FF87] border border-[#00FF87]/40 shadow-xs z-10">
          {multiplier}x
        </span>
      )}
    </div>
  );
}

/**
 * Individual Player Pitch Card:
 * Features Player Kit Placeholder, dark high-contrast nameplate, vibrant emerald points badge,
 * and smart directional popover tooltip with performance statistics.
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
      className="group relative flex flex-col items-center select-none cursor-pointer focus:outline-none transition-transform hover:-translate-y-0.5"
      tabIndex={0}
      role="button"
      aria-label={accessibleLabel}
    >
      {/* Player Kit Placeholder Graphic */}
      <PlayerKitPlaceholder
        positionType={player.positionType}
        teamShortName={player.teamShortName}
        isCaptain={player.isCaptain}
        isViceCaptain={player.isViceCaptain}
        multiplier={player.multiplier}
      />

      {/* Name and Points Container */}
      <div className="mt-1 flex flex-col items-center w-full">
        {/* Name Plate */}
        <div className="max-w-[62px] xs:max-w-[74px] sm:max-w-[92px] truncate rounded bg-black/80 backdrop-blur-md px-1.5 py-0.5 text-center text-[9px] xs:text-[10px] sm:text-[11px] font-bold text-white shadow-sm border border-white/20 group-hover:bg-[#37003C] transition-colors">
          {player.webName}
        </div>

        {/* Gameweek Points Pill */}
        <div
          className={`mt-0.5 rounded-full px-2 sm:px-2.5 py-0.2 text-[8px] xs:text-[9px] sm:text-[10px] font-black shadow-sm ${
            player.totalPoints >= 10
              ? "bg-[#00FF87] text-[#072B15] ring-2 ring-[#FFD700]"
              : "bg-[#00FF87] text-[#072B15]"
          }`}
        >
          {player.totalPoints} pts
        </div>
      </div>

      {/* Hover & Focus Stat Tooltip */}
      <div
        className={`pointer-events-none absolute hidden group-hover:flex group-focus-visible:flex flex-col items-center z-40 animate-fpl-fade-in ${horizontalAlignClass} ${
          isGkp ? "top-full mt-2" : "bottom-full mb-2"
        }`}
      >
        {/* If GKP: Arrow on top pointing up */}
        {isGkp && (
          <div className="h-2 w-2 translate-y-1 rotate-45 bg-[#170020] border-l border-t border-[#37003C] z-10 shrink-0" />
        )}

        <div className="rounded-2xl bg-[#170020] border border-[#37003C] p-3 text-center text-[11px] text-white shadow-2xl whitespace-nowrap">
          <p className="font-extrabold text-xs text-[#00FF87]">{player.fullName}</p>
          <p className="text-gray-300 text-[10px] font-medium mt-0.5">
            {player.teamShortName} · {player.positionType}
            {player.isCaptain && ` · Captain (${player.multiplier}x)`}
            {player.isViceCaptain && " · Vice-Captain"}
          </p>
          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-center gap-3 text-[10px]">
            {player.stats?.minutes !== undefined && (
              <span>⏱️ {player.stats.minutes}&apos;</span>
            )}
            {(player.stats?.goals || 0) > 0 && (
              <span className="font-black text-[#FFD700]">
                ⚽ {player.stats?.goals}
              </span>
            )}
            {(player.stats?.assists || 0) > 0 && (
              <span className="font-black text-[#00D9FF]">
                👟 {player.stats?.assists}
              </span>
            )}
            {player.stats?.cleanSheets ? <span className="font-bold text-[#00FF87]">🧤 CS</span> : null}
            {player.stats?.bonus ? (
              <span className="text-[#00FF87] font-bold">+{player.stats.bonus} bonus</span>
            ) : null}
          </div>
          {player.multiplier > 1 && (
            <p className="text-[9px] text-[#00D9FF] font-semibold mt-1">
              Multiplier applied: {player.points} pts × {player.multiplier} = {player.totalPoints} pts
            </p>
          )}
        </div>

        {/* If not GKP: Arrow on bottom pointing down */}
        {!isGkp && (
          <div className="h-2 w-2 -translate-y-1 rotate-45 bg-[#170020] border-r border-b border-[#37003C] z-10 shrink-0" />
        )}
      </div>
    </div>
  );
}
