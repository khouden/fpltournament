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
      <Card
        className={`rounded-2xl border bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-all ${
          isWinner
            ? "border-[#00FF87]/40 border-t-4 border-t-[#00FF87]"
            : "border-[#E5E5E5]"
        }`}
      >
        <div>
          {/* Card Header: Team Identity & Total Score */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#EAEAEA]">
            <div className="flex items-center gap-3 min-w-0">
              {logo ? (
                <div className="relative flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 border border-[#E5E5E5] shadow-xs">
                  <img
                    src={logo}
                    alt={groupName}
                    className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-[#37003C] text-sm font-black text-[#00FF87] shadow-xs">
                  {groupName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    className={`text-lg sm:text-xl font-bold truncate ${
                      isWinner ? "text-[#008744]" : "text-[#1F1F1F]"
                    }`}
                  >
                    {groupName}
                  </h3>
                  {isWinner && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#008744] bg-[#00FF87]/20 px-2 py-0.5 rounded-full border border-[#00FF87]/30">
                      Winner (+3 PTS)
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#666666] font-medium mt-0.5">
                  {included.length} Contributing {included.length === 1 ? "Manager" : "Managers"}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0 pl-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#37003C]">
                {total}
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#666666] ml-1">pts</span>
            </div>
          </div>

          {/* Included Managers Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                INCLUDED MANAGERS
              </span>
              <span className="text-xs text-[#8A8A8A] font-medium">
                Gameweek {gameweek}
              </span>
            </div>

            {included.length === 0 ? (
              <div className="rounded-xl bg-[#F9F9F9] p-4 text-center text-xs text-[#8A8A8A] italic border border-[#EEEEEE]">
                No included manager scores recorded
              </div>
            ) : (
              <div className="space-y-2">
                {included.map((s) => {
                  const hasDeduction = s.chipDeduction > 0;
                  const chipReason =
                    s.activeChip === "bboost"
                      ? "Bench players excluded"
                      : s.activeChip === "3xc"
                        ? "Triple Captain adjustment"
                        : "Chip rule deduction";

                  return (
                    <div
                      key={s.id}
                      className="group/item w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-[#F9F9F9] hover:bg-[#F3EDF4] border border-[#EEEEEE] hover:border-[#37003C]/25 transition-all text-left"
                    >
                      {/* Manager Information */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[#1F1F1F] group-hover/item:text-[#37003C] transition-colors truncate">
                            {s.member.fplName}
                          </span>
                          {s.activeChip && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                hasDeduction
                                  ? "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
                                  : "bg-[#37003C]/10 text-[#37003C] border border-[#37003C]/15"
                              }`}
                            >
                              {s.activeChip === "bboost"
                                ? "Bench Boost"
                                : s.activeChip === "3xc"
                                  ? "Triple Captain"
                                  : s.activeChip === "freehit"
                                    ? "Free Hit"
                                    : s.activeChip === "wildcard"
                                      ? "Wildcard"
                                      : s.activeChip}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-[#666666] mt-0.5 flex-wrap">
                          {s.member.fplTeamName && (
                            <span className="truncate">{s.member.fplTeamName}</span>
                          )}
                          {hasDeduction && (
                            <span className="text-[#D97706] font-semibold flex items-center gap-1">
                              • −{s.chipDeduction} pts ({chipReason})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Points Pill & Squad Button */}
                      <div className="flex items-center gap-2.5 justify-between sm:justify-end shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#EAEAEA]">
                        {/* Gameweek Points Pill */}
                        <div className="inline-flex items-center px-2.5 py-1 rounded-[8px] bg-[#37003C]/5 border border-[#37003C]/10 text-xs font-bold text-[#37003C]">
                          <span className="text-sm font-extrabold mr-1">
                            {s.gameweekPoints}
                          </span>
                          <span className="text-[11px] font-semibold text-[#666666]">pts</span>
                        </div>

                        {/* Visible Squad Action Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedPlayer(s)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-xs font-bold text-[#37003C] bg-white hover:bg-[#37003C] hover:text-white border border-[#E5E5E5] hover:border-[#37003C] shadow-2xs transition-colors cursor-pointer"
                          title={`Inspect ${s.member.fplName}'s 15-player squad lineup`}
                          aria-label={`View squad for ${s.member.fplName}`}
                        >
                          <Eye className="h-3.5 w-3.5 shrink-0" />
                          <span>Squad</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Team Total Row */}
          <div className="mt-5 border-t-2 border-[#EAEAEA] pt-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#666666]">
                TEAM TOTAL
              </span>
              <p className="text-[11px] text-[#8A8A8A]">
                Official score calculated from included managers
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#37003C]">
                {total}
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#666666] ml-1">pts</span>
            </div>
          </div>
        </div>

        {/* Admin — Excluded from Score Section */}
        {excluded.length > 0 && (
          <div className="mt-6 rounded-xl bg-[#FFFBEB] p-4 border border-[#FDE68A] space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#92400E] uppercase tracking-wider">
              <Shield className="h-4 w-4 text-[#D97706] shrink-0" />
              <span>ADMIN — EXCLUDED FROM SCORE</span>
            </div>
            <p className="text-[11px] text-[#B45309] leading-snug">
              Organizer Account · This score does not affect the official team total. Admin squad remains inspectable below.
            </p>

            <div className="space-y-1.5 pt-1">
              {excluded.map((s) => (
                <div
                  key={s.id}
                  className="w-full flex items-center justify-between gap-2 p-2.5 rounded-[8px] bg-white/70 border border-[#FDE68A]/60 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#92400E] font-bold text-xs truncate">
                        {s.member.fplName}
                      </span>
                      <span className="text-[10px] font-semibold text-[#B45309]">
                        (Admin)
                      </span>
                    </div>
                    {s.member.fplTeamName && (
                      <p className="text-[10px] text-[#92400E]/80 truncate">
                        {s.member.fplTeamName}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#92400E] bg-[#FEF3C7] px-1.5 py-0.5 rounded border border-[#FCD34D]">
                      EXCLUDED
                    </span>
                    <span
                      className="font-bold text-xs text-[#92400E]/60 line-through mr-1"
                      title="Admin points excluded from official score"
                    >
                      {s.gameweekPoints} pts
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPlayer(s)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] text-xs font-bold text-[#92400E] bg-white hover:bg-[#92400E] hover:text-white border border-[#FDE68A] transition-colors cursor-pointer"
                      title={`Inspect ${s.member.fplName}'s squad`}
                      aria-label={`View squad for admin ${s.member.fplName}`}
                    >
                      <Eye className="h-3 w-3" />
                      <span>Squad</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
