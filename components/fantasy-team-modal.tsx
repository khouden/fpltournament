"use client";

import { useEffect, useState } from "react";
import {
  ExternalLink,
  Crown,
  Armchair,
  Zap,
  Sparkles,
  Loader2,
  AlertCircle,
  LayoutGrid,
  List,
  Shield,
  Clock,
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
      <DialogContent className="max-w-4xl max-h-[94vh] p-0 overflow-hidden flex flex-col bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border-white/15 text-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-white/10 bg-black/40 px-4 py-3 sm:px-6 sm:py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="flex items-center gap-3">
              {tournamentTeamLogo ? (
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 p-1.5 border border-white/15 shadow-md">
                  <img
                    src={tournamentTeamLogo}
                    alt={tournamentTeamName || "Team"}
                    className="h-8 w-8 object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/30">
                  <Shield className="h-6 w-6" />
                </div>
              )}
              <div>
                <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>{displayTeamName}</span>
                  {(squad?.managerId || fplId) && (
                    <a
                      href={`https://fantasy.premierleague.com/entry/${squad?.managerId || fplId}/event/${gameweek}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-indigo-300 transition"
                      title="Open on official FPL site"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-indigo-200/80 flex items-center gap-2 mt-0.5">
                  <span>{displayManager}</span>
                  <span>•</span>
                  <span>GW {gameweek}</span>
                  {tournamentTeamName && (
                    <>
                      <span>•</span>
                      <span className="text-indigo-400 font-semibold">{tournamentTeamName}</span>
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>

            {/* Score pill & Chip indicator */}
            {squad && (
              <div className="text-right">
                <div className="font-mono text-2xl sm:text-3xl font-black text-emerald-400">
                  {squad.adjustedPoints}{" "}
                  <span className="text-xs sm:text-sm font-sans font-bold text-gray-400">
                    PTS
                  </span>
                </div>
                {squad.activeChip ? (
                  <Badge variant="warning" className="gap-1 text-[10px] uppercase font-bold">
                    <Zap className="h-3 w-3" />
                    <span>
                      {squad.activeChip === "bboost"
                        ? "Bench Boost"
                        : squad.activeChip === "3xc"
                          ? "Triple Captain"
                          : squad.activeChip}
                    </span>
                  </Badge>
                ) : (
                  <span className="text-[10px] text-gray-500 font-medium">No chip played</span>
                )}
              </div>
            )}
          </div>

          {/* Subheader Toolbar with View Switcher */}
          <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400">Formation:</span>
              <Badge variant="subtle" className="font-mono font-bold">
                {squad?.formation || "—"}
              </Badge>
              {squad?.activeChip === "bboost" && (
                <Badge
                  variant={allowBenchBoost ? "success" : "warning"}
                  className="text-[10px]"
                >
                  {allowBenchBoost ? "BB Counted (+pts)" : "BB Excluded (tournament rules)"}
                </Badge>
              )}
              {squad?.activeChip === "3xc" && (
                <Badge
                  variant={allowTripleCaptain ? "success" : "warning"}
                  className="text-[10px]"
                >
                  {allowTripleCaptain ? "3x Captain Active" : "TC Reduced to 2x (tournament rules)"}
                </Badge>
              )}
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "pitch" | "list")}
            >
              <TabsList className="bg-black/40 border border-white/10">
                <TabsTrigger value="pitch" className="gap-1.5 text-xs">
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Pitch</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-1.5 text-xs">
                  <List className="h-3.5 w-3.5" />
                  <span>List</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mb-2" />
              <p className="text-sm">Fetching team line-up from FPL...</p>
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
                  <div className="relative rounded-2xl border border-white/15 bg-gradient-to-b from-emerald-900 via-emerald-800 to-green-950 p-4 sm:p-6 shadow-inner overflow-hidden">
                    {/* Pitch line markings */}
                    <div className="pointer-events-none absolute inset-0 opacity-15">
                      <div className="absolute inset-4 rounded-xl border-2 border-white" />
                      <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white -translate-y-1/2" />
                      <div className="absolute top-1/2 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" />
                    </div>

                    {/* Tactical Formation Rows */}
                    <div className="relative z-10 flex flex-col justify-between gap-5 sm:gap-6 py-2 min-h-[360px]">
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
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3.5 sm:p-4 backdrop-blur">
                    <div className="flex items-center justify-between text-xs pb-2.5 mb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold uppercase tracking-wider text-gray-300">
                          Bench / Substitutes
                        </span>
                        {squad.activeChip === "bboost" ? (
                          <Badge
                            variant={allowBenchBoost ? "success" : "warning"}
                            className="text-[10px]"
                          >
                            {allowBenchBoost
                              ? "Bench Boost Active (+ pts counted)"
                              : "Bench Boost Points Excluded"}
                          </Badge>
                        ) : (
                          <span className="text-gray-500 text-[11px]">
                            (Points do not count towards total)
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-gray-300 text-xs">
                        Bench:{" "}
                        <span className="text-indigo-400">
                          {squad.bench.reduce((sum, p) => sum + p.points, 0)} pts
                        </span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {squad.bench.map((p, idx) => (
                        <div
                          key={p.elementId}
                          className="flex items-center justify-between rounded-xl bg-white/[0.04] p-2 sm:p-2.5 border border-white/5 hover:border-white/15 transition"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-1">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-black text-gray-400">
                              {idx === 0 ? "GK" : idx}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-200 text-xs truncate">
                                {p.webName}
                              </p>
                              <p className="text-[10px] text-gray-500 truncate">
                                {p.teamShortName} · {p.positionType}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <span
                              className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                                squad.activeChip === "bboost" && allowBenchBoost
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-white/10 text-gray-300"
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
                  <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden shadow-xs">
                    <div className="bg-white/5 px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-white">
                        Starting XI ({squad.formation})
                      </span>
                      <span className="font-mono text-xs text-indigo-300 font-bold">
                        {squad.starters.reduce((acc, p) => acc + p.totalPoints, 0)} PTS
                      </span>
                    </div>

                    <Table>
                      <TableHeader className="bg-white/[0.02] border-b border-white/5">
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="py-2 px-3 text-gray-400 font-semibold">Player</TableHead>
                          <TableHead className="py-2 px-2 text-gray-400 font-semibold">Club</TableHead>
                          <TableHead className="py-2 px-2 text-gray-400 font-semibold">Pos</TableHead>
                          <TableHead className="py-2 px-2 text-gray-400 font-semibold">Role</TableHead>
                          <TableHead className="py-2 px-2 text-center text-gray-400 font-semibold">Mins</TableHead>
                          <TableHead className="py-2 px-2 text-center text-gray-400 font-semibold">G / A</TableHead>
                          <TableHead className="py-2 px-2 text-center text-gray-400 font-semibold">BPS</TableHead>
                          <TableHead className="py-2 px-3 text-right text-gray-400 font-semibold">Pts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-white/5 text-gray-200">
                        {squad.starters.map((p) => (
                          <TableRow key={p.elementId} className="border-white/5 hover:bg-white/[0.03] transition">
                            <TableCell className="py-2.5 px-3">
                              <div className="font-bold text-white">{p.webName}</div>
                              <div className="text-[10px] text-gray-400">{p.fullName}</div>
                            </TableCell>
                            <TableCell className="py-2.5 px-2 font-semibold text-gray-300">
                              {p.teamShortName}
                            </TableCell>
                            <TableCell className="py-2.5 px-2">
                              <Badge variant="subtle" className="text-[10px]">
                                {p.positionType}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2.5 px-2">
                              {p.isCaptain ? (
                                <Badge variant="warning" className="text-[10px] font-black">
                                  C ({p.multiplier}x)
                                </Badge>
                              ) : p.isViceCaptain ? (
                                <Badge variant="subtle" className="text-[10px] font-black">
                                  V
                                </Badge>
                              ) : (
                                <span className="text-gray-500 text-[10px]">Starter</span>
                              )}
                            </TableCell>
                            <TableCell className="py-2.5 px-2 text-center font-mono text-gray-400">
                              {p.stats?.minutes ?? "—"}&apos;
                            </TableCell>
                            <TableCell className="py-2.5 px-2 text-center font-mono text-gray-300">
                              {(p.stats?.goals || 0) > 0 || (p.stats?.assists || 0) > 0
                                ? `${p.stats?.goals || 0} / ${p.stats?.assists || 0}`
                                : "—"}
                            </TableCell>
                            <TableCell className="py-2.5 px-2 text-center font-mono text-gray-400">
                              {p.stats?.bonus ? `+${p.stats.bonus}` : "—"}
                            </TableCell>
                            <TableCell className="py-2.5 px-3 text-right">
                              <span className="font-mono font-bold text-sm text-white">
                                {p.totalPoints}
                              </span>
                              {p.multiplier > 1 && (
                                <span className="text-[10px] text-gray-400 ml-1">
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
                  <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden shadow-xs">
                    <div className="bg-white/5 px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Substitutes / Bench
                      </span>
                      <span className="font-mono text-xs text-gray-400 font-semibold">
                        {squad.bench.reduce((sum, p) => sum + p.points, 0)} PTS
                      </span>
                    </div>

                    <Table>
                      <TableHeader className="bg-white/[0.02] border-b border-white/5">
                        <TableRow className="border-white/5 hover:bg-transparent">
                          <TableHead className="py-2 px-3 text-gray-400 font-semibold">Player</TableHead>
                          <TableHead className="py-2 px-2 text-gray-400 font-semibold">Club</TableHead>
                          <TableHead className="py-2 px-2 text-gray-400 font-semibold">Pos</TableHead>
                          <TableHead className="py-2 px-2 text-gray-400 font-semibold">Sub Order</TableHead>
                          <TableHead className="py-2 px-2 text-center text-gray-400 font-semibold">Mins</TableHead>
                          <TableHead className="py-2 px-2 text-center text-gray-400 font-semibold">G / A</TableHead>
                          <TableHead className="py-2 px-3 text-right text-gray-400 font-semibold">Pts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-white/5 text-gray-300">
                        {squad.bench.map((p, idx) => (
                          <TableRow key={p.elementId} className="border-white/5 hover:bg-white/[0.03] transition">
                            <TableCell className="py-2.5 px-3">
                              <div className="font-bold text-gray-300">{p.webName}</div>
                              <div className="text-[10px] text-gray-500">{p.fullName}</div>
                            </TableCell>
                            <TableCell className="py-2.5 px-2 font-semibold text-gray-400">
                              {p.teamShortName}
                            </TableCell>
                            <TableCell className="py-2.5 px-2">
                              <Badge variant="subtle" className="text-[10px]">
                                {p.positionType}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2.5 px-2 text-gray-500 font-semibold">
                              {idx === 0 ? "Sub GK" : `Sub ${idx}`}
                            </TableCell>
                            <TableCell className="py-2.5 px-2 text-center font-mono text-gray-400">
                              {p.stats?.minutes ?? "—"}&apos;
                            </TableCell>
                            <TableCell className="py-2.5 px-2 text-center font-mono text-gray-400">
                              {(p.stats?.goals || 0) > 0 || (p.stats?.assists || 0) > 0
                                ? `${p.stats?.goals || 0} / ${p.stats?.assists || 0}`
                                : "—"}
                            </TableCell>
                            <TableCell className="py-2.5 px-3 text-right">
                              <span className="font-mono font-bold text-sm text-gray-300">
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

        {/* Footer */}
        <div className="border-t border-white/10 bg-black/40 px-4 py-3 sm:px-6 flex items-center justify-between text-xs text-gray-400">
          <span>Fantasy Premier League · Season 2024/25</span>
          <Button
            variant="subtle"
            size="sm"
            onClick={onClose}
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
        <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-slate-900/90 border border-white/20 shadow-lg text-white font-black text-xs transition group-hover:scale-105 group-hover:border-indigo-400">
          <span className="text-[10px] sm:text-xs font-mono font-black tracking-tighter">
            {player.teamShortName}
          </span>

          {/* Captaincy Badge */}
          {player.isCaptain && (
            <span
              className="absolute -top-1.5 -right-1.5 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-amber-400 font-black text-slate-950 text-[9px] sm:text-[10px] shadow-md border border-amber-200"
              title={`Captain (${player.multiplier}x points)`}
            >
              C
            </span>
          )}
          {!player.isCaptain && player.isViceCaptain && (
            <span
              className="absolute -top-1.5 -right-1.5 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-slate-300 font-black text-slate-950 text-[9px] sm:text-[10px] shadow-md border border-white"
              title="Vice-Captain"
            >
              V
            </span>
          )}

          {/* Multiplier Tag if > 1 */}
          {player.multiplier > 1 && (
            <span className="absolute -bottom-1 -left-1 rounded bg-indigo-600 px-1 py-0.2 text-[8px] font-black text-white shadow-xs">
              x{player.multiplier}
            </span>
          )}
        </div>
      </div>

      {/* Name and Points Plate */}
      <div className="mt-1 flex flex-col items-center">
        <div className="max-w-[72px] sm:max-w-[88px] truncate rounded bg-slate-950/85 px-1.5 py-0.5 text-center text-[10px] sm:text-[11px] font-bold text-white shadow-xs border border-white/10">
          {player.webName}
        </div>
        <div className="mt-0.5 rounded-full bg-emerald-500/90 px-2 py-0.2 text-[9px] sm:text-[10px] font-mono font-black text-slate-950 shadow-xs">
          {player.totalPoints} pts
        </div>
      </div>

      {/* Hover Tooltip with In-depth Performance Stats */}
      <div className="pointer-events-none absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30">
        <div className="rounded-lg bg-slate-950 border border-white/20 p-2 text-center text-[10px] text-white shadow-xl whitespace-nowrap">
          <p className="font-bold text-xs text-indigo-300">{player.fullName}</p>
          <p className="text-gray-400">
            {player.teamShortName} · {player.positionType}
          </p>
          <div className="mt-1 pt-1 border-t border-white/10 flex items-center justify-center gap-2 font-mono text-[9px]">
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
        <div className="h-1.5 w-1.5 -translate-y-0.5 rotate-45 bg-slate-950 border-r border-b border-white/20" />
      </div>
    </div>
  );
}
