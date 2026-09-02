"use client";

import { useState } from "react";
import { Sparkles, Eye, Shield } from "lucide-react";
import { FantasyTeamModal } from "./fantasy-team-modal";

export interface MatchPlayerScoreItem {
  id: string;
  gameweekPoints: number;
  isExcluded: boolean;
  activeChip: string | null;
  chipDeduction: number;
  member: {
    fplName: string;
    fplTeamName: string | null;
    fplId: number;
    isAdmin?: boolean;
  };
}

interface MatchSquadListProps {
  teamName: string;
  teamLogo?: string | null;
  scores: MatchPlayerScoreItem[];
  totalScore: number | null;
  gameweek: number;
  allowBenchBoost?: boolean;
  allowTripleCaptain?: boolean;
}

/**
 * Compact squad player breakdown list used inside Match cards on Tournament page
 */
export function MatchSquadList({
  teamName,
  teamLogo,
  scores,
  totalScore,
  gameweek,
  allowBenchBoost = true,
  allowTripleCaptain = true,
}: MatchSquadListProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<MatchPlayerScoreItem | null>(null);

  const included = scores.filter((s) => !s.isExcluded);
  const excluded = scores.filter((s) => s.isExcluded);
  const maxPoints =
    included.length > 0
      ? Math.max(...included.map((s) => s.gameweekPoints))
      : 0;

  if (scores.length === 0) {
    return (
      <div className="rounded-lg bg-white/[0.02] p-3 border border-white/5 text-center text-xs text-gray-500 italic">
        No player scores recorded
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg bg-white/[0.03] p-3 border border-white/5 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between text-xs pb-1.5 border-b border-white/5">
          <div className="flex items-center gap-1.5 font-bold text-gray-200 truncate">
            {teamLogo ? (
              <div className="relative flex h-4 w-4 shrink-0 items-center justify-center rounded bg-white/10 p-0.5">
                <img src={teamLogo} alt="" className="h-3.5 w-3.5 object-contain" />
              </div>
            ) : (
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-indigo-500/20 text-[9px] font-black text-indigo-300">
                {teamName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="truncate">{teamName} Players</span>
          </div>
          {totalScore !== null && (
            <span className="shrink-0 font-mono text-[11px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {totalScore} pts
            </span>
          )}
        </div>

        {/* Players List */}
        <div className="space-y-1">
          {included.map((s) => {
            const isTopScorer =
              s.gameweekPoints === maxPoints && s.gameweekPoints > 0;
            return (
              <button
                key={s.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedPlayer(s);
                }}
                className="group/item w-full flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-white/10 active:bg-white/15 transition cursor-pointer text-left border border-transparent hover:border-white/10"
                title={`Click to view ${s.member.fplName}'s fantasy squad and score`}
              >
                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                  <span className="font-semibold text-gray-200 group-hover/item:text-indigo-300 transition truncate">
                    {s.member.fplName}
                  </span>
                  {s.member.fplTeamName && (
                    <span className="text-[10px] text-gray-500 truncate hidden sm:inline">
                      ({s.member.fplTeamName})
                    </span>
                  )}
                  {s.activeChip && (
                    <span className="shrink-0 rounded bg-indigo-500/20 px-1 py-0.2 text-[9px] font-bold text-indigo-300 uppercase">
                      {s.activeChip === "bboost"
                        ? "BB"
                        : s.activeChip === "3xc"
                          ? "3XC"
                          : s.activeChip}
                    </span>
                  )}
                  {s.chipDeduction > 0 && (
                    <span className="shrink-0 text-[9px] text-amber-400 font-medium">
                      (-{s.chipDeduction})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="opacity-0 group-hover/item:opacity-100 transition text-[10px] text-indigo-300 font-medium flex items-center gap-0.5 hidden xs:flex">
                    <Eye className="h-3 w-3" />
                  </span>
                  <span
                    className={`shrink-0 font-mono font-bold px-1.5 py-0.5 rounded text-xs flex items-center gap-1 ${
                      isTopScorer
                        ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    {isTopScorer && (
                      <Sparkles className="h-2.5 w-2.5 text-amber-400" />
                    )}
                    <span>{s.gameweekPoints}</span>
                    <span className="text-[9px] font-normal text-gray-400">
                      pts
                    </span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Excluded Members (Admin) */}
        {excluded.length > 0 && (
          <div className="pt-1.5 border-t border-white/5 space-y-1">
            {excluded.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedPlayer(s);
                }}
                className="group/admin w-full flex items-center justify-between text-[11px] text-gray-500 hover:text-gray-400 px-1.5 py-0.5 italic hover:bg-white/5 rounded transition cursor-pointer text-left"
                title={`Click to view ${s.member.fplName}'s fantasy squad`}
              >
                <span className="truncate pr-2">
                  {s.member.fplName}{" "}
                  <span className="text-[10px] text-gray-600">
                    (Admin - excluded)
                  </span>
                </span>
                <span className="shrink-0 font-mono line-through text-gray-600">
                  {s.gameweekPoints} pts
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fantasy Team Modal */}
      {selectedPlayer && (
        <FantasyTeamModal
          isOpen={true}
          onClose={() => setSelectedPlayer(null)}
          fplId={selectedPlayer.member.fplId}
          managerName={selectedPlayer.member.fplName}
          fplTeamName={selectedPlayer.member.fplTeamName}
          tournamentTeamName={teamName}
          tournamentTeamLogo={teamLogo}
          gameweek={gameweek}
          allowBenchBoost={allowBenchBoost}
          allowTripleCaptain={allowTripleCaptain}
        />
      )}
    </>
  );
}

interface MatchScoreBreakdownProps {
  groupName: string;
  logo?: string | null;
  scores: MatchPlayerScoreItem[];
  total: number;
  isWinner: boolean;
  gameweek: number;
  allowBenchBoost?: boolean;
  allowTripleCaptain?: boolean;
}

/**
 * Detailed score breakdown card used on Match details page (/matches/[id])
 */
export function MatchScoreBreakdown({
  groupName,
  logo,
  scores,
  total,
  isWinner,
  gameweek,
  allowBenchBoost = true,
  allowTripleCaptain = true,
}: MatchScoreBreakdownProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<MatchPlayerScoreItem | null>(null);

  const included = scores.filter((s) => !s.isExcluded);
  const excluded = scores.filter((s) => s.isExcluded);

  return (
    <>
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            {logo && (
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10 p-0.5 border border-white/10">
                <img
                  src={logo}
                  alt={groupName}
                  className="h-6 w-6 object-contain"
                />
              </div>
            )}
            <h3
              className={`text-lg font-bold ${
                isWinner ? "text-emerald-400" : "text-white"
              }`}
            >
              {groupName}
            </h3>
          </div>
          <span className="text-2xl font-bold font-mono text-white">{total}</span>
        </div>

        {/* Included Members */}
        <div className="space-y-1.5">
          {included.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedPlayer(s)}
              className="group/item w-full flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-white/10 active:bg-white/15 transition cursor-pointer text-left border border-transparent hover:border-white/10"
              title={`Click to view ${s.member.fplName}'s fantasy squad and points`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium group-hover/item:text-indigo-300 transition">
                    {s.member.fplName}
                  </span>
                  {s.activeChip && (
                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.2 text-[10px] font-bold text-indigo-300 uppercase">
                      {s.activeChip === "bboost"
                        ? "Bench Boost"
                        : s.activeChip === "3xc"
                          ? "Triple Captain"
                          : s.activeChip}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {s.member.fplTeamName && <span>{s.member.fplTeamName}</span>}
                  {s.chipDeduction && s.chipDeduction > 0 ? (
                    <span className="text-amber-400/95 font-medium">
                      (-{s.chipDeduction} pts{" "}
                      {s.activeChip === "bboost"
                        ? "bench excluded"
                        : "chip adjustment"}
                      )
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="opacity-0 group-hover/item:opacity-100 transition text-xs text-indigo-300 flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline text-[11px]">Squad</span>
                </span>
                <span className="font-mono font-bold text-white text-base bg-white/5 px-2.5 py-0.5 rounded border border-white/5">
                  {s.gameweekPoints}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Total */}
        <div className="mt-3 border-t border-white/10 pt-2 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-400">TOTAL</span>
          <span className="font-mono font-bold text-indigo-400 text-xl">
            {total}
          </span>
        </div>

        {/* Excluded (Admin) */}
        {excluded.length > 0 && (
          <div className="mt-4 rounded-lg bg-yellow-500/10 p-3">
            <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2">
              Admin — Excluded from Score
            </p>
            {excluded.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedPlayer(s)}
                className="w-full flex items-center justify-between text-sm py-1 px-1 rounded hover:bg-yellow-500/15 transition cursor-pointer text-left"
                title={`Click to view ${s.member.fplName}'s fantasy squad`}
              >
                <span className="text-yellow-400/70 italic">
                  {s.member.fplName}
                </span>
                <div className="flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5 text-yellow-400/50" />
                  <span className="font-mono text-yellow-400/70 line-through">
                    {s.gameweekPoints}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fantasy Team Modal */}
      {selectedPlayer && (
        <FantasyTeamModal
          isOpen={true}
          onClose={() => setSelectedPlayer(null)}
          fplId={selectedPlayer.member.fplId}
          managerName={selectedPlayer.member.fplName}
          fplTeamName={selectedPlayer.member.fplTeamName}
          tournamentTeamName={groupName}
          tournamentTeamLogo={logo}
          gameweek={gameweek}
          allowBenchBoost={allowBenchBoost}
          allowTripleCaptain={allowTripleCaptain}
        />
      )}
    </>
  );
}
