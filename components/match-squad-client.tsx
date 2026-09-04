"use client";

import { useState } from "react";
import { Sparkles, Eye, Shield } from "lucide-react";
import { FantasyTeamModal } from "./fantasy-team-modal";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

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
      <div className="rounded-[10px] bg-[#F9F9F9] p-3 border border-[#EBEBEB] text-center text-xs text-[#888888] italic">
        No player scores recorded yet
      </div>
    );
  }

  return (
    <>
      <div className="rounded-[12px] bg-[#FBFBFB] p-3 border border-[#E5E5E5] space-y-2">
        {/* Squad Header */}
        <div className="flex items-center justify-between text-xs pb-2 border-b border-[#EAEAEA]">
          <div className="flex items-center gap-2 font-bold text-[#37003C] min-w-0">
            {teamLogo ? (
              <div className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white p-0.5 border border-[#E5E5E5]">
                <img src={teamLogo} alt="" className="h-4 w-4 object-contain" />
              </div>
            ) : (
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#37003C] text-[9px] font-black text-[#00FF87]">
                {teamName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="truncate">{teamName} Squad</span>
          </div>
          {totalScore !== null && (
            <span className="font-extrabold text-xs text-[#37003C] bg-[#37003C]/5 px-2 py-0.5 rounded-[6px] border border-[#37003C]/10">
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
                className="group/item w-full flex items-center justify-between text-xs py-1.5 px-2 rounded-[8px] bg-white hover:bg-[#F3EDF4] active:bg-[#ECE0ED] transition-colors cursor-pointer text-left border border-[#EEEEEE] hover:border-[#37003C]/20 shadow-2xs"
                title={`Click to inspect ${s.member.fplName}'s fantasy lineup and points`}
              >
                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                  {isTopScorer && (
                    <span title="Top Scorer" className="inline-flex shrink-0">
                      <Sparkles className="h-3 w-3 text-[#D97706]" />
                    </span>
                  )}
                  <span className="font-bold text-[#1F1F1F] group-hover/item:text-[#37003C] transition-colors truncate">
                    {s.member.fplName}
                  </span>
                  {s.member.fplTeamName && (
                    <span className="text-[10px] text-[#777777] truncate hidden sm:inline">
                      ({s.member.fplTeamName})
                    </span>
                  )}
                  {s.activeChip && (
                    <span className="shrink-0 px-1.5 py-0.2 text-[9px] font-extrabold uppercase rounded bg-[#37003C]/10 text-[#37003C]">
                      {s.activeChip === "bboost"
                        ? "BB"
                        : s.activeChip === "3xc"
                          ? "3XC"
                          : s.activeChip}
                    </span>
                  )}
                  {s.chipDeduction > 0 && (
                    <span className="shrink-0 text-[10px] text-[#D97706] font-semibold">
                      (-{s.chipDeduction})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="opacity-0 group-hover/item:opacity-100 transition-opacity text-[10px] text-[#37003C] font-semibold flex items-center gap-0.5 hidden xs:flex">
                    <Eye className="h-3 w-3" />
                  </span>
                  <span
                    className={`inline-flex items-center justify-center font-bold text-xs px-2 py-0.5 rounded-[6px] ${
                      isTopScorer
                        ? "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
                        : "bg-[#F3F4F6] text-[#1F1F1F]"
                    }`}
                  >
                    {s.gameweekPoints} pts
                  </span>
                </div>
              </button>
            );
          })}

          {/* Excluded Admin notice in compact squad list */}
          {excluded.length > 0 && (
            <div className="pt-1.5 mt-1 border-t border-[#EAEAEA] space-y-1">
              {excluded.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedPlayer(s);
                  }}
                  className="w-full flex items-center justify-between text-xs py-1.5 px-2 rounded-[8px] bg-[#FFFBEB] border border-[#FDE68A] hover:bg-[#FEF3C7] transition-colors cursor-pointer text-left"
                  title="Organizer · Excluded from team scoring per tournament rules"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Shield className="h-3 w-3 text-[#D97706] shrink-0" />
                    <div className="truncate leading-tight">
                      <span className="font-semibold text-[#92400E] truncate mr-1">
                        {s.member.fplName}
                      </span>
                      <span className="text-[10px] text-[#B45309] font-medium">
                        Organizer · Excluded
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#92400E] bg-[#FEF3C7] px-1.5 py-0.2 rounded border border-[#FCD34D]">
                      EXCLUDED
                    </span>
                    <span className="font-semibold text-xs text-[#92400E]/70 line-through">
                      {s.gameweekPoints} pts
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
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
      <Card className="rounded-[16px] border border-[#E5E5E5] bg-white p-5 shadow-fpl-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EAEAEA]">
          <div className="flex items-center gap-2.5">
            {logo ? (
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-white p-1 border border-[#E5E5E5] shadow-xs">
                <img
                  src={logo}
                  alt={groupName}
                  className="h-7 w-7 object-contain"
                />
              </div>
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#37003C] text-xs font-black text-[#00FF87]">
                {groupName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h3
                className={`text-lg font-bold ${
                  isWinner ? "text-[#008744]" : "text-[#37003C]"
                }`}
              >
                {groupName}
              </h3>
              {isWinner && (
                <span className="text-[10px] font-black uppercase tracking-wider text-[#008744] bg-[#00FF87]/20 px-1.5 py-0.2 rounded">
                  Winner (+3 PTS)
                </span>
              )}
            </div>
          </div>
          <span className="text-2xl font-black text-[#37003C]">{total} pts</span>
        </div>

        {/* Included Members */}
        <div className="space-y-1.5">
          {included.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedPlayer(s)}
              className="group/item w-full flex items-center justify-between text-sm py-2 px-2.5 rounded-[8px] hover:bg-[#F9F9F9] active:bg-[#F0F0F0] transition-colors cursor-pointer text-left border border-transparent hover:border-[#E5E5E5]"
              title={`Click to view ${s.member.fplName}'s fantasy squad and points`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[#1F1F1F] font-bold group-hover/item:text-[#37003C] transition-colors">
                    {s.member.fplName}
                  </span>
                  {s.activeChip && (
                    <span className="rounded bg-[#37003C]/10 text-[#37003C] px-1.5 py-0.2 text-[10px] uppercase font-bold">
                      {s.activeChip === "bboost"
                        ? "Bench Boost"
                        : s.activeChip === "3xc"
                          ? "Triple Captain"
                          : s.activeChip}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#777777]">
                  {s.member.fplTeamName && <span>{s.member.fplTeamName}</span>}
                  {s.chipDeduction && s.chipDeduction > 0 ? (
                    <span className="text-[#D97706] font-semibold">
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
                <span className="opacity-0 group-hover/item:opacity-100 transition-opacity text-xs text-[#37003C] font-semibold flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline text-[11px]">Squad</span>
                </span>
                <span className="font-bold text-sm text-[#37003C] bg-[#F5F5F5] px-2.5 py-1 rounded-[6px]">
                  {s.gameweekPoints} pts
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Total Footer */}
        <div className="mt-4 border-t border-[#EAEAEA] pt-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#777777]">TOTAL SQUAD SCORE</span>
          <span className="font-black text-[#37003C] text-xl">
            {total} pts
          </span>
        </div>

        {/* Excluded (Admin) */}
        {excluded.length > 0 && (
          <div className="mt-4 rounded-[12px] bg-[#FFFBEB] p-3.5 border border-[#FDE68A] space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#92400E] uppercase tracking-wider">
              <Shield className="h-3.5 w-3.5 text-[#D97706]" />
              <span>Organizer — Excluded from Score</span>
            </div>
            {excluded.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedPlayer(s)}
                className="w-full flex items-center justify-between text-xs py-1.5 px-2 rounded-[6px] hover:bg-[#FEF3C7] transition-colors cursor-pointer text-left"
                title={`Click to view ${s.member.fplName}'s fantasy squad`}
              >
                <span className="text-[#92400E] font-semibold truncate mr-2">
                  {s.member.fplName} (Admin)
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#92400E] bg-[#FEF3C7] px-1.5 py-0.2 rounded border border-[#FCD34D]">
                    EXCLUDED
                  </span>
                  <span className="font-bold text-[#92400E]/70 line-through">
                    {s.gameweekPoints} pts
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

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
