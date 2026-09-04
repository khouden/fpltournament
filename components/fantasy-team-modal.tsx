"use client";

import { useEffect, useState } from "react";
import {
  ExternalLink,
  Crown,
  Zap,
  Loader2,
  AlertCircle,
  LayoutGrid,
  List,
  Shield,
  X,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface FantasyTeamModalProps {
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

  useEffect(() => {
    if (!isOpen || !fplId) return;

    let isMounted = true;
    const fetchSquad = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          gameweek: String(gameweek),
          allowBenchBoost: String(allowBenchBoost),
          allowTripleCaptain: String(allowTripleCaptain),
        });
        const res = await fetch(`/api/fpl/manager/${fplId}/picks?${queryParams.toString()}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP error ${res.status}`);
        }
        const data = await res.json();
        if (isMounted) {
          setSquad(data.squad);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load squad");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSquad();

    return () => {
      isMounted = false;
    };
  }, [isOpen, fplId, gameweek, allowBenchBoost, allowTripleCaptain]);

  const displayManager = squad?.managerName || managerName || `Manager #${fplId}`;
  const displayTeamName = squad?.teamName || fplTeamName || "Fantasy Team";

  // Group starters by tactical position
  const gkps = squad?.starters.filter((p) => p.positionType === "GKP") || [];
  const defs = squad?.starters.filter((p) => p.positionType === "DEF") || [];
  const mids = squad?.starters.filter((p) => p.positionType === "MID") || [];
  const fwds = squad?.starters.filter((p) => p.positionType === "FWD") || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[94vh] p-0 overflow-hidden flex flex-col bg-white border border-[#E5E5E5] text-[#1F1F1F] shadow-2xl rounded-2xl">
        {/* Modal Header */}
        <div className="border-b border-[#EAEAEA] bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-4 pr-7">
            <div className="flex items-center gap-3.5">
              {tournamentTeamLogo ? (
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-white p-1 border border-[#E5E5E5] shadow-xs">
                  <img
                    src={tournamentTeamLogo}
                    alt={tournamentTeamName || "Team"}
                    className="h-8 w-8 object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#37003C] text-white font-bold shadow-xs">
                  <Shield className="h-6 w-6 text-[#00FF87]" />
                </div>
              )}
              <div>
                <DialogTitle className="text-lg sm:text-xl font-extrabold tracking-tight text-[#37003C] flex items-center gap-2">
                  <span>{displayTeamName}</span>
                  {(squad?.managerId || fplId) && (
                    <a
                      href={`https://fantasy.premierleague.com/entry/${squad?.managerId || fplId}/event/${gameweek}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#777777] hover:text-[#37003C] transition-colors inline-flex items-center"
                      title="Open on official Premier League website"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#666666] flex flex-wrap items-center gap-2 mt-0.5 font-medium">
                  <span className="font-semibold text-[#1F1F1F]">{displayManager}</span>
                  <span>•</span>
                  <span>Gameweek {gameweek}</span>
                  {tournamentTeamName && (
                    <>
                      <span>•</span>
                      <span className="text-[#37003C] font-bold">{tournamentTeamName}</span>
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>

            {/* Score & Chip Indicator */}
            {squad && (
              <div className="text-right shrink-0">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#37003C] leading-none">
                  {squad.adjustedPoints}{" "}
                  <span className="text-xs sm:text-sm font-bold text-[#777777]">
                    PTS
                  </span>
                </div>
                <div className="mt-1">
                  {squad.activeChip ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E7FF00]/40 border border-[#E7FF00] px-2 py-0.5 text-[10px] uppercase font-black text-[#37003C]">
                      <Zap className="h-3 w-3 text-[#37003C]" />
                      <span>
                        {squad.activeChip === "bboost"
                          ? "Bench Boost"
                          : squad.activeChip === "3xc"
                            ? "Triple Captain"
                            : squad.activeChip}
                      </span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#888888] font-medium">No chip played</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Subheader Toolbar with View Switcher */}
          <div className="mt-3 pt-3 border-t border-[#EAEAEA] flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#777777] font-semibold">Formation:</span>
              <span className="font-bold text-[#37003C] bg-[#37003C]/5 px-2 py-0.5 rounded-[6px] border border-[#37003C]/10">
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
                  {allowBenchBoost ? "BB Counted (+pts)" : "BB Excluded (tournament rules)"}
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
                  {allowTripleCaptain ? "3x Captain Active" : "TC Reduced to 2x (tournament rules)"}
                </span>
              )}
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "pitch" | "list")}
            >
              <TabsList className="bg-[#F5F5F5] border border-[#E5E5E5] p-0.5 rounded-[8px]">
                <TabsTrigger
                  value="pitch"
                  className="gap-1.5 text-xs font-bold data-[state=active]:bg-[#37003C] data-[state=active]:text-white rounded-[6px]"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Pitch View</span>
                </TabsTrigger>
                <TabsTrigger
                  value="list"
                  className="gap-1.5 text-xs font-bold data-[state=active]:bg-[#37003C] data-[state=active]:text-white rounded-[6px]"
                >
                  <List className="h-3.5 w-3.5" />
                  <span>List View</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#F9F9F9]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-[#777777]">
              <Loader2 className="h-8 w-8 animate-spin text-[#37003C] mb-2" />
              <p className="text-sm font-semibold">Fetching squad line-up from FPL...</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="my-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Squad Unavailable</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && !error && squad && (
            <>
              {activeTab === "pitch" ? (
                /* Pitch View */
                <div className="space-y-4">
                  {/* Grass Pitch Graphic */}
                  <div className="relative rounded-2xl border border-emerald-900/30 bg-gradient-to-b from-[#095228] via-[#0b5c2d] to-[#073d1b] p-4 sm:p-6 shadow-md overflow-hidden">
                    {/* Pitch line markings */}
                    <div className="pointer-events-none absolute inset-0 opacity-20">
                      <div className="absolute inset-4 rounded-xl border-2 border-white" />
                      <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white -translate-y-1/2" />
                      <div className="absolute top-1/2 left-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" />
                      {/* Penalty box top */}
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-48 h-20 border-2 border-t-0 border-white rounded-b-lg" />
                      {/* Penalty box bottom */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 h-20 border-2 border-b-0 border-white rounded-t-lg" />
                    </div>

                    {/* Tactical Formation Rows */}
                    <div className="relative z-10 flex flex-col justify-between gap-5 sm:gap-6 py-2 min-h-[380px]">
                      {/* Row 1: Goalkeeper */}
                      <div className="flex justify-around items-center">
                        {gkps.map((p) => (
                          <PitchPlayerCard key={p.elementId} player={p} />
                        ))}
                      </div>

                      {/* Row 2: Defenders */}
                      <div className="flex justify-around items-center gap-1 sm:gap-2">
                        {defs.map((p) => (
                          <PitchPlayerCard key={p.elementId} player={p} />
                        ))}
                      </div>

                      {/* Row 3: Midfielders */}
                      <div className="flex justify-around items-center gap-1 sm:gap-2">
                        {mids.map((p) => (
                          <PitchPlayerCard key={p.elementId} player={p} />
                        ))}
                      </div>

                      {/* Row 4: Forwards */}
                      <div className="flex justify-around items-center gap-1 sm:gap-2">
                        {fwds.map((p) => (
                          <PitchPlayerCard key={p.elementId} player={p} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bench Section (Dugout) */}
                  <div className="rounded-[14px] border border-[#E5E5E5] bg-white p-3.5 sm:p-4 shadow-fpl-sm">
                    <div className="flex items-center justify-between text-xs pb-2.5 mb-3 border-b border-[#EAEAEA]">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold uppercase tracking-wider text-[#37003C]">
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
                              ? "Bench Boost Active (+ pts counted)"
                              : "Bench Boost Points Excluded"}
                          </span>
                        ) : (
                          <span className="text-[#888888] text-[11px] font-medium">
                            (Excluded from match total per rules)
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-[#37003C] text-xs">
                        Bench:{" "}
                        <span className="font-extrabold">
                          {squad.bench.reduce((sum, p) => sum + p.points, 0)} pts
                        </span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {squad.bench.map((p, idx) => (
                        <div
                          key={p.elementId}
                          className="flex items-center justify-between rounded-[10px] bg-[#FBFBFB] p-2 sm:p-2.5 border border-[#EBEBEB] hover:border-[#37003C]/20 transition-colors shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-1">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EAEAEA] text-[10px] font-extrabold text-[#555555]">
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
                              className={`font-bold text-xs px-2 py-0.5 rounded-[6px] ${
                                squad.activeChip === "bboost" && allowBenchBoost
                                  ? "bg-[#00FF87]/20 text-[#008744] border border-[#00FF87]/40"
                                  : "bg-[#EAEAEA] text-[#444444]"
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
                /* List View */
                <div className="space-y-4">
                  {/* Starters Table */}
                  <div className="rounded-[14px] border border-[#E5E5E5] bg-white overflow-hidden shadow-fpl-sm">
                    <div className="bg-[#FAFAFA] px-4 py-2.5 border-b border-[#E5E5E5] flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#37003C]">
                        Starting XI ({squad.formation})
                      </span>
                      <span className="text-xs text-[#37003C] font-extrabold">
                        {squad.starters.reduce((acc, p) => acc + p.totalPoints, 0)} PTS
                      </span>
                    </div>

                    <Table>
                      <TableHeader className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
                        <TableRow className="border-[#E5E5E5] hover:bg-transparent">
                          <TableHead className="py-2.5 px-3 text-[#777777] font-bold text-xs">Player</TableHead>
                          <TableHead className="py-2.5 px-2 text-[#777777] font-bold text-xs">Club</TableHead>
                          <TableHead className="py-2.5 px-2 text-[#777777] font-bold text-xs">Pos</TableHead>
                          <TableHead className="py-2.5 px-2 text-[#777777] font-bold text-xs">Role</TableHead>
                          <TableHead className="py-2.5 px-2 text-center text-[#777777] font-bold text-xs">Mins</TableHead>
                          <TableHead className="py-2.5 px-2 text-center text-[#777777] font-bold text-xs">G / A</TableHead>
                          <TableHead className="py-2.5 px-2 text-center text-[#777777] font-bold text-xs">BPS</TableHead>
                          <TableHead className="py-2.5 px-3 text-right text-[#777777] font-bold text-xs">Pts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-[#E5E5E5]/70 text-[#1F1F1F]">
                        {squad.starters.map((p) => (
                          <TableRow key={p.elementId} className="border-[#E5E5E5]/70 hover:bg-[#F9F9F9] transition-colors">
                            <TableCell className="py-2.5 px-3">
                              <div className="font-bold text-[#37003C] text-sm">{p.webName}</div>
                              <div className="text-[10px] text-[#777777]">{p.fullName}</div>
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
                                <span className="rounded bg-[#FFD700] text-[#37003C] px-1.5 py-0.5 text-[10px] font-black shadow-2xs">
                                  C ({p.multiplier}x)
                                </span>
                              ) : p.isViceCaptain ? (
                                <span className="rounded bg-[#E2E8F0] text-[#37003C] px-1.5 py-0.5 text-[10px] font-black">
                                  V
                                </span>
                              ) : (
                                <span className="text-[#888888] text-[10px] font-medium">Starter</span>
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
                            <TableCell className="py-2.5 px-2 text-center text-xs font-semibold text-[#666666]">
                              {p.stats?.bonus ? `+${p.stats.bonus}` : "—"}
                            </TableCell>
                            <TableCell className="py-2.5 px-3 text-right">
                              <span className="font-extrabold text-sm text-[#37003C]">
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

                  {/* Bench Table */}
                  <div className="rounded-[14px] border border-[#E5E5E5] bg-white overflow-hidden shadow-fpl-sm">
                    <div className="bg-[#FAFAFA] px-4 py-2.5 border-b border-[#E5E5E5] flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#777777]">
                        Substitutes / Bench
                      </span>
                      <span className="text-xs text-[#777777] font-bold">
                        {squad.bench.reduce((sum, p) => sum + p.points, 0)} PTS
                      </span>
                    </div>

                    <Table>
                      <TableHeader className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
                        <TableRow className="border-[#E5E5E5] hover:bg-transparent">
                          <TableHead className="py-2.5 px-3 text-[#777777] font-bold text-xs">Player</TableHead>
                          <TableHead className="py-2.5 px-2 text-[#777777] font-bold text-xs">Club</TableHead>
                          <TableHead className="py-2.5 px-2 text-[#777777] font-bold text-xs">Pos</TableHead>
                          <TableHead className="py-2.5 px-2 text-[#777777] font-bold text-xs">Sub Order</TableHead>
                          <TableHead className="py-2.5 px-2 text-center text-[#777777] font-bold text-xs">Mins</TableHead>
                          <TableHead className="py-2.5 px-2 text-center text-[#777777] font-bold text-xs">G / A</TableHead>
                          <TableHead className="py-2.5 px-3 text-right text-[#777777] font-bold text-xs">Pts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-[#E5E5E5]/70 text-[#1F1F1F]">
                        {squad.bench.map((p, idx) => (
                          <TableRow key={p.elementId} className="border-[#E5E5E5]/70 hover:bg-[#F9F9F9] transition-colors">
                            <TableCell className="py-2.5 px-3">
                              <div className="font-bold text-[#1F1F1F] text-sm">{p.webName}</div>
                              <div className="text-[10px] text-[#777777]">{p.fullName}</div>
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
                            <TableCell className="py-2.5 px-3 text-right">
                              <span className="font-extrabold text-sm text-[#444444]">
                                {p.points}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-[#E5E5E5] bg-[#FAFAFA] px-5 py-3 sm:px-6 flex items-center justify-between text-xs text-[#777777]">
          <span className="font-medium">Fantasy Premier League · Official API Sync</span>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="font-bold border-[#E5E5E5] hover:bg-white text-[#37003C]"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Individual Player Card on the Football Pitch
 */
function PitchPlayerCard({ player }: { player: FantasyPlayerPick }) {
  return (
    <div className="group relative flex flex-col items-center select-none">
      {/* Shirt / Badge Avatar */}
      <div className="relative">
        <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-[10px] bg-white/95 border border-white/40 shadow-md text-[#37003C] font-black text-xs transition group-hover:scale-105">
          <span className="text-[10px] sm:text-xs font-black tracking-tight">
            {player.teamShortName}
          </span>

          {/* Captaincy Badge */}
          {player.isCaptain && (
            <span
              className="absolute -top-1.5 -right-1.5 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-[#FFD700] font-black text-[#37003C] text-[9px] sm:text-[10px] shadow-sm border border-[#FFE033]"
              title={`Captain (${player.multiplier}x points)`}
            >
              C
            </span>
          )}
          {!player.isCaptain && player.isViceCaptain && (
            <span
              className="absolute -top-1.5 -right-1.5 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-[#E2E8F0] font-black text-[#37003C] text-[9px] sm:text-[10px] shadow-sm border border-white"
              title="Vice-Captain"
            >
              V
            </span>
          )}

          {/* Multiplier Tag if > 1 */}
          {player.multiplier > 1 && (
            <span className="absolute -bottom-1 -left-1 rounded bg-[#37003C] px-1 py-0.2 text-[8px] font-black text-[#00FF87] shadow-xs">
              x{player.multiplier}
            </span>
          )}
        </div>
      </div>

      {/* Name and Points Plate */}
      <div className="mt-1 flex flex-col items-center">
        <div className="max-w-[72px] sm:max-w-[88px] truncate rounded bg-white/95 px-1.5 py-0.5 text-center text-[10px] sm:text-[11px] font-bold text-[#37003C] shadow-xs border border-white/60">
          {player.webName}
        </div>
        <div className="mt-0.5 rounded-full bg-[#00FF87] px-2 py-0.2 text-[9px] sm:text-[10px] font-black text-[#37003C] shadow-xs">
          {player.totalPoints} pts
        </div>
      </div>

      {/* Hover Tooltip with In-depth Performance Stats */}
      <div className="pointer-events-none absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30">
        <div className="rounded-[8px] bg-[#37003C] border border-[#5A0A63] p-2 text-center text-[10px] text-white shadow-xl whitespace-nowrap">
          <p className="font-bold text-xs text-[#00FF87]">{player.fullName}</p>
          <p className="text-gray-300">
            {player.teamShortName} · {player.positionType}
          </p>
          <div className="mt-1 pt-1 border-t border-white/10 flex items-center justify-center gap-2 text-[9px]">
            {player.stats?.minutes !== undefined && (
              <span>⏱️ {player.stats.minutes}&apos;</span>
            )}
            {(player.stats?.goals || 0) > 0 && <span>⚽ {player.stats?.goals}</span>}
            {(player.stats?.assists || 0) > 0 && (
              <span>👟 {player.stats?.assists}</span>
            )}
            {player.stats?.cleanSheets ? <span>🧤 CS</span> : null}
            {player.stats?.bonus ? <span>⭐ +{player.stats.bonus}</span> : null}
          </div>
        </div>
        <div className="h-1.5 w-1.5 -translate-y-0.5 rotate-45 bg-[#37003C] border-r border-b border-[#5A0A63]" />
      </div>
    </div>
  );
}
