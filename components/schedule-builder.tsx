"use client";

import { useState } from "react";
import {
  createRoundAction,
  updateRoundAction,
  deleteRoundAction,
  createMatchAction,
  updateMatchAction,
  deleteMatchAction,
  validateScheduleAction,
} from "@/lib/schedule-actions";
import {
  recalculateMatchAction,
  finalizeMatchAction,
  recalculateAllScoresAction,
} from "@/lib/scoring-actions";

interface Group {
  id: string;
  name: string;
}

interface Match {
  id: string;
  matchNumber: number;
  status: string;
  homeGroupId: string | null;
  awayGroupId: string | null;
  homeWinnerOfMatchId: string | null;
  awayWinnerOfMatchId: string | null;
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

  // New round form
  const [newRoundName, setNewRoundName] = useState("");
  const [newRoundGW, setNewRoundGW] = useState(1);
  const [showAddRound, setShowAddRound] = useState(false);

  // Collect all match IDs for "Winner of Match X" references
  const allMatches = rounds.flatMap((r) => r.matches);

  const groupNameById = (id: string | null) => {
    if (!id) return "TBD";
    return groups.find((g) => g.id === id)?.name || "Unknown";
  };

  const matchLabelById = (matchId: string | null) => {
    if (!matchId) return "TBD";
    const m = allMatches.find((m) => m.id === matchId);
    return m ? `Winner of Match ${m.matchNumber}` : "Unknown Match";
  };

