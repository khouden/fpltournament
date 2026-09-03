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
  Calendar,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

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
            m.id === matchId ? (result.match as Match) : m
          ),
        }))
      );
    } else {
      setError(result.error || "Failed to update match");
    }
  };

  const handleDeleteMatch = async (matchId: string, roundId: string) => {
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
    } else {
      setError(result.error || "Failed to delete match");
    }
  };

  // ---- Scoring Actions ----
  const handleRecalculate = async (matchId: string) => {
    setLoading(`calc-${matchId}`);
    setError("");
    const result = await recalculateMatchAction(matchId, tournamentId);
    if (result.success) {
      showMsg("Match scores updated!");
      window.location.reload();
    } else {
      setError(result.error || "Failed to calculate scores");
    }
    setLoading(null);
  };

  const handleFinalize = async (matchId: string) => {
    setLoading(`fin-${matchId}`);
    setError("");
    const result = await finalizeMatchAction(matchId, tournamentId);
    if (result.success) {
      showMsg("Match finalized!");
      window.location.reload();
    } else {
      setError(result.error || "Failed to finalize match");
    }
    setLoading(null);
  };

  const handleRecalculateAll = async () => {
    setLoading("recalc-all");
    setError("");
    const result = await recalculateAllScoresAction(tournamentId);
    if (result.success) {
      showMsg(
        result.count !== undefined
          ? `${result.count} match score(s) recalculated!`
          : "All match scores recalculated!"
      );
      window.location.reload();
    } else {
      setError(result.error || "Failed to recalculate scores");
    }
    setLoading(null);
  };

  const handleValidate = async () => {
    setLoading("validate");
    setValidationIssues([]);
    setError("");
    const result = await validateScheduleAction(tournamentId);
    if (result.isValid) {
      showMsg("Schedule is valid and ready!");
    } else {
      setValidationIssues(result.issues);
    }
    setLoading(null);
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Actions Bar */}
      <Card className="p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setShowAutoGenerate(!showAutoGenerate)}
              className="gap-1.5"
            >
              <Zap className="h-4 w-4" />
              <span>Auto-Generate Round-Robin Fixtures</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleValidate}
              disabled={loading === "validate"}
              className="gap-1.5 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 border-indigo-200"
            >
              {loading === "validate" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <span>{loading === "validate" ? "Validating..." : "Validate Schedule"}</span>
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={handleRecalculateAll}
            disabled={loading === "recalc-all"}
            className="gap-1.5 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 border-emerald-200"
          >
            {loading === "recalc-all" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span>
              {loading === "recalc-all" ? "Recalculating..." : "Recalculate All Scores"}
            </span>
          </Button>
        </div>
      </Card>

      {/* Auto-Generate Panel */}
      {showAutoGenerate && (
        <Card className="border-2 border-indigo-200 bg-indigo-50/70 p-5 shadow-xs space-y-4">
          <div>
            <CardTitle className="text-base font-bold text-indigo-950 flex items-center gap-2">
              <Zap className="h-4 w-4 text-indigo-700" />
              <span>Generate Round-Robin League Fixtures</span>
            </CardTitle>
            <CardDescription className="text-xs text-indigo-700 mt-1">
              Automatically creates all Gameweek rounds and matches so every
              group plays against every other group in the tournament.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label htmlFor="startGW" className="text-xs font-semibold text-indigo-900">
                Starting Gameweek (GW)
              </Label>
              <Input
                id="startGW"
                type="number"
                min={1}
                max={38}
                value={startGW}
                onChange={(e) => setStartGW(parseInt(e.target.value) || 1)}
                className="w-32 bg-white"
              />
            </div>
            <div className="text-xs text-indigo-700">
              {groups.length < 2 ? (
                <span className="inline-flex items-center gap-1 text-destructive font-semibold">
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
              <Button
                onClick={handleAutoGenerate}
                disabled={loading === "auto-generate" || groups.length < 2}
              >
                {loading === "auto-generate" && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                <span>
                  {loading === "auto-generate"
                    ? "Generating..."
                    : "Generate Fixtures Now"}
                </span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAutoGenerate(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Validation Issues */}
      {validationIssues.length > 0 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{validationIssues.length} issue(s) found:</AlertTitle>
          <AlertDescription className="mt-2">
            <ul className="space-y-1 text-sm list-disc list-inside">
              {validationIssues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Rounds List */}
      {rounds.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300 bg-white p-8 text-center">
          <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-gray-700">
            No Fixtures Scheduled Yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Use the &quot;Auto-Generate Round-Robin Fixtures&quot; button above or create
            rounds manually below.
          </p>
        </Card>
      ) : (
        rounds
          .sort((a, b) => a.roundNumber - b.roundNumber)
          .map((round) => (
            <Card
              key={round.id}
              className="border-gray-200 bg-white shadow-xs overflow-hidden"
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddMatch(round.id)}
                    className="h-7 text-xs gap-1 text-indigo-700 bg-indigo-50 border-indigo-200"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Match</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRound(round.id)}
                    className="h-7 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Round</span>
                  </Button>
                </div>
              </div>

              {/* Matches */}
              <div className="divide-y divide-gray-100 p-4">
                {round.matches.length === 0 ? (
                  <p className="text-sm text-gray-400 italic py-2">
                    No matches in this round. Click &quot;+ Add Match&quot; to schedule.
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
                            <Badge
                              variant={
                                match.status === "FINALIZED"
                                  ? "success"
                                  : match.status === "COMPLETED"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {match.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleDeleteMatch(match.id, round.id)
                              }
                              className="h-6 w-6 text-gray-400 hover:text-red-600"
                              title="Delete match"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
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
                            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
                            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
                                <Badge
                                  variant={match.result === "DRAW" ? "warning" : "success"}
                                  className="text-[11px]"
                                >
                                  {match.result === "DRAW"
                                    ? "DRAW"
                                    : match.result === "HOME_WIN"
                                      ? `${groupNameById(match.homeGroupId)} WIN`
                                      : `${groupNameById(match.awayGroupId)} WIN`}
                                </Badge>
                              )}
                            </div>
                          )}

                        {/* Match Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          {match.homeGroupId && match.awayGroupId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRecalculate(match.id)}
                              disabled={loading === `calc-${match.id}`}
                              className="h-7 text-xs text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100"
                            >
                              {loading === `calc-${match.id}` && (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              )}
                              <span>
                                {loading === `calc-${match.id}`
                                  ? "Calculating..."
                                  : "Calculate Score"}
                              </span>
                            </Button>
                          )}
                          {match.status === "COMPLETED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleFinalize(match.id)}
                              disabled={loading === `fin-${match.id}`}
                              className="h-7 text-xs text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                            >
                              {loading === `fin-${match.id}` && (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              )}
                              <span>
                                {loading === `fin-${match.id}`
                                  ? "Finalizing..."
                                  : "Finalize"}
                              </span>
                            </Button>
                          )}
                          {match.homeScore !== null && match.awayScore !== null && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="h-7 text-xs text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
                            >
                              <Link href={`/matches/${match.id}`} target="_blank">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                <span>View Match</span>
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </Card>
          ))
      )}

      {/* Manual Add Round */}
      {showAddRound ? (
        <Card className="border-2 border-dashed border-indigo-300 bg-indigo-50/70 p-4">
          <CardTitle className="text-sm font-bold text-indigo-900">Add New Round</CardTitle>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="roundName" className="text-xs font-medium text-indigo-700">
                Round Name (optional)
              </Label>
              <Input
                id="roundName"
                type="text"
                value={newRoundName}
                onChange={(e) => setNewRoundName(e.target.value)}
                placeholder="e.g., Round 1"
                className="bg-white"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="roundGW" className="text-xs font-medium text-indigo-700">
                Gameweek *
              </Label>
              <Input
                id="roundGW"
                type="number"
                value={newRoundGW}
                onChange={(e) => setNewRoundGW(parseInt(e.target.value))}
                min={1}
                max={38}
                className="bg-white"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={handleAddRound}
              disabled={loading === "add-round"}
            >
              {loading === "add-round" && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              <span>{loading === "add-round" ? "Creating..." : "Create Round"}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddRound(false)}
            >
              Cancel
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowAddRound(true)}
          className="w-full border-2 border-dashed py-5 text-sm font-medium text-gray-500 hover:border-indigo-300 hover:text-indigo-600"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Add Round Manually</span>
        </Button>
      )}
    </div>
  );
}
