"use client";

import { useState, useEffect, useMemo, useTransition, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  createRoundAction,
  deleteRoundAction,
  createMatchAction,
  updateMatchAction,
  deleteMatchAction,
  validateScheduleAction,
  generateRoundRobinScheduleAction,
  swapMatchSidesAction,
  autoPairRemainingAction,
  duplicateRoundAsReverseAction,
  fillRoundWithEmptyMatchesAction,
} from "@/lib/schedule-actions";
import {
  recalculateMatchAction,
  finalizeMatchAction,
  recalculateAllScoresAction,
  recalculateRoundScoresAction,
} from "@/lib/scoring-actions";
import {
  ManualMatchScoreModal,
  type MatchGroupData,
  type MatchScoreData,
} from "./manual-match-score-modal";
import { SearchableTeamSelect } from "@/components/searchable-team-select";
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
  Clock,
  Pencil,
  ArrowLeftRight,
  Copy,
  Sparkles,
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

export interface GroupMember {
  id: string;
  fplName: string;
  fplTeamName: string | null;
  fplId: number;
  isAdmin: boolean;
  isManual?: boolean;
}

export interface Group {
  id: string;
  name: string;
  logo?: string | null;
  isManual?: boolean;
  members?: GroupMember[];
}

export interface MatchScore {
  memberId: string;
  gameweekPoints: number;
  activeChip: string | null;
  isExcluded: boolean;
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
  scores?: MatchScore[];
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

function subscribeToStorage(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("fpl_collapsed_rounds_change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("fpl_collapsed_rounds_change", callback);
  };
}

export function ScheduleBuilder({
  tournamentId,
  initialRounds,
  groups,
}: ScheduleBuilderProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [prevInitialRounds, setPrevInitialRounds] = useState(initialRounds);
  const [rounds, setRounds] = useState<Round[]>(initialRounds);

  // Sync internal rounds when initialRounds prop changes from server refresh
  if (initialRounds !== prevInitialRounds) {
    setPrevInitialRounds(initialRounds);
    setRounds(initialRounds);
  }

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [validationSuccess, setValidationSuccess] = useState(false);
  const [isDeadlineActive, setIsDeadlineActive] = useState(false);
  const [deadlineReason, setDeadlineReason] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/fpl/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.isDeadline) {
          setIsDeadlineActive(true);
          setDeadlineReason(data.reason || "FPL Gameweek deadline in progress");
        } else {
          setIsDeadlineActive(false);
          setDeadlineReason(null);
        }
      })
      .catch(() => {});
  }, []);

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


  // Manual Score Entry Modal state
  const [activeScoreModalMatch, setActiveScoreModalMatch] = useState<{
    match: Match;
    round: Round;
  } | null>(null);

  // Click-to-pair state: holds the roundId and first team selected
  const [activePairing, setActivePairing] = useState<{
    roundId: string;
    groupId: string;
  } | null>(null);

  // Duplicate round as reverse fixtures state
  const [duplicateRoundState, setDuplicateRoundState] = useState<{
    roundId: string;
    roundName: string;
    gameweek: number;
  } | null>(null);
  const [duplicateTargetGW, setDuplicateTargetGW] = useState<number>(1);

  // Collapsed rounds tracking - persisted per tournament in localStorage via useSyncExternalStore
  const storageKey = `fpl_tournament_${tournamentId}_collapsed_rounds`;
  const collapsedSnapshot = useSyncExternalStore(
    subscribeToStorage,
    () =>
      typeof window !== "undefined"
        ? localStorage.getItem(storageKey) || "{}"
        : "{}",
    () => "{}"
  );

  const collapsedRounds = useMemo<Record<string, boolean>>(() => {
    try {
      const parsed = JSON.parse(collapsedSnapshot);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }, [collapsedSnapshot]);

  const updateStoredCollapsed = (next: Record<string, boolean>) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      window.dispatchEvent(new Event("fpl_collapsed_rounds_change"));
    } catch (e) {
      console.error("Failed to save collapsed rounds to localStorage", e);
    }
  };

  const toggleRoundCollapse = (roundId: string) => {
    const isCurrentlyCollapsed = !!collapsedRounds[roundId];
    if (isCurrentlyCollapsed) {
      // Expanding this round: minimize all other rounds to focus on this one
      const next: Record<string, boolean> = {};
      rounds.forEach((r) => {
        next[r.id] = true;
      });
      next[roundId] = false;
      updateStoredCollapsed(next);
    } else {
      // Minimizing this round
      const next = {
        ...collapsedRounds,
        [roundId]: true,
      };
      updateStoredCollapsed(next);
    }
  };

  const collapseAllRounds = () => {
    const next: Record<string, boolean> = {};
    rounds.forEach((r) => {
      next[r.id] = true;
    });
    updateStoredCollapsed(next);
  };

  const expandAllRounds = () => {
    updateStoredCollapsed({});
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
      updateStoredCollapsed({});
      startTransition(() => {
        router.refresh();
      });
    } else {
      setError(result.error || "Failed to generate schedule");
    }
    setLoading(null);
  };

  // ---- Round CRUD ----
  const handleAddRound = async () => {
    setError("");
    setLoading("add-round");

    const nextRoundNumber =
      rounds.length > 0
        ? Math.max(...rounds.map((r) => r.roundNumber)) + 1
        : 1;
    const nextGW =
      rounds.length > 0
        ? Math.min(38, Math.max(...rounds.map((r) => r.gameweek)) + 1)
        : 1;
    const roundName = `Round ${nextRoundNumber}`;

    const result = await createRoundAction(
      tournamentId,
      nextGW,
      roundName,
      nextRoundNumber
    );
    if (result.success && result.round) {
      const newRound = { ...result.round!, matches: [] } as Round;
      setRounds((prev) => [...prev, newRound]);

      // Minimize other rounds by default to focus on the newly created round
      const nextCollapsed: Record<string, boolean> = {};
      rounds.forEach((r) => {
        nextCollapsed[r.id] = true;
      });
      nextCollapsed[newRound.id] = false;
      updateStoredCollapsed(nextCollapsed);

      showMsg(`${roundName} created successfully`);

      // Smoothly scroll to the newly created round card
      setTimeout(() => {
        const el = document.getElementById(`round-${newRound.id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
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
      const next = { ...collapsedRounds };
      delete next[id];
      updateStoredCollapsed(next);
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

  // ---- Fast Scheduling Handlers ----
  const handleSelectPairingTeam = async (roundId: string, groupId: string) => {
    // If not currently selecting or selecting from another round, select this team as Team A
    if (!activePairing || activePairing.roundId !== roundId) {
      setActivePairing({ roundId, groupId });
      return;
    }

    // If clicking the same team, toggle off
    if (activePairing.groupId === groupId) {
      setActivePairing(null);
      return;
    }

    // Clicking Team B: Create match immediately!
    const homeGroupId = activePairing.groupId;
    const awayGroupId = groupId;
    setActivePairing(null);
    setLoading(`pair-${roundId}`);
    setError("");

    const homeGroup = groupById(homeGroupId);
    const awayGroup = groupById(awayGroupId);

    const result = await createMatchAction(roundId, tournamentId, {
      homeGroupId,
      awayGroupId,
    });

    if (result.success && result.match) {
      setRounds((prev) =>
        prev.map((r) =>
          r.id === roundId
            ? { ...r, matches: [...r.matches, result.match as Match] }
            : r
        )
      );
      showMsg(
        `Fixture paired: ${homeGroup?.name || "Team A"} vs ${
          awayGroup?.name || "Team B"
        }`
      );
    } else {
      setError(result.error || "Failed to pair teams");
    }
    setLoading(null);
  };

  const handleAutoPairRemaining = async (roundId: string) => {
    setError("");
    setLoading(`auto-pair-${roundId}`);
    setActivePairing(null);

    const result = await autoPairRemainingAction(roundId, tournamentId);
    if (result.success) {
      showMsg(result.message || "Remaining teams paired successfully!");
      startTransition(() => {
        router.refresh();
      });
    } else {
      setError(result.error || "Failed to auto-pair remaining teams");
    }
    setLoading(null);
  };

  const handleSwapSides = async (matchId: string) => {
    setError("");
    setLoading(`swap-${matchId}`);

    const result = await swapMatchSidesAction(matchId, tournamentId);
    if (result.success && result.match) {
      setRounds((prev) =>
        prev.map((r) => ({
          ...r,
          matches: r.matches.map((m) =>
            m.id === matchId ? (result.match as Match) : m
          ),
        }))
      );
      showMsg("Home and away teams swapped!");
    } else {
      setError(result.error || "Failed to swap teams");
    }
    setLoading(null);
  };

  const executeDuplicateRoundAsReverse = async () => {
    if (!duplicateRoundState) return;
    const { roundId } = duplicateRoundState;
    setDuplicateRoundState(null);
    setError("");
    setLoading(`dup-round-${roundId}`);

    const result = await duplicateRoundAsReverseAction(
      roundId,
      tournamentId,
      duplicateTargetGW
    );

    if (result.success && result.round) {
      const newRound = {
        ...result.round,
        matches: result.round.matches || [],
      } as Round;
      setRounds((prev) => [...prev, newRound]);

      // Focus on the newly duplicated round
      const nextCollapsed: Record<string, boolean> = {};
      rounds.forEach((r) => {
        nextCollapsed[r.id] = true;
      });
      nextCollapsed[newRound.id] = false;
      updateStoredCollapsed(nextCollapsed);

      showMsg(result.message || "Reverse fixtures round generated!");
      startTransition(() => {
        router.refresh();
      });

      setTimeout(() => {
        const el = document.getElementById(`round-${newRound.id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    } else {
      setError(result.error || "Failed to duplicate round");
    }
    setLoading(null);
  };

  const handleFillEmptyMatches = async (roundId: string) => {
    setError("");
    setLoading(`fill-round-${roundId}`);

    const result = await fillRoundWithEmptyMatchesAction(roundId, tournamentId);
    if (result.success) {
      showMsg(result.message || "Match slots added to round!");
      startTransition(() => {
        router.refresh();
      });
    } else {
      setError(result.error || "Failed to fill round with matches");
    }
    setLoading(null);
  };

  // ---- Scoring Actions ----
  const handleRecalculate = async (matchId: string) => {
    if (isDeadlineActive) {
      setError(
        "Score calculation is disabled during the official FPL Gameweek deadline. Fantasy Premier League points are not finalized while the game is updating. Please try again after the deadline window."
      );
      return;
    }
    setLoading(`calc-${matchId}`);
    setError("");
    const result = await recalculateMatchAction(matchId, tournamentId);
    if (result.success) {
      showMsg("Match scores calculated from official FPL data!");
      startTransition(() => {
        router.refresh();
      });
    } else {
      if (result.isDeadline) {
        setIsDeadlineActive(true);
      }
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
      startTransition(() => {
        router.refresh();
      });
    } else {
      setError(result.error || "Failed to finalize match");
    }
    setLoading(null);
  };

  const handleRecalculateRound = async (
    roundId: string,
    roundName: string
  ) => {
    if (isDeadlineActive) {
      setError(
        "Score calculation is disabled during the official FPL Gameweek deadline. Fantasy Premier League points are not finalized while the game is updating. Please try again after the deadline window."
      );
      return;
    }
    setLoading(`recalc-round-${roundId}`);
    setError("");
    const result = await recalculateRoundScoresAction(roundId, tournamentId);
    if (result.success) {
      showMsg(`${roundName} scores recalculated from official FPL data!`);
      startTransition(() => {
        router.refresh();
      });
    } else {
      if (result.isDeadline) {
        setIsDeadlineActive(true);
      }
      setError(
        result.error ||
          `Failed to recalculate ${roundName} scores. Please verify FPL connection.`
      );
    }
    setLoading(null);
  };

  const executeRecalculateAll = async () => {
    setConfirmRecalcAllOpen(false);
    if (isDeadlineActive) {
      setError(
        "Bulk score recalculation is paused during the official FPL Gameweek deadline. Please wait until the deadline window completes."
      );
      return;
    }
    setLoading("recalc-all");
    setError("");
    const result = await recalculateAllScoresAction(tournamentId);
    if (result.success) {
      showMsg(
        result.count !== undefined
          ? `${result.count} active match score(s) updated from official FPL data!`
          : "All eligible match scores recalculated successfully!"
      );
      startTransition(() => {
        router.refresh();
      });
    } else {
      if (result.isDeadline) {
        setIsDeadlineActive(true);
      }
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

            {/* Action: Add Round */}
            <Button
              variant="outline"
              onClick={handleAddRound}
              disabled={loading === "add-round"}
              className="h-10 px-3.5 text-xs sm:text-sm font-semibold text-[#1F1F1F] border-[#E5E5E5] bg-white hover:bg-[#F7F7F7] hover:border-[#37003C]/40 hover:text-[#37003C] rounded-[8px] transition-colors gap-1.5 shadow-2xs cursor-pointer"
            >
              {loading === "add-round" ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#37003C]" />
              ) : (
                <Plus className="h-4 w-4 text-[#37003C]" />
              )}
              <span>{loading === "add-round" ? "Adding..." : "Add Round"}</span>
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
              disabled={
                loading === "recalc-all" ||
                allMatches.length === 0 ||
                isDeadlineActive
              }
              className={`h-10 px-4 text-xs sm:text-sm font-semibold rounded-[8px] transition-colors gap-2 shadow-2xs w-full lg:w-auto ${
                isDeadlineActive
                  ? "text-amber-800 border-amber-300 bg-amber-50/70 cursor-not-allowed"
                  : "text-emerald-800 border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100 hover:border-emerald-400"
              }`}
              title={
                isDeadlineActive
                  ? "Score recalculation is disabled during the official FPL Gameweek deadline"
                  : "Recalculate scores for all unfinalized matches"
              }
            >
              {loading === "recalc-all" ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
              ) : isDeadlineActive ? (
                <Clock className="h-4 w-4 text-amber-700" />
              ) : (
                <RefreshCw className="h-4 w-4 text-emerald-700" />
              )}
              <span>
                {loading === "recalc-all"
                  ? "Recalculating..."
                  : isDeadlineActive
                  ? "Recalculation Paused (Deadline)"
                  : "Recalculate All"}
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* FPL Deadline Alert Banner */}
      {isDeadlineActive && (
        <Alert className="animate-fpl-fade-in border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-purple-900/10 to-transparent text-[#37003C] shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-700 mt-0.5 shrink-0">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
            <div className="space-y-1 min-w-0">
              <AlertTitle className="font-extrabold text-sm sm:text-base text-[#37003C] flex items-center gap-2">
                <span>FPL Gameweek Deadline Active</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white">
                  Scoring Paused
                </span>
              </AlertTitle>
              <AlertDescription className="text-xs sm:text-sm text-[#555555] leading-relaxed">
                {deadlineReason ||
                  "The official Fantasy Premier League servers are processing gameweek updates and transfers. Live match score recalculation is temporarily disabled until the deadline window completes."}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

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


      {/* 6. Rounds & Fixtures List */}
      <section aria-label="Rounds & Fixtures" className="space-y-4 sm:space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#37003C]" />
            <h2 className="text-lg sm:text-xl font-extrabold text-[#1F1F1F] tracking-tight">
              Rounds &amp; Fixtures
            </h2>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-[#777777]">
              {rounds.length} {rounds.length === 1 ? "Round" : "Rounds"}
            </span>
            {rounds.length > 1 && (
              <div className="flex items-center gap-1 pl-2 border-l border-gray-200">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={collapseAllRounds}
                  className="h-7 px-2 text-[11px] font-semibold text-[#555555] hover:text-[#37003C] hover:bg-[#37003C]/5 rounded-[6px] cursor-pointer"
                  title="Minimize all round cards"
                >
                  Collapse All
                </Button>
                <span className="text-gray-300 text-xs">·</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={expandAllRounds}
                  className="h-7 px-2 text-[11px] font-semibold text-[#555555] hover:text-[#37003C] hover:bg-[#37003C]/5 rounded-[6px] cursor-pointer"
                  title="Expand all round cards"
                >
                  Expand All
                </Button>
              </div>
            )}
          </div>
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
                onClick={handleAddRound}
                disabled={loading === "add-round"}
                className="h-9 px-3.5 text-xs font-semibold text-[#1F1F1F] border-[#E5E5E5] hover:border-[#37003C]/40 hover:text-[#37003C] rounded-[8px] gap-1.5 cursor-pointer"
              >
                {loading === "add-round" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#37003C]" />
                ) : (
                  <Plus className="h-4 w-4 text-[#37003C]" />
                )}
                <span>{loading === "add-round" ? "Adding..." : "Add Round"}</span>
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
                  id={`round-${round.id}`}
                  className="border border-[#E5E5E5] bg-white shadow-fpl-sm overflow-hidden rounded-[14px] scroll-mt-20"
                >
                  {/* Round Header */}
                  <div
                    className={`flex flex-wrap items-center justify-between gap-3 bg-[#FBFBFB] px-4 py-3 sm:px-5 sm:py-3.5 transition-colors ${
                      isCollapsed ? "" : "border-b border-[#E5E5E5]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleRoundCollapse(round.id)}
                        className="text-[#777777] hover:text-[#1F1F1F] p-1 rounded hover:bg-gray-200/60 transition-colors cursor-pointer"
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

                      <div
                        className="space-y-0.5 cursor-pointer select-none"
                        onClick={() => toggleRoundCollapse(round.id)}
                        title={isCollapsed ? "Click to expand round" : "Click to minimize round"}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-[#1F1F1F] text-sm sm:text-base leading-tight hover:text-[#37003C] transition-colors">
                            {round.name || `Round ${round.roundNumber}`}
                          </h3>
                          <span className="inline-flex items-center text-[10px] font-extrabold px-2 py-0.5 rounded-[4px] bg-[#37003C]/10 text-[#37003C]">
                            Gameweek {round.gameweek}
                          </span>
                          {round.matches.every((m) => m.status === "FINALIZED") && round.matches.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Lock className="h-2.5 w-2.5" />
                              FINALIZED
                            </span>
                          ) : round.matches.some((m) => m.status === "IN_PROGRESS") ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
                              LIVE ROUND
                            </span>
                          ) : round.matches.every((m) => m.status === "COMPLETED" || m.status === "FINALIZED") && round.matches.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                              COMPLETED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                              <Clock className="h-2.5 w-2.5" />
                              INCOMING
                            </span>
                          )}
                          <span className="text-xs text-[#777777] font-medium">
                            · {round.matches.length}{" "}
                            {round.matches.length === 1 ? "Match" : "Matches"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Round Actions */}
                    <div className="flex items-center gap-2">
                      {round.matches.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleRecalculateRound(
                              round.id,
                              round.name || `Round ${round.roundNumber}`
                            )
                          }
                          disabled={
                            loading === `recalc-round-${round.id}` ||
                            isDeadlineActive
                          }
                          className="h-8 px-2.5 sm:px-3 text-xs font-semibold text-emerald-800 border-emerald-300/80 bg-emerald-50/50 hover:bg-emerald-100/70 rounded-[6px] gap-1.5 shadow-2xs"
                          title={`Recalculate all match scores in ${round.name || `Round ${round.roundNumber}`}`}
                        >
                          {loading === `recalc-round-${round.id}` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-700" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5 text-emerald-700" />
                          )}
                          <span className="hidden sm:inline">Recalculate Round</span>
                          <span className="sm:hidden">Recalc</span>
                        </Button>
                      )}

                      {round.matches.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDuplicateRoundState({
                              roundId: round.id,
                              roundName:
                                round.name || `Round ${round.roundNumber}`,
                              gameweek: round.gameweek,
                            });
                            setDuplicateTargetGW(
                              Math.min(38, round.gameweek + 1)
                            );
                          }}
                          disabled={loading === `dup-round-${round.id}`}
                          className="h-8 px-2.5 sm:px-3 text-xs font-semibold text-[#37003C] border-[#37003C]/20 bg-[#37003C]/5 hover:bg-[#37003C]/10 rounded-[6px] gap-1.5 shadow-2xs cursor-pointer"
                          title="Duplicate this round to the next Gameweek with Home and Away reversed (Leg 2)"
                        >
                          <Copy className="h-3.5 w-3.5 text-[#37003C]" />
                          <span className="hidden sm:inline">Reverse Fixtures</span>
                          <span className="sm:hidden">Leg 2</span>
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddMatch(round.id)}
                        disabled={loading === `add-match-${round.id}`}
                        className="h-8 px-3 text-xs font-semibold text-[#37003C] border-[#37003C]/25 bg-white hover:bg-[#37003C]/5 rounded-[6px] gap-1.5 shadow-2xs cursor-pointer"
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
                  {!isCollapsed && (() => {
                    const assignedGroupIds = new Set<string>();
                    round.matches.forEach((m) => {
                      if (m.homeGroupId) assignedGroupIds.add(m.homeGroupId);
                      if (m.awayGroupId) assignedGroupIds.add(m.awayGroupId);
                    });
                    const unassignedGroups = groups.filter(
                      (g) => !assignedGroupIds.has(g.id)
                    );

                    return (
                      <div className="p-4 sm:p-5 space-y-4 bg-white">
                        {/* ⚡ Unassigned Teams / Click-to-Pair Tray */}
                        {unassignedGroups.length > 0 && (
                          <div className="rounded-[12px] border border-dashed border-[#37003C]/25 bg-[#37003C]/[0.02] p-3 sm:p-3.5 space-y-2.5 transition-all shadow-2xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black uppercase tracking-wider text-[#37003C] flex items-center gap-1.5">
                                  <Sparkles className="h-3.5 w-3.5 text-[#E9007F]" />
                                  <span>Available Teams ({unassignedGroups.length})</span>
                                </span>
                                <span className="text-[11px] text-gray-500 hidden sm:inline">
                                  {activePairing?.roundId === round.id
                                    ? "• Click second team to create fixture"
                                    : "• Click any 2 teams to instantly pair"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {activePairing?.roundId === round.id && (
                                  <button
                                    type="button"
                                    onClick={() => setActivePairing(null)}
                                    className="text-[11px] font-bold text-gray-500 hover:text-gray-800 underline cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                )}
                                {unassignedGroups.length >= 2 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAutoPairRemaining(round.id)}
                                    disabled={loading === `auto-pair-${round.id}`}
                                    className="h-7 px-2.5 text-[11px] font-bold text-[#37003C] bg-white hover:bg-[#37003C]/5 border-[#37003C]/25 rounded-[6px] gap-1 shadow-2xs cursor-pointer"
                                    title="Automatically pair all remaining teams in this round"
                                  >
                                    {loading === `auto-pair-${round.id}` ? (
                                      <Loader2 className="h-3 w-3 animate-spin text-[#37003C]" />
                                    ) : (
                                      <Zap className="h-3 w-3 text-[#00FF87] fill-[#00FF87]" />
                                    )}
                                    <span>Auto-Pair Remaining</span>
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Click-to-Pair Badges */}
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              {unassignedGroups.map((group) => {
                                const isSelected =
                                  activePairing?.roundId === round.id &&
                                  activePairing?.groupId === group.id;

                                return (
                                  <button
                                    key={group.id}
                                    type="button"
                                    onClick={() =>
                                      handleSelectPairingTeam(round.id, group.id)
                                    }
                                    disabled={loading === `pair-${round.id}`}
                                    className={`group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
                                      isSelected
                                        ? "bg-[#37003C] text-white border-[#37003C] ring-2 ring-[#00FF87] ring-offset-1 scale-105"
                                        : activePairing?.roundId === round.id
                                        ? "bg-white text-[#1F1F1F] border-gray-300 hover:border-[#37003C] hover:bg-[#37003C]/5 hover:scale-102"
                                        : "bg-white text-gray-700 border-gray-200 hover:border-[#37003C]/40 hover:bg-[#37003C]/5"
                                    }`}
                                  >
                                    {group.logo ? (
                                      <img
                                        src={group.logo}
                                        alt=""
                                        className="h-4 w-4 object-contain shrink-0 rounded"
                                      />
                                    ) : (
                                      <span
                                        className={`h-4 w-4 rounded text-[9px] flex items-center justify-center font-black ${
                                          isSelected
                                            ? "bg-white/20 text-white"
                                            : "bg-[#37003C]/10 text-[#37003C]"
                                        }`}
                                      >
                                        {group.name.slice(0, 2).toUpperCase()}
                                      </span>
                                    )}
                                    <span>{group.name}</span>
                                    {isSelected && (
                                      <span className="text-[10px] text-[#00FF87] font-black ml-0.5 animate-pulse">
                                        (Pick Opponent)
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {round.matches.length === 0 ? (
                          <div className="rounded-[10px] border border-dashed border-[#E5E5E5] p-6 text-center bg-[#FDFDFD] space-y-3">
                            <p className="text-xs sm:text-sm text-[#777777] italic">
                              No fixtures created yet in this round
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-2">
                              {groups.length >= 2 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAutoPairRemaining(round.id)}
                                  disabled={loading === `auto-pair-${round.id}`}
                                  className="h-8 px-3 text-xs font-bold text-[#37003C] border-[#37003C]/30 bg-[#37003C]/5 hover:bg-[#37003C]/10 gap-1.5 shadow-2xs cursor-pointer"
                                >
                                  {loading === `auto-pair-${round.id}` ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#37003C]" />
                                  ) : (
                                    <Zap className="h-3.5 w-3.5 text-[#00FF87] fill-[#00FF87]" />
                                  )}
                                  <span>Auto-Pair All Teams</span>
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFillEmptyMatches(round.id)}
                                disabled={loading === `fill-round-${round.id}`}
                                className="h-8 px-3 text-xs font-semibold text-gray-700 border-[#E5E5E5] hover:bg-gray-50 gap-1.5 cursor-pointer"
                                title="Add empty match slots for all groups"
                              >
                                {loading === `fill-round-${round.id}` ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Layers className="h-3.5 w-3.5 text-[#37003C]" />
                                )}
                                <span>Create Empty Slots</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddMatch(round.id)}
                                disabled={loading === `add-match-${round.id}`}
                                className="h-8 px-3 text-xs font-semibold text-[#37003C] border-[#E5E5E5] hover:bg-[#F7F7F7] gap-1.5 cursor-pointer"
                              >
                                {loading === `add-match-${round.id}` ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#37003C]" />
                                ) : (
                                  <Plus className="h-3.5 w-3.5" />
                                )}
                                <span>Add 1 Match</span>
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                          {round.matches
                            .sort((a, b) => a.matchNumber - b.matchNumber)
                          .map((match) => {
                            const isFinalized = match.status === "FINALIZED";
                            const isCompleted = match.status === "COMPLETED";
                            const isInProgress = match.status === "IN_PROGRESS";
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
                                    : isInProgress
                                      ? "border-rose-300/80 bg-rose-500/5 shadow-2xs"
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
                                    ) : isInProgress ? (
                                      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold text-rose-700 shadow-2xs">
                                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                                        <span>LIVE MATCH</span>
                                      </span>
                                    ) : isCompleted ? (
                                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#5A0A63]/30 bg-[#5A0A63]/10 px-2.5 py-0.5 text-xs font-bold text-[#5A0A63] shadow-2xs">
                                        <CheckCircle2 className="h-3 w-3 text-[#5A0A63]" />
                                        <span>COMPLETED</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-300 bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-sky-700 shadow-2xs">
                                        <Clock className="h-3 w-3 text-sky-600" />
                                        <span>INCOMING</span>
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
                                        <SearchableTeamSelect
                                          value={match.homeGroupId || ""}
                                          onChange={(val) =>
                                            handleUpdateMatch(
                                              match.id,
                                              "home",
                                              val
                                            )
                                          }
                                          groups={groups}
                                          disabled={isFinalized}
                                          placeholder="Select Home Group..."
                                          ariaLabel={`Select home group for match ${match.matchNumber}`}
                                          align="right"
                                        />
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
                                      {/* Quick Swap Home/Away button */}
                                      {!isFinalized && (match.homeGroupId || match.awayGroupId) && (
                                        <button
                                          type="button"
                                          onClick={() => handleSwapSides(match.id)}
                                          disabled={loading === `swap-${match.id}`}
                                          className="mb-1 text-[11px] font-bold text-gray-400 hover:text-[#37003C] hover:bg-[#37003C]/5 px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer border border-transparent hover:border-gray-200 shadow-2xs"
                                          title="Swap Home and Away teams (⇄)"
                                        >
                                          {loading === `swap-${match.id}` ? (
                                            <Loader2 className="h-3 w-3 animate-spin text-[#37003C]" />
                                          ) : (
                                            <ArrowLeftRight className="h-3 w-3 text-[#37003C]" />
                                          )}
                                          <span className="text-[9px] uppercase font-extrabold tracking-wider text-[#555555]">
                                            Swap
                                          </span>
                                        </button>
                                      )}

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
                                        <SearchableTeamSelect
                                          value={match.awayGroupId || ""}
                                          onChange={(val) =>
                                            handleUpdateMatch(
                                              match.id,
                                              "away",
                                              val
                                            )
                                          }
                                          groups={groups}
                                          disabled={isFinalized}
                                          placeholder="Select Away Group..."
                                          ariaLabel={`Select away group for match ${match.matchNumber}`}
                                          align="left"
                                        />
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
                                        <div className="w-full">
                                          <SearchableTeamSelect
                                            value={match.homeGroupId || ""}
                                            onChange={(val) =>
                                              handleUpdateMatch(
                                                match.id,
                                                "home",
                                                val
                                              )
                                            }
                                            groups={groups}
                                            disabled={isFinalized}
                                            placeholder="Select Home Group..."
                                            ariaLabel={`Select home group for match ${match.matchNumber}`}
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    {/* Mobile VS / Scoreboard Divider */}
                                    <div className="flex flex-col items-center justify-center py-1">
                                      {!isFinalized && (match.homeGroupId || match.awayGroupId) && (
                                        <button
                                          type="button"
                                          onClick={() => handleSwapSides(match.id)}
                                          disabled={loading === `swap-${match.id}`}
                                          className="mb-1.5 text-[11px] font-bold text-gray-600 hover:text-[#37003C] hover:bg-[#37003C]/5 px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer border border-gray-200 bg-gray-50/70"
                                          title="Swap Home and Away teams (⇄)"
                                        >
                                          {loading === `swap-${match.id}` ? (
                                            <Loader2 className="h-3 w-3 animate-spin text-[#37003C]" />
                                          ) : (
                                            <ArrowLeftRight className="h-3 w-3 text-[#37003C]" />
                                          )}
                                          <span className="text-[10px] uppercase font-bold text-[#555555]">
                                            Swap Home/Away
                                          </span>
                                        </button>
                                      )}

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
                                        <div className="w-full">
                                          <SearchableTeamSelect
                                            value={match.awayGroupId || ""}
                                            onChange={(val) =>
                                              handleUpdateMatch(
                                                match.id,
                                                "away",
                                                val
                                              )
                                            }
                                            groups={groups}
                                            disabled={isFinalized}
                                            placeholder="Select Away Group..."
                                            ariaLabel={`Select away group for match ${match.matchNumber}`}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Match Actions Footer */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#EEEEEE]">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {/* Manual Score Entry Button */}
                                    {match.homeGroupId &&
                                      match.awayGroupId &&
                                      !isFinalized && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            setActiveScoreModalMatch({
                                              match,
                                              round,
                                            })
                                          }
                                          className="h-8 px-3 text-xs font-bold text-[#37003C] border-[#37003C]/30 bg-[#37003C]/5 hover:bg-[#37003C]/10 rounded-[6px] gap-1.5 shadow-2xs cursor-pointer"
                                          title="Insert or adjust player points for this fixture"
                                        >
                                          <Pencil className="h-3.5 w-3.5 text-[#37003C]" />
                                          <span>
                                            {hasScores
                                              ? "Edit Scores"
                                              : "Enter Scores"}
                                          </span>
                                        </Button>
                                      )}

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
                                            loading === `calc-${match.id}` ||
                                            isDeadlineActive
                                          }
                                          title={
                                            isDeadlineActive
                                              ? "Score recalculation is disabled during the official FPL Gameweek deadline"
                                              : undefined
                                          }
                                          className={`h-8 px-3 text-xs font-semibold rounded-[6px] gap-1.5 shadow-2xs ${
                                            isDeadlineActive
                                              ? "text-amber-800 border-amber-300 bg-amber-50/60 cursor-not-allowed"
                                              : "text-[#37003C] border-[#37003C]/20 bg-white hover:bg-[#37003C]/5 hover:border-[#37003C]/40"
                                          }`}
                                        >
                                          {loading === `calc-${match.id}` ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#37003C]" />
                                          ) : isDeadlineActive ? (
                                            <Clock className="h-3.5 w-3.5 text-amber-700" />
                                          ) : (
                                            <RefreshCw className="h-3.5 w-3.5 text-[#37003C]" />
                                          )}
                                          <span>
                                            {loading === `calc-${match.id}`
                                              ? "Recalculating..."
                                              : isDeadlineActive
                                                ? "Deadline Paused"
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
                          })}

                          {/* Bottom Action Bar: Add Match */}
                          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-[#EEEEEE]">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddMatch(round.id)}
                              disabled={loading === `add-match-${round.id}`}
                              className="h-9 px-4 text-xs font-bold text-[#37003C] border-dashed border-[#37003C]/30 bg-[#37003C]/5 hover:bg-[#37003C]/10 hover:border-[#37003C]/50 rounded-[8px] gap-2 shadow-2xs transition-all cursor-pointer"
                            >
                              {loading === `add-match-${round.id}` ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#37003C]" />
                              ) : (
                                <Plus className="h-3.5 w-3.5 text-[#37003C]" />
                              )}
                              <span>Add Match</span>
                            </Button>

                            <span className="text-[11px] text-[#888888] font-medium hidden sm:inline">
                              Add another fixture to {round.name || `Round ${round.roundNumber}`}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}
                </Card>
              );
            })
        )}

        {/* Bottom Action Bar: Add Round */}
        {rounds.length > 0 && (
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-[#E5E5E5]/80">
            <Button
              variant="outline"
              onClick={handleAddRound}
              disabled={loading === "add-round"}
              className="h-10 px-5 text-xs sm:text-sm font-bold text-[#37003C] border-dashed border-2 border-[#37003C]/30 bg-white hover:bg-[#37003C]/5 hover:border-[#37003C]/50 rounded-[10px] gap-2 shadow-2xs transition-all cursor-pointer"
            >
              {loading === "add-round" ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#37003C]" />
              ) : (
                <Plus className="h-4 w-4 text-[#37003C]" />
              )}
              <span>Add Round</span>
            </Button>
            <span className="text-xs text-[#777777] font-medium hidden sm:inline">
              Create another round for the next Gameweek
            </span>
          </div>
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

      {/* Duplicate Round as Reverse Confirmation Modal */}
      <AlertDialog
        open={!!duplicateRoundState}
        onOpenChange={(open) => !open && setDuplicateRoundState(null)}
      >
        <AlertDialogContent className="rounded-[14px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-extrabold text-[#1F1F1F] flex items-center gap-2">
              <Copy className="h-5 w-5 text-[#37003C]" />
              <span>Duplicate as Reverse Fixtures (Leg 2)?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm text-[#555555]">
              This will create a new round containing all fixtures from{" "}
              <strong className="text-[#1F1F1F]">
                {duplicateRoundState?.roundName}
              </strong>{" "}
              with the Home and Away sides inverted.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-2 space-y-2">
            <Label htmlFor="dupGW" className="text-xs font-bold text-[#1F1F1F]">
              Assign to Gameweek:
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="dupGW"
                type="number"
                min={1}
                max={38}
                value={duplicateTargetGW}
                onChange={(e) =>
                  setDuplicateTargetGW(
                    Math.max(1, Math.min(38, parseInt(e.target.value) || 1))
                  )
                }
                className="w-28 font-bold text-center h-9 bg-white"
              />
              <span className="text-xs text-gray-500">
                (GW 1–38, recommended GW{" "}
                {duplicateRoundState
                  ? Math.min(38, duplicateRoundState.gameweek + 1)
                  : 1}
                )
              </span>
            </div>
          </div>

          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-[8px] text-xs font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDuplicateRoundAsReverse}
              className="bg-[#37003C] hover:bg-[#5A0A63] text-white rounded-[8px] text-xs font-bold"
            >
              Create Leg 2 Round
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

      {/* Manual Match Score Entry Modal */}
      {activeScoreModalMatch && (
        <ManualMatchScoreModal
          isOpen={true}
          onClose={() => setActiveScoreModalMatch(null)}
          tournamentId={tournamentId}
          matchId={activeScoreModalMatch.match.id}
          matchNumber={activeScoreModalMatch.match.matchNumber}
          gameweek={activeScoreModalMatch.round.gameweek}
          homeGroup={
            (groups.find(
              (g) => g.id === activeScoreModalMatch.match.homeGroupId
            ) as unknown as MatchGroupData) || null
          }
          awayGroup={
            (groups.find(
              (g) => g.id === activeScoreModalMatch.match.awayGroupId
            ) as unknown as MatchGroupData) || null
          }
          existingScores={
            (activeScoreModalMatch.match.scores as unknown as MatchScoreData[]) || []
          }
          onScoresSaved={() => {
            showMsg("Scores saved successfully!");
            startTransition(() => {
              router.refresh();
            });
          }}
        />
      )}
    </div>
  );
}