  const showMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
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
    type: "group" | "winner",
    value: string
  ) => {
    setError("");
    const data: Record<string, string | null> = {};
    if (type === "group") {
      data[side === "home" ? "homeGroupId" : "awayGroupId"] = value || null;
      data[side === "home" ? "homeWinnerOfMatchId" : "awayWinnerOfMatchId"] =
        null;
    } else {
      data[side === "home" ? "homeWinnerOfMatchId" : "awayWinnerOfMatchId"] =
        value || null;
      data[side === "home" ? "homeGroupId" : "awayGroupId"] = null;
    }

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
    if (!confirm("Finalize this match? This will propagate the winner."))
      return;
    setLoading(`fin-${matchId}`);
    setError("");
    const result = await finalizeMatchAction(matchId, tournamentId);
    if (result.success) {
      // Refresh page to get propagated winners
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
      showMsg("✓ Schedule is valid — ready to publish!");
    }
    setLoading(null);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-3">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleValidate}
          disabled={loading === "validate"}
          className="rounded-md border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
        >
          {loading === "validate" ? "Validating..." : "Validate Schedule"}
        </button>
        <button
          onClick={handleRecalculateAll}
          disabled={loading === "recalc-all"}
          className="rounded-md border border-green-300 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100"
        >
          {loading === "recalc-all"
            ? "Recalculating..."
            : "Recalculate All Scores"}
        </button>
      </div>

      {/* Validation Issues */}
      {validationIssues.length > 0 && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
          <h4 className="font-semibold text-yellow-800">
            {validationIssues.length} issue(s) found:
          </h4>
          <ul className="mt-2 space-y-1 text-sm text-yellow-700">
            {validationIssues.map((issue, i) => (
              <li key={i}>• {issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Rounds */}
      {rounds
        .sort((a, b) => a.roundNumber - b.roundNumber)
        .map((round) => (
          <div
            key={round.id}
            className="rounded-lg border border-gray-200 bg-white shadow-sm"
          >
            {/* Round Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {round.name || `Round ${round.roundNumber}`}
                </h3>
                <p className="text-xs text-gray-500">
                  Gameweek {round.gameweek}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleAddMatch(round.id)}
                  className="rounded bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  + Match
                </button>
                <button
                  onClick={() => handleDeleteRound(round.id)}
                  className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Delete Round
                </button>
              </div>
            </div>

            {/* Matches */}
            <div className="divide-y divide-gray-50 p-4">
              {round.matches.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
                  No matches yet. Add a match to get started.
                </p>
              ) : (
                round.matches
                  .sort((a, b) => a.matchNumber - b.matchNumber)
                  .map((match) => (
                    <div key={match.id} className="py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">
                          Match {match.matchNumber}
                        </span>
                        <div className="flex items-center gap-1">
                          {/* Status Badge */}
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
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
                            className="rounded px-1.5 py-0.5 text-xs text-red-500 hover:bg-red-50"
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      {/* Match Configuration */}
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        {/* Home Side */}
                        <select
                          value={
                            match.homeGroupId ||
                            (match.homeWinnerOfMatchId
                              ? `winner:${match.homeWinnerOfMatchId}`
                              : "")
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.startsWith("winner:")) {
                              handleUpdateMatch(
                                match.id,
                                "home",
                                "winner",
                                val.replace("winner:", "")
                              );
                            } else {
                              handleUpdateMatch(
                                match.id,
                                "home",
                                "group",
                                val
                              );
                            }
                          }}
                          className="rounded border border-gray-300 px-2 py-1.5 text-sm"
                        >
                          <option value="">Select Home...</option>
                          <optgroup label="Groups">
                            {groups.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Winner of Match">
                            {allMatches
                              .filter((m) => m.id !== match.id)
                              .map((m) => (
                                <option key={m.id} value={`winner:${m.id}`}>
                                  Winner Match {m.matchNumber}
                                </option>
                              ))}
                          </optgroup>
                        </select>

                        <span className="text-sm font-bold text-gray-400">
                          VS
                        </span>

                        {/* Away Side */}
                        <select
                          value={
                            match.awayGroupId ||
                            (match.awayWinnerOfMatchId
                              ? `winner:${match.awayWinnerOfMatchId}`
                              : "")
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.startsWith("winner:")) {
                              handleUpdateMatch(
                                match.id,
                                "away",
                                "winner",
                                val.replace("winner:", "")
                              );
                            } else {
                              handleUpdateMatch(
                                match.id,
                                "away",
                                "group",
                                val
                              );
                            }
                          }}
                          className="rounded border border-gray-300 px-2 py-1.5 text-sm"
                        >
                          <option value="">Select Away...</option>
                          <optgroup label="Groups">
                            {groups.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Winner of Match">
                            {allMatches
                              .filter((m) => m.id !== match.id)
                              .map((m) => (
                                <option key={m.id} value={`winner:${m.id}`}>
                                  Winner Match {m.matchNumber}
                                </option>
                              ))}
                          </optgroup>
                        </select>
                      </div>

                      {/* Score Display */}
                      {match.homeScore !== null && match.awayScore !== null && (
                        <div className="flex items-center justify-center gap-4 rounded-md bg-gray-50 py-2">
                          <span className="font-bold text-gray-900">
                            {match.homeGroupId
                              ? groupNameById(match.homeGroupId)
                              : matchLabelById(match.homeWinnerOfMatchId)}
                          </span>
                          <span className="text-lg font-bold text-indigo-600">
                            {match.homeScore} - {match.awayScore}
                          </span>
                          <span className="font-bold text-gray-900">
                            {match.awayGroupId
                              ? groupNameById(match.awayGroupId)
                              : matchLabelById(match.awayWinnerOfMatchId)}
                          </span>
                          {match.result && (
                            <span
                              className={`rounded px-2 py-0.5 text-xs font-bold ${
                                match.result === "DRAW"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {match.result === "DRAW"
                                ? "DRAW"
                                : match.result === "HOME_WIN"
                                  ? groupNameById(match.homeGroupId)
                                  : groupNameById(match.awayGroupId)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Match Actions */}
                      <div className="flex gap-1">
                        {(match.homeGroupId || match.homeWinnerOfMatchId) &&
                          (match.awayGroupId ||
                            match.awayWinnerOfMatchId) && (
                            <button
                              onClick={() => handleRecalculate(match.id)}
                              disabled={loading === `calc-${match.id}`}
                              className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                            >
                              {loading === `calc-${match.id}`
                                ? "Calculating..."
                                : "Calculate Score"}
                            </button>
                          )}
                        {match.status === "COMPLETED" && (
                          <button
                            onClick={() => handleFinalize(match.id)}
                            disabled={loading === `fin-${match.id}`}
                            className="rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                          >
                            {loading === `fin-${match.id}`
                              ? "Finalizing..."
                              : "Finalize"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        ))}

      {/* Add Round */}
      {showAddRound ? (
        <div className="rounded-lg border-2 border-dashed border-indigo-300 bg-indigo-50 p-4">
          <h4 className="font-semibold text-indigo-900">New Round</h4>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-indigo-700">
                Round Name (optional)
              </label>
              <input
                type="text"
                value={newRoundName}
                onChange={(e) => setNewRoundName(e.target.value)}
                placeholder="e.g., Semi-Finals"
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
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {loading === "add-round" ? "Creating..." : "Create Round"}
            </button>
            <button
              onClick={() => setShowAddRound(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddRound(true)}
          className="w-full rounded-lg border-2 border-dashed border-gray-300 py-4 text-sm font-medium text-gray-500 hover:border-indigo-300 hover:text-indigo-600"
        >
          + Add Round
        </button>
      )}
    </div>
  );
}
