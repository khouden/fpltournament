"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Crown,
  Trophy,
  Users,
  Calendar,
  Search,
  Shield,
  ExternalLink,
  Eye,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FantasyTeamModal } from "@/components/fantasy-team-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface TeamMemberItem {
  id: string;
  fplName: string;
  fplTeamName: string | null;
  fplId: number;
  isAdmin: boolean;
  totalPoints: number;
  matchCount: number;
  highestPoints: number;
  averagePoints: number;
  isTopPlayer?: boolean;
}

export interface TeamFixtureItem {
  id: string;
  roundNumber: number;
  roundName: string;
  gameweek: number;
  opponentName: string;
  opponentLogo: string | null;
  isHome: boolean;
  teamScore: number | null;
  opponentScore: number | null;
  status: string;
  result: "WIN" | "DRAW" | "LOSS" | "SCHEDULED";
}

export interface TeamDirectoryItem {
  id: string;
  name: string;
  logo: string | null;
  topPlayerName: string;
  topPlayerPoints?: number;
  topPlayerTeamName?: string | null;
  topPlayerFplId?: number;
  managerName?: string;
  activePlayerCount: number;
  rank?: number;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  pointsFor?: number;
  pointsAgainst?: number;
  pointsDiff?: number;
  leaguePoints?: number;
  form?: ("W" | "D" | "L")[];
  members: TeamMemberItem[];
  fixtures?: TeamFixtureItem[];
}

export interface TeamDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamDirectoryItem | null;
  tournamentName?: string;
  seasonDisplay?: string;
  currentGameweek?: number;
  allowBenchBoost?: boolean;
  allowTripleCaptain?: boolean;
}

