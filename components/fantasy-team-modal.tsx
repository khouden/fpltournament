"use client";

import { useEffect, useState } from "react";
import {
  X,
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

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayManager = squad?.managerName || managerName || `Manager #${fplId}`;
  const displayTeamName = squad?.teamName || fplTeamName || "Fantasy Team";

  // Group starters by tactical position
  const gkps = squad?.starters.filter((p) => p.positionType === "GKP") || [];
  const defs = squad?.starters.filter((p) => p.positionType === "DEF") || [];
  const mids = squad?.starters.filter((p) => p.positionType === "MID") || [];
  const fwds = squad?.starters.filter((p) => p.positionType === "FWD") || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[94vh] flex flex-col rounded-2xl bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border border-white/15 shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative border-b border-white/10 bg-black/40 px-4 py-3 sm:px-6 sm:py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
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
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600/30 text-indigo-300 font-black border border-indigo-500/30 text-base shadow-md">
                  {tournamentTeamName ? tournamentTeamName.slice(0, 2).toUpperCase() : "PL"}
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight">
                    {displayTeamName}
                  </h2>
                  <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-extrabold text-indigo-300 border border-indigo-500/30">
                    GW {gameweek}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-0.5">
                  <span className="text-gray-200 font-medium">{displayManager}</span>
                  {tournamentTeamName && (
                    <>
                      <span className="text-gray-600">•</span>
                      <span className="text-indigo-300 font-semibold">{tournamentTeamName}</span>
                    </>
                  )}
                  <span className="text-gray-600">•</span>
                  <a
                    href={`https://fantasy.premierleague.com/entry/${fplId}/event/${gameweek}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition hover:underline"
                    title="View on official Fantasy Premier League"
                  >
                    <span>FPL #{fplId}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
              title="Close modal (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Score & Chip Summary Ribbon */}
          {squad && (
            <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl px-3.5 py-1.5 flex items-baseline gap-1.5 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    GW Score:
                  </span>
                  <span className="text-2xl font-mono font-black text-emerald-400">
                    {squad.adjustedPoints}
                  </span>
                  <span className="text-xs font-bold text-emerald-400/80">PTS</span>
                </div>

                {squad.activeChip && (
                  <div className="flex items-center gap-1.5 rounded-xl bg-indigo-500/20 px-3 py-1.5 border border-indigo-500/30 text-xs font-bold text-indigo-200 shadow-xs">
                    {squad.activeChip === "bboost" ? (
                      <>
                        <Armchair className="h-3.5 w-3.5 text-indigo-300" />
                        <span>Bench Boost</span>
                        {!allowBenchBoost && (
                          <span className="text-amber-400 font-medium ml-1">
                            (Excluded: -{squad.chipDeduction} pts)
                          </span>
                        )}
                      </>
                    ) : squad.activeChip === "3xc" ? (
                      <>
                        <Crown className="h-3.5 w-3.5 text-amber-400" />
                        <span>Triple Captain</span>
                        {!allowTripleCaptain && (
                          <span className="text-amber-400 font-medium ml-1">
                            (Reduced to 2x: -{squad.chipDeduction} pts)
                          </span>
                        )}
                      </>
                    ) : squad.activeChip === "freehit" ? (
                      <>
                        <Zap className="h-3.5 w-3.5 text-yellow-400" />
                        <span>Free Hit</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                        <span>Wildcard</span>
                      </>
                    )}
                  </div>
                )}

                {squad.transfersCost > 0 && (
                  <span className="rounded-lg bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-300 border border-red-500/30">
                    -{squad.transfersCost} pts transfer cost
                  </span>
                )}
              </div>

              {/* View Switcher Controls */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab("pitch")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeTab === "pitch"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Pitch View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("list")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeTab === "list"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                  <span>List View</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              <p className="text-sm font-semibold text-gray-300">
                Loading {displayTeamName} squad for Gameweek {gameweek}...
              </p>
              <p className="text-xs text-gray-500">
                Fetching starting XI, captain multipliers, and player points
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center space-y-2 my-8">
              <AlertCircle className="h-8 w-8 text-red-400 mx-auto" />
              <p className="font-bold text-white text-base">Failed to load fantasy squad</p>
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {!loading && !error && squad && (
            <>
              {activeTab === "pitch" ? (
                <div className="space-y-4">
                  {/* Tactical Formation Banner */}
                  <div className="flex items-center justify-between text-xs px-1 text-gray-400">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white uppercase tracking-wider">Starting 11</span>
                      <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-mono text-indigo-300 border border-white/10">
                        {squad.formation} Formation
                      </span>
                    </div>
                    <span className="font-mono text-gray-400">
                      Starters Total:{" "}
                      <strong className="text-white">
                        {squad.starters.reduce((acc, p) => acc + p.totalPoints, 0)} pts
                      </strong>
                    </span>
                  </div>

                  {/* Pitch Container */}
                  <div
                    className="relative rounded-2xl p-4 sm:p-6 overflow-hidden border-2 border-emerald-500/30 shadow-2xl"
                    style={{
                      background:
                        "repeating-linear-gradient(180deg, #064e3b 0px, #064e3b 40px, #047857 40px, #047857 80px)",
                    }}
                  >
                    {/* Pitch Markings Overlay */}
                    <div className="pointer-events-none absolute inset-0">
                      {/* Outer boundary border */}
                      <div className="absolute inset-3 border-2 border-white/20 rounded-xl" />
                      {/* Halfway line */}
                      <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 border-t-2 border-white/20" />
                      {/* Center circle */}
                      <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/20" />
                      {/* Penalty Box Top */}
                      <div className="absolute left-1/2 top-3 h-20 w-44 -translate-x-1/2 border-2 border-t-0 border-white/20 rounded-b-lg" />
                      {/* Penalty Box Bottom */}
                      <div className="absolute left-1/2 bottom-3 h-20 w-44 -translate-x-1/2 border-2 border-b-0 border-white/20 rounded-t-lg" />
                    </div>

                    {/* Pitch Rows */}
                    <div className="relative z-10 space-y-6 sm:space-y-8 py-2">
                      {/* Row 1: Goalkeeper */}
                      <div className="flex justify-center items-center">
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
                          <span
                            className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                              allowBenchBoost
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {allowBenchBoost
                              ? "Bench Boost Active (+ pts counted)"
                              : "Bench Boost Points Excluded"}
                          </span>
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

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/[0.02] text-gray-400 font-semibold border-b border-white/5">
                          <tr>
                            <th className="py-2 px-3">Player</th>
                            <th className="py-2 px-2">Club</th>
                            <th className="py-2 px-2">Pos</th>
                            <th className="py-2 px-2">Role</th>
                            <th className="py-2 px-2 text-center">Mins</th>
                            <th className="py-2 px-2 text-center">G / A</th>
                            <th className="py-2 px-2 text-center">BPS</th>
                            <th className="py-2 px-3 text-right">Pts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-200">
                          {squad.starters.map((p) => (
                            <tr key={p.elementId} className="hover:bg-white/[0.03] transition">
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-white">{p.webName}</div>
                                <div className="text-[10px] text-gray-400">{p.fullName}</div>
                              </td>
                              <td className="py-2.5 px-2 font-semibold text-gray-300">
                                {p.teamShortName}
                              </td>
                              <td className="py-2.5 px-2">
                                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-gray-300">
                                  {p.positionType}
                                </span>
                              </td>
                              <td className="py-2.5 px-2">
                                {p.isCaptain ? (
                                  <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-black text-amber-300 border border-amber-400/30">
                                    C ({p.multiplier}x)
                                  </span>
                                ) : p.isViceCaptain ? (
                                  <span className="rounded bg-slate-400/20 px-1.5 py-0.5 text-[10px] font-black text-slate-300 border border-slate-400/30">
                                    V
                                  </span>
                                ) : (
                                  <span className="text-gray-500 text-[10px]">Starter</span>
                                )}
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono text-gray-400">
                                {p.stats?.minutes ?? "—"}&apos;
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono text-gray-300">
                                {(p.stats?.goals || 0) > 0 || (p.stats?.assists || 0) > 0
                                  ? `${p.stats?.goals || 0} / ${p.stats?.assists || 0}`
                                  : "—"}
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono text-gray-400">
                                {p.stats?.bonus ? `+${p.stats.bonus}` : "—"}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <span className="font-mono font-bold text-sm text-white">
                                  {p.totalPoints}
                                </span>
                                {p.multiplier > 1 && (
                                  <span className="text-[10px] text-gray-400 ml-1">
                                    ({p.points}×{p.multiplier})
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/[0.02] text-gray-400 font-semibold border-b border-white/5">
                          <tr>
                            <th className="py-2 px-3">Player</th>
                            <th className="py-2 px-2">Club</th>
                            <th className="py-2 px-2">Pos</th>
                            <th className="py-2 px-2">Sub Order</th>
                            <th className="py-2 px-2 text-center">Mins</th>
                            <th className="py-2 px-2 text-center">G / A</th>
                            <th className="py-2 px-3 text-right">Pts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-300">
                          {squad.bench.map((p, idx) => (
                            <tr key={p.elementId} className="hover:bg-white/[0.03] transition">
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-gray-300">{p.webName}</div>
                                <div className="text-[10px] text-gray-500">{p.fullName}</div>
                              </td>
                              <td className="py-2.5 px-2 font-semibold text-gray-400">
                                {p.teamShortName}
                              </td>
                              <td className="py-2.5 px-2">
                                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-gray-400">
                                  {p.positionType}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-gray-500 font-semibold">
                                {idx === 0 ? "Sub GK" : `Sub ${idx}`}
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono text-gray-400">
                                {p.stats?.minutes ?? "—"}&apos;
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono text-gray-400">
                                {(p.stats?.goals || 0) > 0 || (p.stats?.assists || 0) > 0
                                  ? `${p.stats?.goals || 0} / ${p.stats?.assists || 0}`
                                  : "—"}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <span className="font-mono font-bold text-sm text-gray-300">
                                  {p.points}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-black/40 px-4 py-3 sm:px-6 flex items-center justify-between text-xs text-gray-400">
          <span>
            Fantasy Premier League · Season 2024/25
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-white/10 px-4 py-1.5 font-bold text-white hover:bg-white/20 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
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
