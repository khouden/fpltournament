"use client";

import Link from "next/link";

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
  homeGroup?: { id: string; name: string } | null;
  awayGroup?: { id: string; name: string } | null;
}

interface Round {
  id: string;
  name: string | null;
  roundNumber: number;
  gameweek: number;
  matches: Match[];
}

interface TournamentBracketProps {
  rounds: Round[];
  groups: Group[];
}

export function TournamentBracket({ rounds, groups }: TournamentBracketProps) {
  const sortedRounds = [...rounds].sort((a, b) => a.roundNumber - b.roundNumber);
  const allMatches = sortedRounds.flatMap((r) => r.matches);

  const resolveGroupName = (
    match: Match,
    side: "home" | "away"
  ): { name: string; isResolved: boolean } => {
    // 1. Direct group attached
    const group = side === "home" ? match.homeGroup : match.awayGroup;
    if (group) return { name: group.name, isResolved: true };

    const groupId = side === "home" ? match.homeGroupId : match.awayGroupId;
    if (groupId) {
      const found = groups.find((g) => g.id === groupId);
      if (found) return { name: found.name, isResolved: true };
    }

    // 2. Winner of Match reference
    const winnerRef =
      side === "home"
        ? match.homeWinnerOfMatchId
        : match.awayWinnerOfMatchId;

    if (winnerRef) {
      const parent = allMatches.find((m) => m.id === winnerRef);
      if (parent) {
        if (parent.winnerId) {
          const winnerGroup = groups.find((g) => g.id === parent.winnerId);
          if (winnerGroup) return { name: winnerGroup.name, isResolved: true };
        }
        return {
          name: `Winner Match ${parent.matchNumber}`,
          isResolved: false,
        };
      }
    }

    return { name: "TBD", isResolved: false };
  };

  if (sortedRounds.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-gray-400">
        No tournament bracket scheduled yet.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="flex min-w-[650px] gap-6 lg:gap-8 items-stretch justify-start">
        {sortedRounds.map((round, rIndex) => (
          <div
            key={round.id}
            className="flex-1 flex flex-col min-w-[240px] max-w-[320px]"
          >
            {/* Round Column Header */}
            <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-3 text-center backdrop-blur">
              <h3 className="font-bold text-white text-base">
                {round.name || `Round ${round.roundNumber}`}
              </h3>
              <p className="text-xs text-indigo-300">
                Gameweek {round.gameweek}
              </p>
            </div>

            {/* Matches in Round Column */}
            <div className="flex flex-col justify-around flex-1 gap-6">
              {round.matches
                .sort((a, b) => a.matchNumber - b.matchNumber)
                .map((match) => {
                  const homeInfo = resolveGroupName(match, "home");
                  const awayInfo = resolveGroupName(match, "away");
                  const isFinished =
                    match.status === "COMPLETED" ||
                    match.status === "FINALIZED";
                  const isHomeWinner =
                    match.result === "HOME_WIN" ||
                    (match.winnerId &&
                      (match.homeGroupId === match.winnerId ||
                        match.homeGroup?.id === match.winnerId));
                  const isAwayWinner =
                    match.result === "AWAY_WIN" ||
                    (match.winnerId &&
                      (match.awayGroupId === match.winnerId ||
                        match.awayGroup?.id === match.winnerId));
                  const isDraw = match.result === "DRAW";

                  return (
                    <Link
                      key={match.id}
                      href={`/matches/${match.id}`}
                      className="group block rounded-xl border border-white/10 bg-black/40 p-4 shadow-lg backdrop-blur transition hover:border-indigo-500/50 hover:bg-black/60"
                    >
                      {/* Match Number & Status */}
                      <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2 border-b border-white/5 pb-1">
                        <span className="font-semibold">Match {match.matchNumber}</span>
                        <span
                          className={`font-bold ${
                            match.status === "FINALIZED"
                              ? "text-emerald-400"
                              : match.status === "COMPLETED"
                                ? "text-blue-400"
                                : "text-gray-500"
                          }`}
                        >
                          {match.status}
                        </span>
                      </div>

                      {/* Home Participant Box */}
                      <div
                        className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 transition ${
                          isHomeWinner
                            ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30"
                            : homeInfo.isResolved
                              ? "text-white"
                              : "text-gray-500 italic"
                        }`}
                      >
                        <span className="truncate text-sm">
                          {isHomeWinner && <span className="mr-1">👑</span>}
                          {homeInfo.name}
                        </span>
                        {match.homeScore !== null && (
                          <span className="font-mono text-sm font-bold ml-2">
                            {match.homeScore}
                          </span>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="my-1 text-center text-[10px] font-bold text-gray-600">
                        VS
                      </div>

                      {/* Away Participant Box */}
                      <div
                        className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 transition ${
                          isAwayWinner
                            ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30"
                            : awayInfo.isResolved
                              ? "text-white"
                              : "text-gray-500 italic"
                        }`}
                      >
                        <span className="truncate text-sm">
                          {isAwayWinner && <span className="mr-1">👑</span>}
                          {awayInfo.name}
                        </span>
                        {match.awayScore !== null && (
                          <span className="font-mono text-sm font-bold ml-2">
                            {match.awayScore}
                          </span>
                        )}
                      </div>

                      {/* Match Outcome Footer */}
                      {isDraw && (
                        <div className="mt-2 text-center text-[11px] font-bold text-yellow-400 bg-yellow-500/10 rounded py-0.5 border border-yellow-500/20">
                          DRAW (160 - 160)
                        </div>
                      )}

                      <div className="mt-2 text-center text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition">
                        View Match Breakdown →
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