export function TeamDetailModal({
  isOpen,
  onClose,
  team,
  tournamentName = "Tournament",
  seasonDisplay,
  currentGameweek = 1,
  allowBenchBoost = true,
  allowTripleCaptain = true,
}: TeamDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"members" | "fixtures">("members");
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<{
    fplId: number;
    name: string;
    fplTeamName: string | null;
  } | null>(null);

  // Filter squad members based on search
  const filteredMembers = useMemo(() => {
    if (!team) return [];
    if (!memberSearch.trim()) return team.members;
    const query = memberSearch.toLowerCase().trim();
    return team.members.filter(
      (m) =>
        m.fplName.toLowerCase().includes(query) ||
        (m.fplTeamName && m.fplTeamName.toLowerCase().includes(query))
    );
  }, [team, memberSearch]);

  // Find top player object if available
  const topMember = useMemo(() => {
    if (!team || team.members.length === 0) return null;
    const eligible = team.members.filter((m) => !m.isAdmin);
    if (eligible.length === 0) return team.members[0];
    return eligible.reduce((prev, current) =>
      prev.totalPoints > current.totalPoints ? prev : current
    );
  }, [team]);

  if (!team) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="max-w-3xl w-[95vw] sm:w-full p-0 overflow-hidden bg-[#F8F9FB] border border-gray-200/90 rounded-3xl shadow-2xl max-h-[92vh] flex flex-col focus:outline-none"
        >
          {/* Accessible Title */}
          <DialogHeader className="sr-only">
            <DialogTitle>{team.name} Team Details</DialogTitle>
          </DialogHeader>

          {/* ========================================================================= */}
          {/* MODAL HERO BANNER (Premier League Aesthetic)                               */}
          {/* ========================================================================= */}
          <div className="relative bg-gradient-to-br from-[#0B081E] via-[#200028] to-[#37003C] p-6 sm:p-7 text-white shrink-0 overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-[#00FF87]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-[#E90052]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                {/* Team Crest */}
                <div className="relative shrink-0">
                  {team.logo ? (
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white/95 p-2 shadow-xl border border-white/20 flex items-center justify-center overflow-hidden">
                      <img
                        src={team.logo}
                        alt={team.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-[#37003C] border-2 border-[#00FF87]/40 text-[#00FF87] font-black text-2xl flex items-center justify-center shadow-xl">
                      {team.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  {team.rank && (
                    <div className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full bg-[#00FF87] text-[#0B081E] text-[11px] font-black flex items-center justify-center shadow-md border-2 border-[#0B081E]">
                      #{team.rank}
                    </div>
                  )}
                </div>

                {/* Team Info */}
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate drop-shadow-sm">
                      {team.name}
                    </h2>
                  </div>

                  <p className="text-xs text-white/70 font-medium truncate flex items-center gap-1.5">
                    <span>{tournamentName}</span>
                    {seasonDisplay && (
                      <>
                        <span className="text-white/30">•</span>
                        <span>{seasonDisplay}</span>
                      </>
                    )}
                  </p>

                  {/* Badges Bar */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {team.leaguePoints !== undefined && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#00FF87] text-[#0B081E] shadow-xs">
                        <Trophy className="h-3 w-3" />
                        <span>{team.leaguePoints} PTS</span>
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 backdrop-blur-md text-white/90 border border-white/15">
                      <Users className="h-3 w-3 text-[#00FF87]" />
                      <span>{team.members.length} Squad Members</span>
                    </span>

                    {team.form && team.form.length > 0 && (
                      <div className="hidden sm:flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15">
                        <span className="text-[10px] text-white/60 font-bold uppercase mr-0.5">
                          Form:
                        </span>
                        {team.form.slice(-5).map((f, i) => (
                          <span
                            key={i}
                            className={cn(
                              "w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center",
                              f === "W"
                                ? "bg-emerald-500 text-white"
                                : f === "D"
                                ? "bg-amber-500 text-white"
                                : "bg-rose-500 text-white"
                            )}
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SCROLLABLE MODAL BODY                                                     */}
          {/* ========================================================================= */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Quick Performance Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl p-3.5 border border-gray-200/80 shadow-2xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Standing Rank
                </div>
                <div className="text-xl font-black text-gray-900 mt-0.5 flex items-center gap-1.5">
                  <span className="text-[#37003C]">#{team.rank || "—"}</span>
                  {team.rank === 1 && (
                    <Crown className="h-4 w-4 text-amber-500 fill-amber-500" />
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-gray-200/80 shadow-2xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Match Record
                </div>
                <div className="text-xl font-black text-gray-900 mt-0.5">
                  <span className="text-emerald-700">{team.won ?? 0}W</span>
                  <span className="text-gray-300 mx-1">·</span>
                  <span className="text-amber-700">{team.drawn ?? 0}D</span>
                  <span className="text-gray-300 mx-1">·</span>
                  <span className="text-rose-700">{team.lost ?? 0}L</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-gray-200/80 shadow-2xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Points For / Against
                </div>
                <div className="text-xl font-black text-gray-900 mt-0.5">
                  <span>{team.pointsFor?.toLocaleString() ?? 0}</span>
                  <span className="text-gray-400 text-xs font-bold mx-1">/</span>
                  <span className="text-gray-500 text-sm font-semibold">
                    {team.pointsAgainst?.toLocaleString() ?? 0}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-gray-200/80 shadow-2xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Active Players
                </div>
                <div className="text-xl font-black text-gray-900 mt-0.5 flex items-center gap-1.5">
                  <span className="text-emerald-700">{team.activePlayerCount}</span>
                  <span className="text-xs font-semibold text-gray-400">
                    of {team.members.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Player Spotlight Card */}
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white rounded-2xl border border-amber-200/80 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/15 border border-amber-300 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                  <Crown className="h-6 w-6 text-amber-600 fill-amber-500/30" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md">
                      Team Top Player
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-gray-900 truncate mt-0.5">
                    {team.topPlayerName}
                  </h4>
                  {team.topPlayerTeamName && (
                    <p className="text-xs text-gray-600 font-medium truncate">
                      {team.topPlayerTeamName}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 border-amber-200/50 pt-3 sm:pt-0">
                {team.topPlayerPoints !== undefined && team.topPlayerPoints > 0 && (
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase text-amber-800">
                      Total Points
                    </div>
                    <div className="text-lg font-black text-[#37003C]">
                      {team.topPlayerPoints} pts
                    </div>
                  </div>
                )}

                {topMember && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setSelectedPlayer({
                        fplId: topMember.fplId,
                        name: topMember.fplName,
                        fplTeamName: topMember.fplTeamName,
                      })
                    }
                    className="h-9 px-3.5 text-xs font-bold border-amber-300 bg-white text-amber-900 hover:bg-amber-50 rounded-xl transition-all gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5 text-amber-700" />
                    <span>View Lineup</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Navigation Tabs (Squad Roster vs Fixtures) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200/90 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("members")}
                    className={cn(
                      "flex items-center gap-2 py-2 px-3.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer",
                      activeTab === "members"
                        ? "bg-[#37003C] text-white shadow-xs"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <Users className="h-4 w-4" />
                    <span>Squad Roster</span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.2 rounded-full font-black",
                        activeTab === "members"
                          ? "bg-white/20 text-white"
                          : "bg-gray-200 text-gray-700"
                      )}
                    >
                      {team.members.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("fixtures")}
                    className={cn(
                      "flex items-center gap-2 py-2 px-3.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer",
                      activeTab === "fixtures"
                        ? "bg-[#37003C] text-white shadow-xs"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Fixtures &amp; Matches</span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.2 rounded-full font-black",
                        activeTab === "fixtures"
                          ? "bg-white/20 text-white"
                          : "bg-gray-200 text-gray-700"
                      )}
                    >
                      {team.fixtures?.length || 0}
                    </span>
                  </button>
                </div>

                {activeTab === "members" && team.members.length > 5 && (
                  <div className="relative w-44 sm:w-56">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Filter members..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="h-8 pl-8 pr-2 text-xs rounded-xl bg-white border-gray-200"
                    />
                  </div>
                )}
              </div>

              {/* ===================================================================== */}
              {/* TAB 1: SQUAD MEMBERS ROSTER                                            */}
              {/* ===================================================================== */}
              {activeTab === "members" && (
                <div className="space-y-2.5">
                  {filteredMembers.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 text-xs text-gray-500">
                      No members matched your search criteria.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-2xs">
                      {filteredMembers.map((member, idx) => {
                        const isTop = member.fplName === team.topPlayerName;
                        return (
                          <div
                            key={member.id}
                            className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-gray-50/80 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Avatar / Number */}
                              <div
                                className={cn(
                                  "h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs",
                                  isTop
                                    ? "bg-amber-100 text-amber-800 border border-amber-300 font-black"
                                    : member.isAdmin
                                    ? "bg-gray-100 text-gray-500 border border-gray-200"
                                    : "bg-gray-100 text-gray-700 border border-gray-200"
                                )}
                              >
                                {isTop ? (
                                  <Crown className="h-4 w-4 text-amber-600 fill-amber-500/20" />
                                ) : (
                                  idx + 1
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="font-extrabold text-sm text-gray-900 truncate">
                                    {member.fplName}
                                  </h5>

                                  {isTop && (
                                    <span className="text-[10px] font-black text-amber-800 bg-amber-50 border border-amber-200/70 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                                      <Crown className="h-2.5 w-2.5" /> Top Scorer
                                    </span>
                                  )}

                                  {member.isAdmin && (
                                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                                      <Shield className="h-2.5 w-2.5" /> Excluded Admin
                                    </span>
                                  )}
                                </div>

                                {member.fplTeamName && (
                                  <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                                    {member.fplTeamName}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Stats & Action */}
                            <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                              <div className="text-right">
                                <div className="text-sm font-black text-[#37003C]">
                                  {member.totalPoints} pts
                                </div>
                                <div className="text-[10px] font-semibold text-gray-400">
                                  {member.matchCount}{" "}
                                  {member.matchCount === 1 ? "match" : "matches"}
                                </div>
                              </div>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setSelectedPlayer({
                                    fplId: member.fplId,
                                    name: member.fplName,
                                    fplTeamName: member.fplTeamName,
                                  })
                                }
                                className="h-8 px-2.5 text-xs font-bold border-gray-200 text-[#37003C] hover:bg-[#37003C]/5 rounded-xl transition-all gap-1 cursor-pointer"
                                title="Inspect FPL Squad"
                              >
                                <Eye className="h-3 w-3" />
                                <span className="hidden sm:inline">Squad</span>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ===================================================================== */}
              {/* TAB 2: TOURNAMENT FIXTURES & RESULTS                                  */}
              {/* ===================================================================== */}
              {activeTab === "fixtures" && (
                <div className="space-y-2.5">
                  {!team.fixtures || team.fixtures.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 text-xs text-gray-500">
                      No tournament fixtures recorded for this club yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {team.fixtures.map((fixture) => {
                        const isLive =
                          fixture.status === "IN_PROGRESS" || fixture.status === "LIVE";
                        const isCompleted =
                          fixture.status === "COMPLETED" || fixture.status === "FINALIZED";
                        return (
                          <div
                            key={fixture.id}
                            className={cn(
                              "relative overflow-hidden rounded-2xl p-4 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs",
                              isLive
                                ? "border-rose-300/90 bg-gradient-to-r from-rose-50/50 via-white to-rose-50/30"
                                : isCompleted
                                ? "border-gray-200/80 bg-white hover:border-gray-300"
                                : "border-gray-200/60 bg-[#FAFAFA]"
                            )}
                          >
                            {/* Accent Bar on Left */}
                            {isLive && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
                            )}
                            {isCompleted && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00D06C]" />
                            )}

                            <div className="flex items-center gap-3 min-w-0 pl-1.5">
                              <span
                                className={cn(
                                  "text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0",
                                  isLive
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-gray-100 text-gray-500"
                                )}
                              >
                                GW {fixture.gameweek}
                              </span>

                              <div className="flex items-center gap-2 min-w-0">
                                {fixture.opponentLogo ? (
                                  <img
                                    src={fixture.opponentLogo}
                                    alt={fixture.opponentName}
                                    className="h-6 w-6 object-contain shrink-0"
                                  />
                                ) : (
                                  <div className="h-6 w-6 rounded-md bg-[#37003C] text-white font-bold text-[9px] flex items-center justify-center shrink-0">
                                    {fixture.opponentName.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="font-extrabold text-xs sm:text-sm text-gray-900 truncate">
                                    <span className="text-gray-400 font-semibold mr-1">
                                      {fixture.isHome ? "vs" : "@"}
                                    </span>
                                    {fixture.opponentName}
                                  </div>
                                  <div className="text-[10px] text-gray-400 font-medium truncate">
                                    {fixture.roundName}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                              {/* Score */}
                              <div className="text-right">
                                {fixture.teamScore !== null &&
                                fixture.opponentScore !== null ? (
                                  <div>
                                    <div
                                      className={cn(
                                        "font-mono font-black text-sm",
                                        isLive ? "text-rose-600" : "text-gray-900"
                                      )}
                                    >
                                      {fixture.teamScore} - {fixture.opponentScore}
                                    </div>
                                    <div
                                      className={cn(
                                        "text-[9px] font-bold uppercase tracking-wider",
                                        isLive ? "text-rose-500" : "text-gray-400"
                                      )}
                                    >
                                      {isLive ? "Live" : "FT"}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-xs font-bold text-gray-400">
                                    Upcoming
                                  </div>
                                )}
                              </div>

                              {/* Status / Outcome badge */}
                              {isLive ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-rose-500 text-white animate-pulse">
                                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                                  LIVE
                                </span>
                              ) : (
                                <span
                                  className={cn(
                                    "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
                                    fixture.result === "WIN"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : fixture.result === "LOSS"
                                      ? "bg-rose-100 text-rose-800"
                                      : fixture.result === "DRAW"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-gray-100 text-gray-600"
                                  )}
                                >
                                  {fixture.result}
                                </span>
                              )}

                              {/* Match Link */}
                              <Link
                                href={`/matches/${fixture.id}`}
                                className="h-7 w-7 rounded-lg bg-gray-50 hover:bg-[#37003C]/5 border border-gray-200 flex items-center justify-center text-gray-600 hover:text-[#37003C] transition-colors"
                                title="View Match Report"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* SECONDARY MODAL: FANTASY TEAM LINEUP INSPECTOR                             */}
      {/* ========================================================================= */}
      {selectedPlayer && (
        <FantasyTeamModal
          isOpen={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          fplId={selectedPlayer.fplId}
          managerName={selectedPlayer.name}
          fplTeamName={selectedPlayer.fplTeamName}
          tournamentTeamName={team.name}
          tournamentTeamLogo={team.logo}
          gameweek={currentGameweek}
          allowBenchBoost={allowBenchBoost}
          allowTripleCaptain={allowTripleCaptain}
        />
      )}
    </>
  );
}
