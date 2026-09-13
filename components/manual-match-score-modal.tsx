"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Trophy,
  Check,
  Loader2,
  Shield,
  Zap,
  Clock,
  Sparkles,
  AlertCircle,
  Pencil,
  RotateCcw,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  saveManualMatchScoresAction,
  type ManualMemberScoreInput,
} from "@/lib/scoring-actions";

export interface MatchMemberData {
  id: string;
  fplName: string;
  fplTeamName: string | null;
  fplId: number;
  isAdmin: boolean;
  isManual?: boolean;
}

export interface MatchGroupData {
  id: string;
  name: string;
  logo: string | null;
  isManual?: boolean;
  members?: MatchMemberData[];
}

export interface MatchScoreData {
  memberId: string;
  gameweekPoints: number;
  activeChip: string | null;
  isExcluded: boolean;
}

export interface ManualMatchScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  matchId: string;
  matchNumber: number;
  gameweek: number;
  homeGroup: MatchGroupData | null;
  awayGroup: MatchGroupData | null;
  existingScores: MatchScoreData[];
  onScoresSaved?: () => void;
}

export function ManualMatchScoreModal({
  isOpen,
  onClose,
  tournamentId,
  matchId,
  matchNumber,
  gameweek,
  homeGroup,
  awayGroup,
  existingScores,
  onScoresSaved,
}: ManualMatchScoreModalProps) {
  // Score state keyed by memberId: { points: number, chip: string | null }
  const [memberScores, setMemberScores] = useState<
    Record<string, { points: number; chip: string | null }>
  >({});
  const [matchStatus, setMatchStatus] = useState<"COMPLETED" | "IN_PROGRESS">(
    "COMPLETED"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"home" | "away">("home");

  const homeMembers = useMemo(
    () => (homeGroup && Array.isArray(homeGroup.members) ? homeGroup.members : []),
    [homeGroup]
  );
  const awayMembers = useMemo(
    () => (awayGroup && Array.isArray(awayGroup.members) ? awayGroup.members : []),
    [awayGroup]
  );

  // Initialize or reset scores when modal opens
  useEffect(() => {
    if (!isOpen) return;

    queueMicrotask(() => {
      const initial: Record<string, { points: number; chip: string | null }> = {};

      const allMembers = [...homeMembers, ...awayMembers];

      for (const m of allMembers) {
        const found = existingScores.find((s) => s.memberId === m.id);
        initial[m.id] = {
          points: found ? found.gameweekPoints : 0,
          chip: found ? found.activeChip : null,
        };
      }

      setMemberScores(initial);
      setError("");
      setLoading(false);
    });
  }, [isOpen, existingScores, homeMembers, awayMembers]);

  // Calculate live team total scores
  const homeTotal = useMemo(() => {
    return homeMembers.reduce((acc, m) => {
      if (m.isAdmin) return acc;
      const pts = memberScores[m.id]?.points || 0;
      return acc + pts;
    }, 0);
  }, [homeMembers, memberScores]);

  const awayTotal = useMemo(() => {
    return awayMembers.reduce((acc, m) => {
      if (m.isAdmin) return acc;
      const pts = memberScores[m.id]?.points || 0;
      return acc + pts;
    }, 0);
  }, [awayMembers, memberScores]);

  const projectedResult = useMemo(() => {
    if (homeTotal > awayTotal) return "HOME_WIN";
    if (awayTotal > homeTotal) return "AWAY_WIN";
    return "DRAW";
  }, [homeTotal, awayTotal]);

  const handlePointChange = (memberId: string, val: string) => {
    const parsed = parseInt(val, 10);
    const safePoints = isNaN(parsed) ? 0 : parsed;
    setMemberScores((prev) => ({
      ...prev,
      [memberId]: {
        points: safePoints,
        chip: prev[memberId]?.chip || null,
      },
    }));
  };

  const handleChipChange = (memberId: string, chipVal: string) => {
    setMemberScores((prev) => ({
      ...prev,
      [memberId]: {
        points: prev[memberId]?.points || 0,
        chip: chipVal === "none" ? null : chipVal,
      },
    }));
  };

  const handleResetToZero = () => {
    setMemberScores((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        updated[id] = { points: 0, chip: null };
      });
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload: ManualMemberScoreInput[] = Object.entries(
        memberScores
      ).map(([memberId, val]) => ({
        memberId,
        gameweekPoints: val.points,
        activeChip: val.chip,
      }));

      const res = await saveManualMatchScoresAction({
        matchId,
        tournamentId,
        scores: payload,
        status: matchStatus,
      });

      if (res.success) {
        onScoresSaved?.();
        onClose();
      } else {
        setError(res.error || "Failed to save match scores");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save scores");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden border-[#E5E5E5] bg-white text-[#1F1F1F] shadow-2xl rounded-2xl">
        {/* Header with Live Scoreboard */}
        <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-[#E5E5E5] bg-gradient-to-r from-[#1F0022] via-[#37003C] to-[#1F0022] text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#00FF87] bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                MATCH {matchNumber} · GAMEWEEK {gameweek}
              </span>
              <DialogTitle className="text-xl font-black tracking-tight text-white">
                Enter Fixture Scores
              </DialogTitle>
              <DialogDescription className="text-xs text-white/70">
                Insert points for team players. Non-admin player scores are summed automatically.
              </DialogDescription>
            </div>

            {/* Scoreboard Pill */}
            <div className="flex items-center gap-3 bg-black/40 border border-white/20 px-4 py-2 rounded-xl backdrop-blur-md self-start sm:self-center">
              <div className="text-right">
                <p className="text-[11px] font-bold text-white/80 truncate max-w-[90px] sm:max-w-[120px]">
                  {homeGroup?.name || "Home"}
                </p>
                <p className="text-2xl font-black font-mono text-[#00FF87] leading-none mt-0.5">
                  {homeTotal}
                </p>
              </div>
              <span className="text-sm font-bold text-white/40">—</span>
              <div className="text-left">
                <p className="text-[11px] font-bold text-white/80 truncate max-w-[90px] sm:max-w-[120px]">
                  {awayGroup?.name || "Away"}
                </p>
                <p className="text-2xl font-black font-mono text-[#00FF87] leading-none mt-0.5">
                  {awayTotal}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {error && (
            <Alert variant="destructive" className="border-[#E9007F]/30 bg-[#E9007F]/10 text-[#E9007F]">
              <AlertTitle className="font-bold text-xs sm:text-sm">Error</AlertTitle>
              <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
            </Alert>
          )}

          {/* Result Preview Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#F7F7F7] border border-[#E5E5E5]">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-[#D97706]" />
              <span className="text-xs font-bold text-[#1F1F1F]">Outcome Preview:</span>
              <span
                className={`text-xs font-extrabold uppercase px-2 py-0.5 rounded-[6px] ${
                  projectedResult === "DRAW"
                    ? "bg-amber-100 text-amber-900 border border-amber-300/60"
                    : "bg-emerald-100 text-emerald-900 border border-emerald-300/60"
                }`}
              >
                {projectedResult === "DRAW"
                  ? "DRAW"
                  : projectedResult === "HOME_WIN"
                    ? `${homeGroup?.name || "Home"} WIN`
                    : `${awayGroup?.name || "Away"} WIN`}
              </span>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetToZero}
              className="h-7 px-2 text-[11px] text-[#777777] hover:text-[#1F1F1F] gap-1 cursor-pointer"
              title="Reset all member points to 0"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset to 0</span>
            </Button>
          </div>

          {/* Tabs for Home vs Away Squad */}
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as "home" | "away")}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 bg-[#F0F0F0] p-1 rounded-xl h-11">
              <TabsTrigger
                value="home"
                className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-[#37003C] data-[state=active]:shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {homeGroup?.logo && (
                  <img src={homeGroup.logo} alt="" className="h-4 w-4 object-contain" />
                )}
                <span className="truncate">{homeGroup?.name || "Home Team"}</span>
                <span className="ml-1 rounded-full bg-[#37003C]/10 px-2 py-0.2 text-[11px] font-black text-[#37003C]">
                  {homeTotal} pts
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="away"
                className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-[#37003C] data-[state=active]:shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {awayGroup?.logo && (
                  <img src={awayGroup.logo} alt="" className="h-4 w-4 object-contain" />
                )}
                <span className="truncate">{awayGroup?.name || "Away Team"}</span>
                <span className="ml-1 rounded-full bg-[#37003C]/10 px-2 py-0.2 text-[11px] font-black text-[#37003C]">
                  {awayTotal} pts
                </span>
              </TabsTrigger>
            </TabsList>

            {/* Home Tab Content */}
            <TabsContent value="home" className="mt-4 space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#E5E5E5] text-[11px] font-bold uppercase tracking-wider text-[#777777] px-2">
                <span>Player</span>
                <div className="flex items-center gap-6">
                  <span className="w-24 text-center">Chip Used</span>
                  <span className="w-20 text-right">Points</span>
                </div>
              </div>

              {homeMembers.length === 0 ? (
                <p className="text-center py-6 text-xs text-[#888888] italic">
                  No players found in {homeGroup?.name || "Home Team"} roster.
                </p>
              ) : (
                homeMembers.map((m) => {
                  const score = memberScores[m.id] || { points: 0, chip: null };

                  return (
                    <div
                      key={m.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                        m.isAdmin
                          ? "bg-amber-50/40 border-amber-200/60"
                          : "bg-[#FAFAFA] border-[#EBEBEB] hover:bg-[#F5F5F5]"
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#1F1F1F] truncate">
                            {m.fplName}
                          </span>
                          {m.isAdmin && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                              <Shield className="h-2.5 w-2.5 text-amber-600" />
                              <span>Admin (Excluded)</span>
                            </span>
                          )}
                        </div>
                        {m.fplTeamName && (
                          <p className="text-[11px] text-[#777777] truncate">
                            {m.fplTeamName}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <select
                          value={score.chip || "none"}
                          onChange={(e) => handleChipChange(m.id, e.target.value)}
                          className="h-8 rounded-lg border border-[#E0E0E0] bg-white px-2 text-xs font-medium text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#37003C]"
                        >
                          <option value="none">No Chip</option>
                          <option value="bboost">Bench Boost (BB)</option>
                          <option value="3xc">Triple Captain (3TC)</option>
                          <option value="freehit">Free Hit (FH)</option>
                          <option value="wildcard">Wildcard (WC)</option>
                        </select>

                        <div className="w-20">
                          <Input
                            type="number"
                            min={-50}
                            max={500}
                            value={score.points}
                            onChange={(e) => handlePointChange(m.id, e.target.value)}
                            className="h-8 text-xs font-bold text-right bg-white border-[#E0E0E0] focus-visible:ring-[#37003C]"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>

            {/* Away Tab Content */}
            <TabsContent value="away" className="mt-4 space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#E5E5E5] text-[11px] font-bold uppercase tracking-wider text-[#777777] px-2">
                <span>Player</span>
                <div className="flex items-center gap-6">
                  <span className="w-24 text-center">Chip Used</span>
                  <span className="w-20 text-right">Points</span>
                </div>
              </div>

              {awayMembers.length === 0 ? (
                <p className="text-center py-6 text-xs text-[#888888] italic">
                  No players found in {awayGroup?.name || "Away Team"} roster.
                </p>
              ) : (
                awayMembers.map((m) => {
                  const score = memberScores[m.id] || { points: 0, chip: null };

                  return (
                    <div
                      key={m.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                        m.isAdmin
                          ? "bg-amber-50/40 border-amber-200/60"
                          : "bg-[#FAFAFA] border-[#EBEBEB] hover:bg-[#F5F5F5]"
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#1F1F1F] truncate">
                            {m.fplName}
                          </span>
                          {m.isAdmin && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                              <Shield className="h-2.5 w-2.5 text-amber-600" />
                              <span>Admin (Excluded)</span>
                            </span>
                          )}
                        </div>
                        {m.fplTeamName && (
                          <p className="text-[11px] text-[#777777] truncate">
                            {m.fplTeamName}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <select
                          value={score.chip || "none"}
                          onChange={(e) => handleChipChange(m.id, e.target.value)}
                          className="h-8 rounded-lg border border-[#E0E0E0] bg-white px-2 text-xs font-medium text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#37003C]"
                        >
                          <option value="none">No Chip</option>
                          <option value="bboost">Bench Boost (BB)</option>
                          <option value="3xc">Triple Captain (3TC)</option>
                          <option value="freehit">Free Hit (FH)</option>
                          <option value="wildcard">Wildcard (WC)</option>
                        </select>

                        <div className="w-20">
                          <Input
                            type="number"
                            min={-50}
                            max={500}
                            value={score.points}
                            onChange={(e) => handlePointChange(m.id, e.target.value)}
                            className="h-8 text-xs font-bold text-right bg-white border-[#E0E0E0] focus-visible:ring-[#37003C]"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>
          </Tabs>

          {/* Match Status Selection */}
          <div className="p-3 rounded-xl border border-[#EEEEEE] bg-[#FBFBFB] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#1F1F1F]">Match Status</span>
              <p className="text-[11px] text-[#666666]">
                Marking as Completed updates league standings and knockout progression.
              </p>
            </div>
            <select
              value={matchStatus}
              onChange={(e) =>
                setMatchStatus(e.target.value as "COMPLETED" | "IN_PROGRESS")
              }
              className="h-8 rounded-lg border border-[#E0E0E0] bg-white px-2.5 text-xs font-semibold text-[#1F1F1F]"
            >
              <option value="COMPLETED">Completed</option>
              <option value="IN_PROGRESS">In Progress (Live)</option>
            </select>
          </div>

          <DialogFooter className="p-0 pt-3 border-t border-[#E5E5E5] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="h-9 px-4 text-xs font-semibold text-[#555555] border-[#E5E5E5] cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-9 px-4 text-xs font-bold bg-[#37003C] hover:bg-[#5A0A63] text-white rounded-[8px] gap-1.5 shadow-xs cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#00FF87]" />
              ) : (
                <Check className="h-4 w-4 text-[#00FF87]" />
              )}
              <span>{loading ? "Saving Scores..." : "Save Scores"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
