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
  X,
  Loader2,
  Check,
  Calendar,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface Group {
  id: string;
  name: string;
  logo?: string | null;
}

interface Match {
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

interface Round {
  id: string;
  name: string | null;
  roundNumber: number;
  gameweek: number;
  matches: Match[];
}

export function ScheduleBuilder({
  tournamentId,
  initialRounds,
  groups,
}: {
  tournamentId: string;
  initialRounds: Round[];
  groups: Group[];
}) {
  const [rounds, setRounds] = useState<Round[]>(initialRounds);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);

  // Auto-generate round-robin state
  const [showAutoGenerate, setShowAutoGenerate] = useState(false);
  const [startGW, setStartGW] = useState(1);

  // New round form
  const [newRoundName, setNewRoundName] = useState("");
  const [newRoundGW, setNewRoundGW] = useState(1);
  const [showAddRound, setShowAddRound] = useState(false);

  const groupNameById = (id: string | null) => {
    if (!id) return "TBD";
    return groups.find((g) => g.id === id)?.name || "Unknown";
  };

  const showMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3500);
  };

  // ---- Auto-Generate Round-Robin Schedule ----
  const handleAutoGenerate = async () => {
    if (
      rounds.length > 0 &&
      !confirm(
        "Auto-generating will replace all existing rounds and matches with a fresh round-robin schedule. Continue?"
      )
    ) {
      return;
    }

    setLoading("auto-generate");
    setError("");
    const result = await generateRoundRobinScheduleAction(
      tournamentId,
      startGW
    );
    if (result.success) {
      showMsg(result.message || "Round-robin schedule generated!");
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
      newRoundName || undefined
    );
    if (result.success && result.round) {
      setRounds((prev) => [
        ...prev,
        { ...result.round!, matches: [] } as Round,
      ]);
      setShowAddRound(false);
      setNewRoundName("");
      setNewRoundGW(1);
      showMsg("Round created");
    } else {
      setError(result.error || "Failed to create round");
    }
    setLoading(null);
  };

  const handleDeleteRound = async (roundId: string) => {
    if (!confirm("Delete this round and all its matches?")) return;
    setError("");
    const result = await deleteRoundAction(roundId, tournamentId);
    if (result.success) {
      setRounds((prev) => prev.filter((r) => r.id !== roundId));
      showMsg("Round deleted");
    } else {
      setError(result.error || "Failed to delete round");
    }
  };

  // ---- Match CRUD ----
  const handleAddMatch = async (roundId: string) => {
    setError("");
    const result = await createMatchAction(roundId, tournamentId, {});
    if (result.success && result.match) {
      setRounds((prev) =>
        prev.map((r) =>
          r.id === roundId
            ? { ...r, matches: [...r.matches, result.match as Match] }
            : r
        )
      );
      showMsg("Match added");
    } else {
      setError(result.error || "Failed to add match");
    }
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
            m.id === matchId ? { ...m, ...result.match } : m
          ),
        }))
      );
    } else {
      setError(result.error || "Failed to update match");
    }
  };

  const handleDeleteMatch = async (matchId: string, roundId: string) => {
    if (!confirm("Delete this match?")) return;
    setError("");
    const result = await deleteMatchAction(matchId, tournamentId);
    if (result.success) {
      setRounds((prev) =>
        prev.map((r) =>
          r.id === roundId
            ? { ...r, matches: r.matches.filter((m) => m.id !== matchId) }
            : r
        )
      );
      showMsg("Match deleted");
    } else {
      setError(result.error || "Failed to delete match");
    }
  };

  // ---- Scoring ----
  const handleRecalculate = async (matchId: string) => {
    setLoading(`calc-${matchId}`);
    setError("");
    const result = await recalculateMatchAction(matchId, tournamentId);
    if (result.success && result.result) {
      setRounds((prev) =>
        prev.map((r) => ({
          ...r,
          matches: r.matches.map((m) =>
            m.id === matchId
              ? {
                  ...m,
                  homeScore: result.result!.homeScore,
                  awayScore: result.result!.awayScore,
                  result: result.result!.result,
                  winnerId: result.result!.winnerGroupId,
                  status: result.result!.status,
                }
              : m
          ),
        }))
      );
      showMsg("Match calculated");
    } else {
      setError(result.error || "Failed to calculate");
    }
    setLoading(null);
  };

  const handleFinalize = async (matchId: string) => {
    if (!confirm("Finalize this match?")) return;
    setLoading(`fin-${matchId}`);
    setError("");
    const result = await finalizeMatchAction(matchId, tournamentId);
    if (result.success) {
      window.location.reload();
    } else {
      setError(result.error || "Failed to finalize");
    }
    setLoading(null);
  };

  const handleRecalculateAll = async () => {
    setLoading("recalc-all");
    setError("");
    const result = await recalculateAllScoresAction(tournamentId);
    if (result.success) {
      showMsg(`Recalculated ${result.count} matches`);
      window.location.reload();
    } else {
      setError(result.error || "Failed to recalculate");
    }
    setLoading(null);
  };

  // ---- Validation ----
  const handleValidate = async () => {
    setLoading("validate");
    const result = await validateScheduleAction(tournamentId);
    setValidationIssues(result.issues);
    if (result.isValid) {
      showMsg("Schedule is valid — ready to publish!");
    }
    setLoading(null);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 border border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 border border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAutoGenerate(!showAutoGenerate)}
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition cursor-pointer"
          >
            <Zap className="h-4 w-4" />
            <span>Auto-Generate Round-Robin Fixtures</span>
          </button>
          <button
            onClick={handleValidate}
            disabled={loading === "validate"}
            className="inline-flex items-center gap-1.5 rounded-md border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition cursor-pointer disabled:opacity-50"
          >
            {loading === "validate" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>{loading === "validate" ? "Validating..." : "Validate Schedule"}</span>
          </button>
        </div>

        <button
          onClick={handleRecalculateAll}
          disabled={loading === "recalc-all"}
          className="inline-flex items-center gap-1.5 rounded-md border border-green-300 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 transition cursor-pointer disabled:opacity-50"
        >
          {loading === "recalc-all" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span>
            {loading === "recalc-all" ? "Recalculating..." : "Recalculate All Scores"}
          </span>
        </button>
      </div>

      {/* Auto-Generate Panel */}
      {showAutoGenerate && (
        <div className="rounded-lg border-2 border-indigo-200 bg-indigo-50/70 p-5 shadow-sm space-y-4">
          <div>
            <h4 className="text-base font-bold text-indigo-950 flex items-center gap-2">
              <Zap className="h-4 w-4 text-indigo-700" />
              <span>Generate Round-Robin League Fixtures</span>
            </h4>
            <p className="text-xs text-indigo-700 mt-1">
              Automatically creates all Gameweek rounds and matches so every
              group plays against every other group in the tournament.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-semibold text-indigo-900">
                Starting Gameweek (GW)
              </label>
              <input
                type="number"
                min={1}
                max={38}
                value={startGW}
                onChange={(e) => setStartGW(parseInt(e.target.value) || 1)}
                className="mt-1 w-32 rounded border border-indigo-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="text-xs text-indigo-700">
              {groups.length < 2 ? (
                <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Need at least 2 groups imported to generate fixtures.</span>
                </span>
              ) : (
                <span>
                  Will generate{" "}
                  <strong>
                    {groups.length % 2 === 0
                      ? groups.length - 1
                      : groups.length}{" "}
                    Gameweek rounds
                  </strong>{" "}
                  for {groups.length} participating groups.
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAutoGenerate}
                disabled={loading === "auto-generate" || groups.length < 2}
                className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
              >
                {loading === "auto-generate" && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>
                  {loading === "auto-generate"
                    ? "Generating..."
                    : "Generate Fixtures Now"}
                </span>
              </button>
              <button
                onClick={() => setShowAutoGenerate(false)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Issues */}
      {validationIssues.length > 0 && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-700 shrink-0" />
            <h4 className="font-semibold text-yellow-800">
              {validationIssues.length} issue(s) found:
            </h4>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-yellow-700 ml-7">
            {validationIssues.map((issue, i) => (
              <li key={i}>• {issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Rounds List */}
      {rounds.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 text-center">
          <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-gray-700">
            No Fixtures Scheduled Yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Use the "Auto-Generate Round-Robin Fixtures" button above or create
            rounds manually below.
          </p>
        </div>
      ) : (
        rounds
          .sort((a, b) => a.roundNumber - b.roundNumber)
          .map((round) => (
            <div
              key={round.id}
              className="rounded-lg border border-gray-200 bg-white shadow-sm"
            >
              {/* Round Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 bg-gray-50/50">
                <div>
                  <h3 className="font-bold text-gray-900">
                    {round.name || `Round ${round.roundNumber}`}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Gameweek {round.gameweek} · {round.matches.length} matches
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddMatch(round.id)}
                    className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Match</span>
                  </button>
                  <button
                    onClick={() => handleDeleteRound(round.id)}
                    className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 font-medium cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Round</span>
                  </button>
                </div>
              </div>

              {/* Matches */}
              <div className="divide-y divide-gray-100 p-4">
                {round.matches.length === 0 ? (
                  <p className="text-sm text-gray-400 italic py-2">
                    No matches in this round. Click "+ Add Match" to schedule.
                  </p>
                ) : (
                  round.matches
                    .sort((a, b) => a.matchNumber - b.matchNumber)
                    .map((match) => (
                      <div key={match.id} className="py-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Match {match.matchNumber}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {/* Status Badge */}
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                match.status === "FINALIZED"
                                  ? "bg-green-100 text-green-800"
                                  : match.status === "COMPLETED"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {match.status}
                            </span>
                            <button
                              onClick={() =>
                                handleDeleteMatch(match.id, round.id)
                              }
                              className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Delete match"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Match Configuration: Direct Group vs Group */}
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                          {/* Home Group */}
                          <select
                            value={match.homeGroupId || ""}
                            onChange={(e) =>
                              handleUpdateMatch(
                                match.id,
                                "home",
                                e.target.value
                              )
                            }
                            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="">Select Home Group...</option>
                            {groups.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name}
                              </option>
                            ))}
                          </select>

                          <span className="text-sm font-black text-indigo-500 px-2 text-center">
                            VS
                          </span>

                          {/* Away Group */}
                          <select
                            value={match.awayGroupId || ""}
                            onChange={(e) =>
                              handleUpdateMatch(
                                match.id,
                                "away",
                                e.target.value
                              )
                            }
                            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="">Select Away Group...</option>
                            {groups.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Score Display */}
                        {match.homeScore !== null &&
                          match.awayScore !== null && (
                            <div className="flex flex-wrap items-center justify-center gap-3 rounded-lg bg-gray-50 py-2.5 px-4 border border-gray-100">
                              <div className="flex items-center gap-2">
                                {groups.find((g) => g.id === match.homeGroupId)?.logo && (
                                  <img
                                    src={groups.find((g) => g.id === match.homeGroupId)!.logo!}
                                    alt={groupNameById(match.homeGroupId)}
                                    className="h-5 w-5 object-contain"
                                  />
                                )}
                                <span className="font-bold text-gray-900 text-sm">
                                  {groupNameById(match.homeGroupId)}
                                </span>
                              </div>
                              <span className="text-lg font-mono font-black text-indigo-600 bg-white px-2.5 py-0.5 rounded border border-gray-200">
                                {match.homeScore} - {match.awayScore}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 text-sm">
                                  {groupNameById(match.awayGroupId)}
                                </span>
                                {groups.find((g) => g.id === match.awayGroupId)?.logo && (
                                  <img
                                    src={groups.find((g) => g.id === match.awayGroupId)!.logo!}
                                    alt={groupNameById(match.awayGroupId)}
                                    className="h-5 w-5 object-contain"
                                  />
                                )}
                              </div>
                              {match.result && (
                                <span
                                  className={`rounded px-2 py-0.5 text-[11px] font-bold ${
                                    match.result === "DRAW"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-green-100 text-green-700"
                                  }`}
                                >
                                  {match.result === "DRAW"
                                    ? "DRAW"
                                    : match.result === "HOME_WIN"
                                      ? `${groupNameById(match.homeGroupId)} WIN`
                                      : `${groupNameById(match.awayGroupId)} WIN`}
                                </span>
                              )}
                            </div>
                          )}

                        {/* Match Actions */}
                        <div className="flex gap-2 pt-1">
                          {match.homeGroupId && match.awayGroupId && (
                            <button
                              onClick={() => handleRecalculate(match.id)}
                              disabled={loading === `calc-${match.id}`}
                              className="inline-flex items-center gap-1 rounded bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50 cursor-pointer"
                            >
                              {loading === `calc-${match.id}` && <Loader2 className="h-3 w-3 animate-spin" />}
                              <span>
                                {loading === `calc-${match.id}`
                                  ? "Calculating..."
                                  : "Calculate Score"}
                              </span>
                            </button>
                          )}
                          {match.status === "COMPLETED" && (
                            <button
                              onClick={() => handleFinalize(match.id)}
                              disabled={loading === `fin-${match.id}`}
                              className="inline-flex items-center gap-1 rounded bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50 cursor-pointer"
                            >
                              {loading === `fin-${match.id}` && <Loader2 className="h-3 w-3 animate-spin" />}
                              <span>
                                {loading === `fin-${match.id}`
                                  ? "Finalizing..."
                                  : "Finalize"}
                              </span>
                            </button>
                          )}
                          {match.homeScore !== null && match.awayScore !== null && (
                            <Link
                              href={`/matches/${match.id}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>View Match</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          ))
      )}

      {/* Manual Add Round */}
      {showAddRound ? (
        <div className="rounded-lg border-2 border-dashed border-indigo-300 bg-indigo-50 p-4">
          <h4 className="font-bold text-indigo-900">Add New Round</h4>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-indigo-700">
                Round Name (optional)
              </label>
              <input
                type="text"
                value={newRoundName}
                onChange={(e) => setNewRoundName(e.target.value)}
                placeholder="e.g., Round 1"
                className="mt-1 w-full rounded border border-indigo-200 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-indigo-700">
                Gameweek *
              </label>
              <input
                type="number"
                value={newRoundGW}
                onChange={(e) => setNewRoundGW(parseInt(e.target.value))}
                min={1}
                max={38}
                className="mt-1 w-full rounded border border-indigo-200 px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleAddRound}
              disabled={loading === "add-round"}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-gray-400 cursor-pointer"
            >
              {loading === "add-round" && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{loading === "add-round" ? "Creating..." : "Create Round"}</span>
            </button>
            <button
              onClick={() => setShowAddRound(false)}
              className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddRound(true)}
          className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Round Manually</span>
        </button>
      )}
    </div>
  );
}
