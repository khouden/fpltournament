"use client";

import { useState } from "react";
import {
  createRoundAction,
  deleteRoundAction,
  createMatchAction,
  updateMatchAction,
  deleteMatchAction,
  validateScheduleAction,
  generateRoundRobinScheduleAction,
} from "@/lib/schedule-actions";
import {
  recalculateMatchAction,
  finalizeMatchAction,
  recalculateAllScoresAction,
} from "@/lib/scoring-actions";
import {
  Zap,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Plus,
  Trash2,
  Loader2,
  Calendar,
  ExternalLink,
  Lock,
  ChevronDown,
  ChevronUp,
  Trophy,
  Layers,
  Check,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export interface Group {
  id: string;
  name: string;
  logo?: string | null;
}

export interface Match {
  id: string;
  matchNumber: number;
  status: string;
  homeGroupId: string | null;
  awayGroupId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  result: string | null;
  winnerId: string | null;
}

export interface Round {
  id: string;
  name: string | null;
  roundNumber: number;
  gameweek: number;
  matches: Match[];
}

export interface ScheduleBuilderProps {
  tournamentId: string;
  initialRounds: Round[];
  groups: Group[];
}

export function ScheduleBuilder({
  tournamentId,
  initialRounds,
  groups,
}: ScheduleBuilderProps) {
  const [rounds, setRounds] = useState<Round[]>(initialRounds);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [validationSuccess, setValidationSuccess] = useState(false);

  // Auto-generate round-robin state
  const [showAutoGenerate, setShowAutoGenerate] = useState(false);
  const [startGW, setStartGW] = useState(1);
  const [confirmGenerateOpen, setConfirmGenerateOpen] = useState(false);

  // Bulk recalculation confirmation state
  const [confirmRecalcAllOpen, setConfirmRecalcAllOpen] = useState(false);

  // Deletion confirmation states
  const [roundToDelete, setRoundToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [matchToDelete, setMatchToDelete] = useState<{
    id: string;
    matchNumber: number;
    roundId: string;
  } | null>(null);

  // New round form state
  const [newRoundName, setNewRoundName] = useState("");
  const [newRoundGW, setNewRoundGW] = useState(
    rounds.length > 0 ? Math.max(...rounds.map((r) => r.gameweek)) + 1 : 1
  );
  const [showAddRound, setShowAddRound] = useState(false);

  // Collapsed rounds tracking
  const [collapsedRounds, setCollapsedRounds] = useState<Record<string, boolean>>(
    {}
  );

  const toggleRoundCollapse = (roundId: string) => {
    setCollapsedRounds((prev) => ({
      ...prev,
      [roundId]: !prev[roundId],
    }));
  };

  const groupById = (id: string | null): Group | undefined => {
    if (!id) return undefined;
    return groups.find((g) => g.id === id);
  };

  const groupNameById = (id: string | null): string => {
    if (!id) return "TBD";
    return groupById(id)?.name || "Unknown";
  };

  const showMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };

  // Operational metrics
  const allMatches = rounds.flatMap((r) => r.matches);
  const totalRounds = rounds.length;
  const totalFixtures = allMatches.length;
  const completedCount = allMatches.filter(
    (m) => m.status === "COMPLETED" || m.status === "FINALIZED"
  ).length;
  const finalizedCount = allMatches.filter(
    (m) => m.status === "FINALIZED"
  ).length;

  // Expected rounds for round-robin calculation
  const expectedRounds =
    groups.length > 1
      ? groups.length % 2 === 0
        ? groups.length - 1
        : groups.length
      : 0;

  // ---- Auto-Generate Round-Robin Schedule ----
  const handleInitiateAutoGenerate = () => {
    if (rounds.length > 0) {
      setConfirmGenerateOpen(true);
    } else {
      executeAutoGenerate();
    }
  };

  const executeAutoGenerate = async () => {
    setConfirmGenerateOpen(false);
    setLoading("auto-generate");
    setError("");
    setValidationIssues([]);
    setValidationSuccess(false);

    const result = await generateRoundRobinScheduleAction(
      tournamentId,
      startGW
    );
    if (result.success) {
      showMsg(result.message || "Round-robin schedule generated successfully!");
      setShowAutoGenerate(false);
      window.location.reload();
    } else {
      setError(result.error || "Failed to generate schedule");
    }
    setLoading(null);
  };

  // ---- Round CRUD ----
  const handleAddRound = async () => {
    setError("");
    setLoading("add-round");
    const result = await createRoundAction(
      tournamentId,
      newRoundGW,
      newRoundName.trim() || undefined
    );
    if (result.success && result.round) {
      setRounds((prev) => [
        ...prev,
        { ...result.round!, matches: [] } as Round,
      ]);
      setShowAddRound(false);
      setNewRoundName("");
      setNewRoundGW(newRoundGW + 1);
      showMsg("Round created successfully");
    } else {
      setError(result.error || "Failed to create round");
    }
    setLoading(null);
  };

  const executeDeleteRound = async () => {
    if (!roundToDelete) return;
    const { id } = roundToDelete;
    setRoundToDelete(null);
    setError("");
    setLoading(`del-round-${id}`);

    const result = await deleteRoundAction(id, tournamentId);
    if (result.success) {
      setRounds((prev) => prev.filter((r) => r.id !== id));
      showMsg("Round and fixtures deleted successfully");
    } else {
      setError(result.error || "Failed to delete round");
    }
    setLoading(null);
  };

  // ---- Match CRUD ----
  const handleAddMatch = async (roundId: string) => {
    setError("");
    setLoading(`add-match-${roundId}`);
    const result = await createMatchAction(roundId, tournamentId, {});
    if (result.success && result.match) {
      setRounds((prev) =>
        prev.map((r) =>
          r.id === roundId
            ? { ...r, matches: [...r.matches, result.match as Match] }
            : r
        )
      );
      showMsg("Match added to round");
    } else {
      setError(result.error || "Failed to add match");
    }
    setLoading(null);
  };

  const handleUpdateMatch = async (
    matchId: string,
    side: "home" | "away",
    groupId: string
  ) => {
    setError("");
    const data =
      side === "home"
        ? { homeGroupId: groupId || null }
        : { awayGroupId: groupId || null };

    const result = await updateMatchAction(matchId, tournamentId, data);
    if (result.success && result.match) {
      setRounds((prev) =>
        prev.map((r) => ({
          ...r,
          matches: r.matches.map((m) =>
            m.id === matchId ? (result.match as Match) : m
          ),
        }))
      );
    } else {
      setError(result.error || "Failed to update match pairing");
    }
  };

  const executeDeleteMatch = async () => {
    if (!matchToDelete) return;
    const { id, roundId } = matchToDelete;
    setMatchToDelete(null);
    setError("");
    setLoading(`del-match-${id}`);

    const result = await deleteMatchAction(id, tournamentId);
    if (result.success) {
      setRounds((prev) =>
        prev.map((r) =>
          r.id === roundId
            ? { ...r, matches: r.matches.filter((m) => m.id !== id) }
            : r
        )
      );
      showMsg("Match removed from schedule");
    } else {
      setError(result.error || "Failed to delete match");
    }
    setLoading(null);
  };

  // ---- Scoring Actions ----
  const handleRecalculate = async (matchId: string) => {
    setLoading(`calc-${matchId}`);
    setError("");
    const result = await recalculateMatchAction(matchId, tournamentId);
    if (result.success) {
      showMsg("Match scores calculated from official FPL data!");
      window.location.reload();
    } else {
      setError(
        result.error ||
          "Failed to calculate match score. Please verify FPL connection."
      );
    }
    setLoading(null);
  };

  const handleFinalize = async (matchId: string) => {
    setLoading(`fin-${matchId}`);
    setError("");
    const result = await finalizeMatchAction(matchId, tournamentId);
    if (result.success) {
      showMsg("Match result finalized and locked!");
      window.location.reload();
    } else {
      setError(result.error || "Failed to finalize match");
    }
    setLoading(null);
  };

  const executeRecalculateAll = async () => {
    setConfirmRecalcAllOpen(false);
    setLoading("recalc-all");
    setError("");
    const result = await recalculateAllScoresAction(tournamentId);
    if (result.success) {
      showMsg(
        result.count !== undefined
          ? `${result.count} active match score(s) updated from official FPL data!`
          : "All eligible match scores recalculated successfully!"
      );
      window.location.reload();
    } else {
      setError(
        result.error ||
          "Failed to recalculate scores. Please verify FPL connection."
      );
    }
    setLoading(null);
  };

  const handleValidate = async () => {
    setLoading("validate");
    setValidationIssues([]);
    setValidationSuccess(false);
    setError("");
    const result = await validateScheduleAction(tournamentId);
    if (result.isValid) {
      setValidationSuccess(true);
      showMsg("Schedule is fully valid and ready for tournament play!");
    } else {
      setValidationIssues(result.issues);
    }
    setLoading(null);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Schedule Operational Metrics Overview */}
      <section aria-label="Schedule Overview Metrics">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-[14px] border border-[#E5E5E5] bg-white p-4 sm:p-5 shadow-fpl-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#777777]">
                Rounds
              </span>
              <p className="text-2xl sm:text-3xl font-black text-[#1F1F1F] tracking-tight">
                {totalRounds}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#37003C]/5 text-[#37003C] flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
          </div>

          <div className="rounded-[14px] border border-[#E5E5E5] bg-white p-4 sm:p-5 shadow-fpl-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#777777]">
                Fixtures
              </span>
              <p className="text-2xl sm:text-3xl font-black text-[#1F1F1F] tracking-tight">
                {totalFixtures}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#37003C]/5 text-[#37003C] flex items-center justify-center shrink-0">
              <Trophy className="h-5 w-5" />
            </div>
          </div>

          <div className="rounded-[14px] border border-[#E5E5E5] bg-white p-4 sm:p-5 shadow-fpl-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#777777]">
                Completed
              </span>
              <p className="text-2xl sm:text-3xl font-black text-[#5A0A63] tracking-tight">
                {completedCount}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#5A0A63]/10 text-[#5A0A63] flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          <div className="rounded-[14px] border border-[#E5E5E5] bg-white p-4 sm:p-5 shadow-fpl-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#777777]">
                Finalized
              </span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
                {finalizedCount}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Action Toolbar */}
      <section
        aria-label="Schedule Actions Toolbar"
        className="rounded-[14px] border border-[#E5E5E5] bg-white p-4 sm:p-5 shadow-fpl-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
          {/* Left Action Group */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Primary Action: Auto-Generate Round-Robin */}
            <Button
              onClick={() => setShowAutoGenerate((prev) => !prev)}
              disabled={groups.length < 2}
              className="h-10 px-4 text-xs sm:text-sm font-bold bg-[#37003C] text-white hover:bg-[#5A0A63] shadow-xs rounded-[8px] transition-colors gap-2"
              title={
                groups.length < 2
                  ? "At least 2 groups required to auto-generate"
                  : "Auto-generate balanced round-robin fixtures"
              }
            >
              <Zap className="h-4 w-4 text-[#00FF87] fill-[#00FF87]" />
              <span>Auto-Generate Round-Robin</span>
              {showAutoGenerate ? (
                <ChevronUp className="h-3.5 w-3.5 ml-1 opacity-70" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
              )}
            </Button>

            {/* Secondary Action: Add Round Manually */}
            <Button
              variant="outline"
              onClick={() => setShowAddRound((prev) => !prev)}
              className="h-10 px-3.5 text-xs sm:text-sm font-semibold text-[#1F1F1F] border-[#E5E5E5] bg-white hover:bg-[#F7F7F7] hover:border-[#37003C]/40 hover:text-[#37003C] rounded-[8px] transition-colors gap-1.5 shadow-2xs"
            >
              <Plus className="h-4 w-4 text-[#37003C]" />
              <span>Add Round</span>
            </Button>

            {/* Validation Action */}
            <Button
              variant="outline"
              onClick={handleValidate}
              disabled={loading === "validate"}
              className="h-10 px-3.5 text-xs sm:text-sm font-semibold text-[#37003C] border-[#37003C]/20 bg-[#37003C]/5 hover:bg-[#37003C]/10 hover:border-[#37003C]/30 rounded-[8px] transition-colors gap-1.5 shadow-2xs"
            >
              {loading === "validate" ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#37003C]" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-[#37003C]" />
              )}
              <span>
                {loading === "validate" ? "Validating..." : "Validate Schedule"}
              </span>
            </Button>
          </div>

          {/* Right Action Group: Bulk Recalculation */}
          <div className="shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#EEEEEE]">
            <Button
              variant="outline"
              onClick={() => setConfirmRecalcAllOpen(true)}
              disabled={loading === "recalc-all" || allMatches.length === 0}
              className="h-10 px-4 text-xs sm:text-sm font-semibold text-emerald-800 border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100 hover:border-emerald-400 rounded-[8px] transition-colors gap-2 shadow-2xs w-full lg:w-auto"
              title="Recalculate scores for all unfinalized matches"
            >
              {loading === "recalc-all" ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
              ) : (
                <RefreshCw className="h-4 w-4 text-emerald-700" />
              )}
              <span>
                {loading === "recalc-all"
                  ? "Recalculating..."
                  : "Recalculate All"}
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* 3. Notifications & Validation States */}
      {error && (
        <Alert variant="destructive" className="animate-fpl-fade-in shadow-xs">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Operation Error</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="animate-fpl-fade-in shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Schedule Valid Banner */}
      {validationSuccess && validationIssues.length === 0 && (
        <div
          role="status"
          className="rounded-[12px] border border-emerald-300 bg-emerald-50/90 p-4 text-emerald-900 shadow-xs flex items-start gap-3 animate-fpl-fade-in"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-emerald-900">
              Schedule Valid
            </p>
            <p className="text-xs text-emerald-800">
              All fixtures, gameweeks, and group assignments are verified and
              ready for tournament play.
            </p>
          </div>
        </div>
      )}

      {/* Schedule Issues Banner */}
      {validationIssues.length > 0 && (
        <div
          role="alert"
          className="rounded-[12px] border border-amber-300 bg-amber-50/90 p-4 sm:p-5 text-amber-950 shadow-xs space-y-2.5 animate-fpl-fade-in"
        >
          <div className="flex items-center gap-2 text-amber-900">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <h4 className="text-sm font-bold">
              Schedule Issues ({validationIssues.length} found)
            </h4>
          </div>
          <p className="text-xs text-amber-900/80">
            Please resolve the following schedule requirements before
            publishing results:
          </p>
          <ul className="space-y-1.5 text-xs text-amber-950 list-disc list-inside bg-white/70 p-3 rounded-[8px] border border-amber-200">
            {validationIssues.map((issue, i) => (
              <li key={i} className="font-medium leading-relaxed">
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. Automated Round-Robin Generator Workspace (Collapsible) */}
      {showAutoGenerate && (
        <Card className="border-2 border-[#37003C]/20 bg-gradient-to-b from-[#37003C]/3 to-white p-5 sm:p-6 shadow-fpl-sm space-y-4 rounded-[14px] animate-fpl-slide-up">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-[#1F1F1F] flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#37003C] fill-[#00FF87]" />
              <span>Generate Round-Robin Schedule</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-[#666666] mt-1">
              Creates a balanced round-robin schedule for all participating
              groups. Rounds will be assigned to consecutive Gameweeks.
            </CardDescription>
          </div>

          <div className="grid sm:grid-cols-[auto_1fr] items-end gap-4 sm:gap-6 pt-1">
            <div className="space-y-1.5">
              <Label
                htmlFor="startGW"
                className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider"
              >
                Start Gameweek (GW)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="startGW"
                  type="number"
                  min={1}
                  max={38}
                  value={startGW}
                  onChange={(e) =>
                    setStartGW(
                      Math.max(1, Math.min(38, parseInt(e.target.value) || 1))
                    )
                  }
                  className="w-28 bg-white border-[#E5E5E5] font-bold text-center h-10"
                />
                <span className="text-xs text-[#777777] font-medium">
                  (GW 1–38)
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs text-[#555555]">
              {groups.length < 2 ? (
                <div className="inline-flex items-center gap-1.5 text-amber-800 font-semibold bg-amber-50 px-3 py-1.5 rounded-[6px] border border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>
                    You need at least 2 groups to create matches. Import groups
                    first.
                  </span>
                </div>
              ) : (
                <p className="bg-[#F7F7F7] p-2.5 rounded-[8px] border border-[#E5E5E5]">
                  Will generate{" "}
                  <strong className="text-[#1F1F1F]">
                    {expectedRounds} rounds
                  </strong>{" "}
                  from{" "}
                  <strong className="text-[#37003C]">GW {startGW}</strong> to{" "}
                  <strong className="text-[#37003C]">
                    GW {Math.min(38, startGW + expectedRounds - 1)}
                  </strong>{" "}
                  for {groups.length} participating groups.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#EEEEEE]">
            <Button
              onClick={handleInitiateAutoGenerate}
              disabled={loading === "auto-generate" || groups.length < 2}
              className="h-9 px-4 text-xs font-bold bg-[#37003C] text-white hover:bg-[#5A0A63] shadow-xs rounded-[8px] gap-2"
            >
              {loading === "auto-generate" ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#00FF87]" />
              ) : (
                <Zap className="h-4 w-4 text-[#00FF87]" />
              )}
              <span>
                {loading === "auto-generate"
                  ? "Generating Schedule..."
                  : "Generate Complete Schedule"}
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAutoGenerate(false)}
              className="h-9 px-3 text-xs font-semibold text-[#555555] border-[#E5E5E5]"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* 5. Manual Add Round Form (Inline) */}
      {showAddRound && (
        <Card className="border-2 border-dashed border-[#37003C]/30 bg-[#37003C]/5 p-4 sm:p-5 space-y-3 rounded-[14px] animate-fpl-slide-up">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-[#1F1F1F] flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#37003C]" />
              <span>Add Round Manually</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddRound(false)}
              className="h-7 px-2 text-xs text-[#777777] hover:text-[#1F1F1F]"
            >
              Close
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label
                htmlFor="newRoundName"
                className="text-xs font-semibold text-[#333333]"
              >
                Round Name (Optional)
              </Label>
              <Input
                id="newRoundName"
                type="text"
                placeholder={`e.g., Round ${rounds.length + 1}`}
                value={newRoundName}
                onChange={(e) => setNewRoundName(e.target.value)}
                className="bg-white border-[#E5E5E5] h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label
                htmlFor="newRoundGW"
                className="text-xs font-semibold text-[#333333]"
              >
                Gameweek (1–38) *
              </Label>
              <Input
                id="newRoundGW"
                type="number"
                min={1}
                max={38}
                value={newRoundGW}
                onChange={(e) =>
                  setNewRoundGW(
                    Math.max(1, Math.min(38, parseInt(e.target.value) || 1))
                  )
                }
                className="bg-white border-[#E5E5E5] h-9 text-xs font-semibold"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={handleAddRound}
              disabled={loading === "add-round"}
              className="h-8 px-3.5 text-xs font-bold bg-[#37003C] text-white hover:bg-[#5A0A63] rounded-[6px]"
            >
              {loading === "add-round" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Check className="h-3.5 w-3.5 mr-1.5" />
              )}
              <span>
                {loading === "add-round" ? "Creating..." : "Create Round"}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddRound(false)}
              className="h-8 px-3 text-xs font-semibold text-[#555555] border-[#E5E5E5]"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* 6. Rounds & Fixtures List */}
      <section aria-label="Rounds & Fixtures" className="space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#37003C]" />
            <h2 className="text-lg sm:text-xl font-extrabold text-[#1F1F1F] tracking-tight">
              Rounds &amp; Fixtures
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#777777]">
            {rounds.length} {rounds.length === 1 ? "Round" : "Rounds"}
          </span>
        </div>

        {rounds.length === 0 ? (
          /* Empty State: No rounds */
          <Card className="border-2 border-dashed border-[#E5E5E5] bg-white p-8 sm:p-12 text-center rounded-[14px]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#37003C]/5 text-[#37003C] mx-auto mb-3.5">
              <Calendar className="h-7 w-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#1F1F1F]">
              No Schedule Created Yet
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-[#666666] max-w-md mx-auto">
              Generate a balanced round-robin schedule automatically, or create
              rounds manually to build fixtures.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Button
                onClick={() => setShowAutoGenerate(true)}
                disabled={groups.length < 2}
                className="h-9 px-4 text-xs font-bold bg-[#37003C] text-white hover:bg-[#5A0A63] shadow-xs rounded-[8px] gap-2"
              >
                <Zap className="h-4 w-4 text-[#00FF87]" />
                <span>Auto-Generate Round-Robin</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddRound(true)}
                className="h-9 px-3.5 text-xs font-semibold text-[#1F1F1F] border-[#E5E5E5] hover:border-[#37003C]/40 hover:text-[#37003C] rounded-[8px]"
              >
                <Plus className="h-4 w-4 text-[#37003C]" />
                <span>Add Round</span>
              </Button>
            </div>
          </Card>
        ) : (
          /* Render Each Round */
          rounds
            .sort((a, b) => a.roundNumber - b.roundNumber)
            .map((round) => {
              const isCollapsed = !!collapsedRounds[round.id];
              return (
                <Card
                  key={round.id}
                  className="border border-[#E5E5E5] bg-white shadow-fpl-sm overflow-hidden rounded-[14px]"
                >
                  {/* Round Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E5E5] bg-[#FBFBFB] px-4 py-3 sm:px-5 sm:py-3.5">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleRoundCollapse(round.id)}
                        className="text-[#777777] hover:text-[#1F1F1F] p-0.5 rounded transition-colors"
                        aria-label={
                          isCollapsed
                            ? `Expand ${round.name || `Round ${round.roundNumber}`}`
                            : `Collapse ${round.name || `Round ${round.roundNumber}`}`
                        }
                      >
                        {isCollapsed ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </button>

                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-[#1F1F1F] text-sm sm:text-base leading-tight">
                            {round.name || `Round ${round.roundNumber}`}
                          </h3>
                          <span className="inline-flex items-center text-[10px] font-extrabold px-2 py-0.5 rounded-[4px] bg-[#37003C]/10 text-[#37003C]">
                            Gameweek {round.gameweek}
                          </span>
                          <span className="text-xs text-[#777777] font-medium">
                            · {round.matches.length}{" "}
                            {round.matches.length === 1 ? "Match" : "Matches"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Round Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddMatch(round.id)}
                        disabled={loading === `add-match-${round.id}`}
                        className="h-8 px-3 text-xs font-semibold text-[#37003C] border-[#37003C]/25 bg-white hover:bg-[#37003C]/5 rounded-[6px] gap-1.5 shadow-2xs"
                      >
                        {loading === `add-match-${round.id}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5 text-[#37003C]" />
                        )}
                        <span>Add Match</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setRoundToDelete({
                            id: round.id,
                            name: round.name || `Round ${round.roundNumber}`,
                          })
                        }
                        disabled={loading === `del-round-${round.id}`}
                        className="h-8 px-2.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-[6px] gap-1"
                        title="Delete round and fixtures"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  </div>

                  {/* Matches inside Round */}
                  {!isCollapsed && (
                    <div className="p-4 sm:p-5 space-y-4 bg-white">
                      {round.matches.length === 0 ? (
                        <div className="rounded-[10px] border border-dashed border-[#E5E5E5] p-6 text-center bg-[#FDFDFD]">
                          <p className="text-xs sm:text-sm text-[#777777] italic">
                            No fixtures in this round
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddMatch(round.id)}
                            className="mt-3 h-8 px-3 text-xs font-semibold text-[#37003C] border-[#E5E5E5] hover:bg-[#F7F7F7] gap-1.5"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add Match</span>
                          </Button>
                        </div>
                      ) : (
                        round.matches
                          .sort((a, b) => a.matchNumber - b.matchNumber)
                          .map((match) => {
                            const isFinalized = match.status === "FINALIZED";
                            const isCompleted = match.status === "COMPLETED";
                            const hasScores =
                              match.homeScore !== null &&
                              match.awayScore !== null;
                            const homeGroup = groupById(match.homeGroupId);
                            const awayGroup = groupById(match.awayGroupId);

                            return (
                              <article
                                key={match.id}
                                aria-label={`Match ${match.matchNumber}`}
                                className={`rounded-[12px] border transition-all p-4 sm:p-5 space-y-3.5 ${
                                  isFinalized
                                    ? "border-emerald-300/80 bg-emerald-500/5 shadow-2xs"
                                    : "border-[#E5E5E5] bg-white hover:border-[#37003C]/30 shadow-2xs"
                                }`}
                              >
                                {/* Match Top Bar */}
                                <div className="flex items-center justify-between border-b border-[#EEEEEE] pb-2.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-extrabold tracking-wider uppercase text-[#777777]">
                                      Match {match.matchNumber}
                                    </span>
                                    {isFinalized && (
                                      <span
                                        className="text-[10px] text-emerald-700 font-bold px-1.5 py-0.5 rounded bg-emerald-100/60"
                                        title="Finalized results are permanently locked"
                                      >
                                        Locked
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {/* Status Badge */}
                                    {isFinalized ? (
                                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-700 shadow-2xs">
                                        <Lock className="h-3 w-3 text-emerald-600" />
                                        <span>FINALIZED</span>
                                      </span>
                                    ) : isCompleted ? (
                                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#5A0A63]/30 bg-[#5A0A63]/10 px-2.5 py-0.5 text-xs font-bold text-[#5A0A63] shadow-2xs">
                                        <CheckCircle2 className="h-3 w-3 text-[#5A0A63]" />
                                        <span>COMPLETED</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700 shadow-2xs">
                                        <span>SCHEDULED</span>
                                      </span>
                                    )}

                                    {/* Delete Match Button */}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        setMatchToDelete({
                                          id: match.id,
                                          matchNumber: match.matchNumber,
                                          roundId: round.id,
                                        })
                                      }
                                      className="h-7 w-7 text-[#888888] hover:text-red-600 hover:bg-red-50 rounded-[4px]"
                                      title="Delete fixture"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Fixture Scoreboard (Mini FPL Scoreboard) */}
                                <div className="space-y-3">
                                  {/* Desktop Layout (>= 768px): Side-by-Side */}
                                  <div className="hidden md:grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                                    {/* Home Team */}
                                    <div className="flex items-center justify-end gap-3 text-right">
                                      {match.homeGroupId && (
                                        <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#37003C]/5 text-[#37003C] border border-[#37003C]/10 shrink-0">
                                          HOME
                                        </span>
                                      )}

                                      {/* Dropdown selector for unplayed or display with logo */}
                                      <div className="w-full max-w-[240px]">
                                        <select
                                          value={match.homeGroupId || ""}
                                          onChange={(e) =>
                                            handleUpdateMatch(
                                              match.id,
                                              "home",
                                              e.target.value
                                            )
                                          }
                                          disabled={isFinalized}
                                          className={`w-full rounded-[8px] border px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#1F1F1F] bg-white transition-colors focus:outline-none focus:ring-1 focus:ring-[#37003C] ${
                                            isFinalized
                                              ? "border-transparent bg-transparent cursor-default font-bold"
                                              : "border-[#E5E5E5] hover:border-[#37003C]/40"
                                          }`}
                                          aria-label={`Select home group for match ${match.matchNumber}`}
                                        >
                                          <option value="">
                                            Select Home Group...
                                          </option>
                                          {groups.map((g) => (
                                            <option key={g.id} value={g.id}>
                                              {g.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      {homeGroup?.logo ? (
                                        <img
                                          src={homeGroup.logo}
                                          alt={homeGroup.name}
                                          className="h-8 w-8 object-contain shrink-0 rounded"
                                        />
                                      ) : (
                                        <div className="h-8 w-8 rounded-lg bg-[#37003C]/5 text-[#37003C] flex items-center justify-center font-bold text-xs shrink-0">
                                          {homeGroup ? homeGroup.name.slice(0, 2).toUpperCase() : "H"}
                                        </div>
                                      )}
                                    </div>

                                    {/* Central Scoreboard / VS */}
                                    <div className="flex flex-col items-center justify-center px-3 min-w-[130px]">
                                      {hasScores ? (
                                        <div className="text-center space-y-1">
                                          <div className="inline-flex items-center gap-2.5 bg-[#F7F7F7] px-4 py-1.5 rounded-[8px] border border-[#E5E5E5] shadow-2xs">
                                            <span
                                              className={`text-xl font-black font-mono ${
                                                match.result === "HOME_WIN"
                                                  ? "text-[#37003C]"
                                                  : "text-[#555555]"
                                              }`}
                                            >
                                              {match.homeScore}
                                            </span>
                                            <span className="text-[#999999] font-bold">
                                              —
                                            </span>
                                            <span
                                              className={`text-xl font-black font-mono ${
                                                match.result === "AWAY_WIN"
                                                  ? "text-[#37003C]"
                                                  : "text-[#555555]"
                                              }`}
                                            >
                                              {match.awayScore}
                                            </span>
                                          </div>

                                          {match.result && (
                                            <div>
                                              <span
                                                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-[4px] ${
                                                  match.result === "DRAW"
                                                    ? "bg-amber-100/80 text-amber-900 border border-amber-300/60"
                                                    : "bg-emerald-100/80 text-emerald-900 border border-emerald-300/60"
                                                }`}
                                              >
                                                {match.result === "DRAW"
                                                  ? "DRAW"
                                                  : match.result === "HOME_WIN"
                                                    ? `${groupNameById(match.homeGroupId)} WIN`
                                                    : `${groupNameById(match.awayGroupId)} WIN`}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="flex flex-col items-center gap-1">
                                          <span className="text-xs font-black text-[#5A0A63] bg-[#5A0A63]/10 px-2.5 py-0.5 rounded-full">
                                            VS
                                          </span>
                                          <span className="text-[11px] font-semibold text-[#888888]">
                                            Not Calculated
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Away Team */}
                                    <div className="flex items-center justify-start gap-3 text-left">
                                      {awayGroup?.logo ? (
                                        <img
                                          src={awayGroup.logo}
                                          alt={awayGroup.name}
                                          className="h-8 w-8 object-contain shrink-0 rounded"
                                        />
                                      ) : (
                                        <div className="h-8 w-8 rounded-lg bg-[#37003C]/5 text-[#37003C] flex items-center justify-center font-bold text-xs shrink-0">
                                          {awayGroup ? awayGroup.name.slice(0, 2).toUpperCase() : "A"}
                                        </div>
                                      )}

                                      <div className="w-full max-w-[240px]">
                                        <select
                                          value={match.awayGroupId || ""}
                                          onChange={(e) =>
                                            handleUpdateMatch(
                                              match.id,
                                              "away",
                                              e.target.value
                                            )
                                          }
                                          disabled={isFinalized}
                                          className={`w-full rounded-[8px] border px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#1F1F1F] bg-white transition-colors focus:outline-none focus:ring-1 focus:ring-[#37003C] ${
                                            isFinalized
                                              ? "border-transparent bg-transparent cursor-default font-bold"
                                              : "border-[#E5E5E5] hover:border-[#37003C]/40"
                                          }`}
                                          aria-label={`Select away group for match ${match.matchNumber}`}
                                        >
                                          <option value="">
                                            Select Away Group...
                                          </option>
                                          {groups.map((g) => (
                                            <option key={g.id} value={g.id}>
                                              {g.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      {match.awayGroupId && (
                                        <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 shrink-0">
                                          AWAY
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Mobile Layout (< 768px): Stacked Vertically */}
                                  <div className="md:hidden space-y-2.5">
                                    {/* Home Team Row */}
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between text-xs font-semibold text-[#666666]">
                                        <span>Home Team</span>
                                        <span className="text-[10px] font-bold text-[#37003C] bg-[#37003C]/5 px-1 rounded">
                                          HOME
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {homeGroup?.logo && (
                                          <img
                                            src={homeGroup.logo}
                                            alt=""
                                            className="h-6 w-6 object-contain shrink-0"
                                          />
                                        )}
                                        <select
                                          value={match.homeGroupId || ""}
                                          onChange={(e) =>
                                            handleUpdateMatch(
                                              match.id,
                                              "home",
                                              e.target.value
                                            )
                                          }
                                          disabled={isFinalized}
                                          className="w-full rounded-[8px] border border-[#E5E5E5] bg-white px-3 py-1.5 text-xs font-semibold text-[#1F1F1F]"
                                        >
                                          <option value="">
                                            Select Home Group...
                                          </option>
                                          {groups.map((g) => (
                                            <option key={g.id} value={g.id}>
                                              {g.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>

                                    {/* Mobile VS / Scoreboard Divider */}
                                    <div className="flex flex-col items-center justify-center py-1">
                                      {hasScores ? (
                                        <div className="text-center space-y-1">
                                          <div className="inline-flex items-center gap-3 bg-[#F7F7F7] px-4 py-1 rounded-[6px] border border-[#E5E5E5]">
                                            <span className="text-lg font-black font-mono text-[#1F1F1F]">
                                              {match.homeScore}
                                            </span>
                                            <span className="text-[#999999] font-bold">
                                              —
                                            </span>
                                            <span className="text-lg font-black font-mono text-[#1F1F1F]">
                                              {match.awayScore}
                                            </span>
                                          </div>
                                          {match.result && (
                                            <div>
                                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                                                {match.result === "DRAW"
                                                  ? "DRAW"
                                                  : match.result === "HOME_WIN"
                                                    ? `${groupNameById(match.homeGroupId)} WIN`
                                                    : `${groupNameById(match.awayGroupId)} WIN`}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-xs font-black text-[#5A0A63] bg-[#5A0A63]/10 px-3 py-0.5 rounded-full">
                                          VS
                                        </span>
                                      )}
                                    </div>

                                    {/* Away Team Row */}
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between text-xs font-semibold text-[#666666]">
                                        <span>Away Team</span>
                                        <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-1 rounded">
                                          AWAY
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {awayGroup?.logo && (
                                          <img
                                            src={awayGroup.logo}
                                            alt=""
                                            className="h-6 w-6 object-contain shrink-0"
                                          />
                                        )}
                                        <select
                                          value={match.awayGroupId || ""}
                                          onChange={(e) =>
                                            handleUpdateMatch(
                                              match.id,
                                              "away",
                                              e.target.value
                                            )
                                          }
                                          disabled={isFinalized}
                                          className="w-full rounded-[8px] border border-[#E5E5E5] bg-white px-3 py-1.5 text-xs font-semibold text-[#1F1F1F]"
                                        >
                                          <option value="">
                                            Select Away Group...
                                          </option>
                                          {groups.map((g) => (
                                            <option key={g.id} value={g.id}>
                                              {g.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Match Actions Footer */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#EEEEEE]">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {/* Primary Operational: Recalculate Score */}
                                    {match.homeGroupId &&
                                      match.awayGroupId &&
                                      !isFinalized && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleRecalculate(match.id)
                                          }
                                          disabled={
                                            loading === `calc-${match.id}`
                                          }
                                          className="h-8 px-3 text-xs font-semibold text-[#37003C] border-[#37003C]/20 bg-white hover:bg-[#37003C]/5 hover:border-[#37003C]/40 rounded-[6px] gap-1.5 shadow-2xs"
                                        >
                                          {loading === `calc-${match.id}` ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#37003C]" />
                                          ) : (
                                            <RefreshCw className="h-3.5 w-3.5 text-[#37003C]" />
                                          )}
                                          <span>
                                            {loading === `calc-${match.id}`
                                              ? "Recalculating..."
                                              : hasScores
                                                ? "Recalculate Score"
                                                : "Calculate Score"}
                                          </span>
                                        </Button>
                                      )}

                                    {/* Secondary: Finalize Match (for completed matches) */}
                                    {isCompleted && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleFinalize(match.id)}
                                        disabled={loading === `fin-${match.id}`}
                                        className="h-8 px-3 text-xs font-bold text-emerald-800 border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 rounded-[6px] gap-1.5 shadow-2xs"
                                      >
                                        {loading === `fin-${match.id}` ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-700" />
                                        ) : (
                                          <Check className="h-3.5 w-3.5 text-emerald-700" />
                                        )}
                                        <span>
                                          {loading === `fin-${match.id}`
                                            ? "Finalizing..."
                                            : "Finalize Match"}
                                        </span>
                                      </Button>
                                    )}

                                    {/* Finalized Locked Indicator */}
                                    {isFinalized && (
                                      <span className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-[6px] cursor-default">
                                        <Lock className="h-3.5 w-3.5 text-emerald-600" />
                                        <span>Finalized</span>
                                      </span>
                                    )}

                                    {/* Tertiary: View Public Match */}
                                    {hasScores && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                        className="h-8 px-3 text-xs font-semibold text-[#555555] border-[#E5E5E5] bg-white hover:bg-[#F7F7F7] hover:text-[#1F1F1F] rounded-[6px] gap-1.5 shadow-2xs"
                                      >
                                        <Link
                                          href={`/matches/${match.id}`}
                                          target="_blank"
                                        >
                                          <ExternalLink className="h-3.5 w-3.5 text-[#777777]" />
                                          <span>View Match</span>
                                        </Link>
                                      </Button>
                                    )}
                                  </div>

                                  <span className="text-[11px] text-[#888888] font-medium hidden sm:inline">
                                    Official FPL GW{round.gameweek} rules
                                  </span>
                                </div>
                              </article>
                            );
                          })
                      )}
                    </div>
                  )}
                </Card>
              );
            })
        )}
      </section>

      {/* ========================================================================= */}
      {/* 7. Confirmation Dialogs (AlertDialogs)                                    */}
      {/* ========================================================================= */}

      {/* Auto-Generate Replace Schedule Confirmation */}
      <AlertDialog
        open={confirmGenerateOpen}
        onOpenChange={setConfirmGenerateOpen}
      >
        <AlertDialogContent className="rounded-[14px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-extrabold text-[#1F1F1F] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span>Generate New Schedule?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-[#555555]">
              Auto-generating will replace all existing rounds and matches with
              a fresh round-robin schedule. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-[8px] text-xs font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAutoGenerate}
              className="bg-[#E9007F] hover:bg-[#D00072] text-white rounded-[8px] text-xs font-bold"
            >
              Replace &amp; Generate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Recalculate Confirmation */}
      <AlertDialog
        open={confirmRecalcAllOpen}
        onOpenChange={setConfirmRecalcAllOpen}
      >
        <AlertDialogContent className="rounded-[14px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-extrabold text-[#1F1F1F] flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-emerald-600" />
              <span>Recalculate All Matches?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-[#555555]">
              Recalculate all eligible tournament matches using the latest FPL
              data. Finalized matches are locked and will be protected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-[8px] text-xs font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeRecalculateAll}
              className="bg-[#37003C] hover:bg-[#5A0A63] text-white rounded-[8px] text-xs font-bold"
            >
              Recalculate All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Round Confirmation */}
      <AlertDialog
        open={!!roundToDelete}
        onOpenChange={(open) => !open && setRoundToDelete(null)}
      >
        <AlertDialogContent className="rounded-[14px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-extrabold text-[#1F1F1F] flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              <span>Delete Round?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-[#555555]">
              Deleting this round will also remove all fixtures inside it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-[8px] text-xs font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDeleteRound}
              className="bg-red-600 hover:bg-red-700 text-white rounded-[8px] text-xs font-bold"
            >
              Delete Round
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Match Confirmation */}
      <AlertDialog
        open={!!matchToDelete}
        onOpenChange={(open) => !open && setMatchToDelete(null)}
      >
        <AlertDialogContent className="rounded-[14px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-extrabold text-[#1F1F1F] flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              <span>Delete Match?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-[#555555]">
              This will remove this fixture from the tournament schedule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-[8px] text-xs font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDeleteMatch}
              className="bg-red-600 hover:bg-red-700 text-white rounded-[8px] text-xs font-bold"
            >
              Delete Match
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
