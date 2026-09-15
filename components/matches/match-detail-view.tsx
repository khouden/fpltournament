"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Trophy,
  Calendar,
  Users,
  ArrowLeft,
  ArrowRight,
  Shield,
  Clock,
  Sparkles,
  Handshake,
  BarChart3,
  Eye,
  Flame,
  CheckCircle2,
  Armchair,
  Crown,
  Award,
  Zap,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FantasyTeamModal } from "@/components/fantasy-team-modal";
import { cn } from "@/lib/utils";

export interface MatchSquadMember {
  id: string;
  memberId: string;
  fplName: string;
  fplTeamName: string | null;
  fplId: number;
  gameweekPoints: number;
  rawPoints: number;
  isExcluded: boolean;
  activeChip: string | null;
  chipDeduction: number;
}

export interface MatchTeamDetail {
  id: string;
  name: string;
  logo: string | null;
  score: number | null;
  isWinner: boolean;
  isDraw: boolean;
  members: MatchSquadMember[];
  rank?: number;
  leaguePoints?: number;
}

export interface SisterMatchSummary {
  id: string;
  matchNumber: number;
  status: string;
  homeName: string;
  homeLogo: string | null;
  homeScore: number | null;
  awayName: string;
  awayLogo: string | null;
  awayScore: number | null;
  isCurrent: boolean;
}

export interface TournamentStandingSnapshot {
  rank: number;
  groupId: string;
  groupName: string;
  logo: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsDiff: number;
  leaguePoints: number;
  form: ("W" | "D" | "L")[];
  isHome: boolean;
  isAway: boolean;
}

export interface MatchDetailViewProps {
  match: {
    id: string;
    matchNumber: number;
    status: string;
    result: string | null;
    roundNumber: number;
    roundName: string;
    gameweek: number;
    homeTeam: MatchTeamDetail;
    awayTeam: MatchTeamDetail;
  };
  tournament: {
    id: string;
    name: string;
    season: number;
    seasonDisplay: string;
    bannerSrc: string;
    allowBenchBoost: boolean;
    allowTripleCaptain: boolean;
  };
  sisterMatches: SisterMatchSummary[];
  standings: TournamentStandingSnapshot[];
}

export function MatchDetailView({
  match,
  tournament,
  sisterMatches,
  standings,
}: MatchDetailViewProps) {
  const [activeTab, setActiveTab] = useState<
    "breakdown" | "stats" | "standings"
  >("breakdown");

  // Selected player for Fantasy Team Pitch Modal
  const [selectedModalPlayer, setSelectedModalPlayer] = useState<{
    member: MatchSquadMember;
    teamName: string;
    teamLogo?: string | null;
  } | null>(null);

  const hasScore =
    match.homeTeam.score !== null && match.awayTeam.score !== null;

  // Contributing vs Excluded members
  const homeIncluded = useMemo(
    () => match.homeTeam.members.filter((m) => !m.isExcluded),
    [match.homeTeam.members]
  );
  const homeExcluded = useMemo(
    () => match.homeTeam.members.filter((m) => m.isExcluded),
    [match.homeTeam.members]
  );

  const awayIncluded = useMemo(
    () => match.awayTeam.members.filter((m) => !m.isExcluded),
    [match.awayTeam.members]
  );
  const awayExcluded = useMemo(
    () => match.awayTeam.members.filter((m) => m.isExcluded),
    [match.awayTeam.members]
  );

  // Match Statistics Calculations
  const stats = useMemo(() => {
    const allMembers = [
      ...homeIncluded.map((m) => ({
        ...m,
        teamName: match.homeTeam.name,
        teamLogo: match.homeTeam.logo,
      })),
      ...awayIncluded.map((m) => ({
        ...m,
        teamName: match.awayTeam.name,
        teamLogo: match.awayTeam.logo,
      })),
    ];

    const topScorer = allMembers.reduce<
      (MatchSquadMember & { teamName: string; teamLogo: string | null }) | null
    >((best, current) => {
      if (!best || current.gameweekPoints > best.gameweekPoints) return current;
      return best;
    }, null);

    const homeAvg =
      homeIncluded.length > 0
        ? (match.homeTeam.score || 0) / homeIncluded.length
        : 0;
    const awayAvg =
      awayIncluded.length > 0
        ? (match.awayTeam.score || 0) / awayIncluded.length
        : 0;

    const totalPointsCombined =
      (match.homeTeam.score || 0) + (match.awayTeam.score || 0);
    const homePercent =
      totalPointsCombined > 0
        ? Math.round(((match.homeTeam.score || 0) / totalPointsCombined) * 100)
        : 50;
    const awayPercent = 100 - homePercent;

    const homeChips = homeIncluded.filter((m) => !!m.activeChip).length;
    const awayChips = awayIncluded.filter((m) => !!m.activeChip).length;

    return {
      topScorer,
      homeAvg: homeAvg.toFixed(1),
      awayAvg: awayAvg.toFixed(1),
      homePercent,
      awayPercent,
      homeChips,
      awayChips,
      diff:
        hasScore && match.homeTeam.score !== null && match.awayTeam.score !== null
          ? Math.abs(match.homeTeam.score - match.awayTeam.score)
          : 0,
    };
  }, [homeIncluded, awayIncluded, match, hasScore]);

  return (
    <div className="w-full bg-[#F8F9FA] text-[#1F1F1F]">
      {/* ========================================================================= */}
      {/* HERO SCOREBOARD SECTION                                                   */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-[#180022] text-white py-10 sm:py-14">
        {/* Background Banner Image of the Tournament */}
        <div className="absolute inset-0 z-0">
          {tournament.bannerSrc && (
            <Image
              src={encodeURI(tournament.bannerSrc)}
              alt={tournament.name}
              fill
              priority
              unoptimized
              className="object-cover object-center"
            />
          )}
          {/* Subtle directional gradients for high contrast and readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/85" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />
        </div>

        {/* Scoreboard Content Container */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          {/* Top Bar: Navigation & Metadata Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Back Button Link */}
            <Link
              href={`/tournaments/${tournament.id}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 px-4 py-1.5 text-xs font-bold text-white/95 transition-colors shadow-xs group"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to {tournament.name}</span>
            </Link>

            {/* Match Status & Round Badges */}
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-black/40 backdrop-blur-md border border-white/15 px-3 py-1 text-xs font-semibold text-white/90">
                {match.roundName || `Round ${match.roundNumber}`} · Gameweek {match.gameweek}
              </span>

              {match.status === "FINALIZED" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00FF87] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#063319] shadow-md">
                  <span className="h-2 w-2 rounded-full bg-[#063319]" />
                  FINALIZED
                </span>
              ) : match.status === "IN_PROGRESS" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/90 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-md animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                  LIVE MATCH
                </span>
              ) : match.status === "COMPLETED" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-xs">
                  COMPLETED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                  <Clock className="h-3 w-3" />
                  SCHEDULED
                </span>
              )}
            </div>
          </div>

          {/* Grand Scoreboard Card */}
          <div className="rounded-3xl bg-black/45 backdrop-blur-md border border-white/15 p-6 sm:p-10 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Home Team Side (Col 4) */}
              <div className="md:col-span-4 flex flex-col md:flex-row items-center md:justify-end gap-4 text-center md:text-right">
                <div className="order-2 md:order-1 space-y-1">
                  <h1
                    className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight ${
                      match.homeTeam.isWinner ? "text-[#00FF87]" : "text-white"
                    }`}
                  >
                    {match.homeTeam.name}
                  </h1>

                  {/* Outcome Tag */}
                  {match.result && (
                    <div>
                      {match.homeTeam.isWinner ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#00FF87]/20 border border-[#00FF87]/40 px-2.5 py-0.5 text-xs font-black text-[#00FF87] uppercase tracking-wider">
                          <Sparkles className="h-3 w-3" />
                          +3 PTS · WIN
                        </span>
                      ) : match.homeTeam.isDraw ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-400/40 px-2.5 py-0.5 text-xs font-black text-amber-300 uppercase tracking-wider">
                          <Handshake className="h-3 w-3" />
                          +1 PT · DRAW
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white/60 uppercase tracking-wider">
                          0 PTS · LOSS
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Home Crest */}
                <div className="order-1 md:order-2 shrink-0">
                  {match.homeTeam.logo ? (
                    <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-white/10 backdrop-blur-md p-2.5 border border-white/20 flex items-center justify-center shadow-lg">
                      <img
                        src={match.homeTeam.logo}
                        alt={match.homeTeam.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-[#37003C] border border-[#00FF87]/40 text-[#00FF87] font-black text-2xl flex items-center justify-center shadow-lg">
                      {match.homeTeam.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Center Scoreboard (Col 4) */}
              <div className="md:col-span-4 flex flex-col items-center justify-center text-center space-y-3">
                {hasScore ? (
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-4 sm:gap-6 bg-black/50 border border-white/20 rounded-2xl px-6 sm:px-8 py-3.5 shadow-inner">
                      <span
                        className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight ${
                          match.homeTeam.isWinner ? "text-[#00FF87]" : "text-white"
                        }`}
                      >
                        {match.homeTeam.score}
                      </span>
                      <span className="text-2xl sm:text-3xl font-bold text-white/40">
                        –
                      </span>
                      <span
                        className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight ${
                          match.awayTeam.isWinner ? "text-[#00FF87]" : "text-white"
                        }`}
                      >
                        {match.awayTeam.score}
                      </span>
                    </div>

                    {/* Result Announcement Strip */}
                    <div>
                      {match.result === "DRAW" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-300 tracking-wide">
                          <Handshake className="h-3.5 w-3.5" />
                          Match Drawn · 1 tournament point awarded each
                        </span>
                      ) : match.result === "HOME_WIN" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#00FF87] tracking-wide">
                          <Trophy className="h-3.5 w-3.5" />
                          {match.homeTeam.name} wins by {stats.diff} pts (+3 pts)
                        </span>
                      ) : match.result === "AWAY_WIN" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#00FF87] tracking-wide">
                          <Trophy className="h-3.5 w-3.5" />
                          {match.awayTeam.name} wins by {stats.diff} pts (+3 pts)
                        </span>
                      ) : match.status === "IN_PROGRESS" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                          Provisional points updating live
                        </span>
                      ) : (
                        <span className="text-xs text-white/60 font-medium">
                          Official Match Result
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="inline-flex items-center justify-center h-14 w-20 rounded-2xl bg-white/10 border border-white/20">
                      <span className="text-2xl font-black text-white/90 tracking-wider">
                        VS
                      </span>
                    </div>
                    <span className="block text-xs font-bold text-white/60 uppercase tracking-wider">
                      Gameweek {match.gameweek} Not Started Yet
                    </span>
                  </div>
                )}
              </div>

              {/* Away Team Side (Col 4) */}
              <div className="md:col-span-4 flex flex-col md:flex-row items-center md:justify-start gap-4 text-center md:text-left">
                {/* Away Crest */}
                <div className="shrink-0">
                  {match.awayTeam.logo ? (
                    <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-white/10 backdrop-blur-md p-2.5 border border-white/20 flex items-center justify-center shadow-lg">
                      <img
                        src={match.awayTeam.logo}
                        alt={match.awayTeam.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-[#37003C] border border-[#00FF87]/40 text-[#00FF87] font-black text-2xl flex items-center justify-center shadow-lg">
                      {match.awayTeam.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h1
                    className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight ${
                      match.awayTeam.isWinner ? "text-[#00FF87]" : "text-white"
                    }`}
                  >
                    {match.awayTeam.name}
                  </h1>

                  {/* Outcome Tag */}
                  {match.result && (
                    <div>
                      {match.awayTeam.isWinner ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#00FF87]/20 border border-[#00FF87]/40 px-2.5 py-0.5 text-xs font-black text-[#00FF87] uppercase tracking-wider">
                          <Sparkles className="h-3 w-3" />
                          +3 PTS · WIN
                        </span>
                      ) : match.awayTeam.isDraw ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-400/40 px-2.5 py-0.5 text-xs font-black text-amber-300 uppercase tracking-wider">
                          <Handshake className="h-3 w-3" />
                          +1 PT · DRAW
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white/60 uppercase tracking-wider">
                          0 PTS · LOSS
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tournament Rules Chips Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1 text-xs font-medium text-white/80">
              <Armchair className="h-3.5 w-3.5 text-[#00FF87]" />
              <span>
                Bench Boost: {tournament.allowBenchBoost ? "Counted" : "Excluded"}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1 text-xs font-medium text-white/80">
              <Crown className="h-3.5 w-3.5 text-[#00D9FF]" />
              <span>
                Triple Captain: {tournament.allowTripleCaptain ? "3x" : "2x"}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1 text-xs font-medium text-white/80">
              <Award className="h-3.5 w-3.5 text-[#FFD700]" />
              <span>Head-to-Head (+3 W · +1 D · 0 L)</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* MATCH NAVIGATION TABS                                                     */}
      {/* ========================================================================= */}
      <nav
        aria-label="Match sections"
        className="w-full bg-white border-b border-gray-200 sticky top-16 z-30 shadow-xs"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-6 sm:space-x-8 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("breakdown")}
              className={`inline-flex items-center gap-2 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "breakdown"
                  ? "border-[#00D06C] text-[#00A855]"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Squad Breakdown</span>
            </button>

            <button
              onClick={() => setActiveTab("stats")}
              className={`inline-flex items-center gap-2 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "stats"
                  ? "border-[#00D06C] text-[#00A855]"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Match Stats &amp; Key Duels</span>
            </button>

            <button
              onClick={() => setActiveTab("standings")}
              className={`inline-flex items-center gap-2 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "standings"
                  ? "border-[#00D06C] text-[#00A855]"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <Trophy className="h-4 w-4" />
              <span>Tournament Context</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA                                                         */}
      {/* ========================================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* ======================================================================= */}
        {/* TAB 1: SQUAD BREAKDOWN                                                  */}
        {/* ======================================================================= */}
        {activeTab === "breakdown" && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Manager Squad Breakdown
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
                  Click on any manager to inspect their 15-player lineup, captain choices, and bench points
                </p>
              </div>
              <div className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg self-start sm:self-auto">
                Verified FPL Scoring Engine
              </div>
            </div>

            {/* 2-Column Squad Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Home Squad Card */}
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-5 sm:p-6 space-y-5">
                {/* Team Card Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    {match.homeTeam.logo ? (
                      <div className="h-12 w-12 rounded-xl bg-gray-50 p-1.5 border border-gray-200 flex items-center justify-center shrink-0">
                        <img
                          src={match.homeTeam.logo}
                          alt={match.homeTeam.name}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-[#37003C] text-white font-black text-sm flex items-center justify-center shrink-0">
                        {match.homeTeam.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-gray-900">
                          {match.homeTeam.name}
                        </h3>
                        {match.homeTeam.isWinner && (
                          <span className="rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] px-2 py-0.5 uppercase">
                            Winner
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        {homeIncluded.length} Contributing{" "}
                        {homeIncluded.length === 1 ? "Manager" : "Managers"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-black text-gray-900">
                      {match.homeTeam.score ?? "—"}
                    </span>
                    <span className="text-xs font-bold text-gray-500 ml-1">pts</span>
                  </div>
                </div>

                {/* Included Managers */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Contributing Lineup
                  </div>

                  {homeIncluded.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400 italic">
                      No managers assigned to this squad yet.
                    </div>
                  ) : (
                    homeIncluded.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          setSelectedModalPlayer({
                            member: m,
                            teamName: match.homeTeam.name,
                            teamLogo: match.homeTeam.logo,
                          })
                        }
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 border border-gray-200/80 transition-all cursor-pointer group text-left"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-900 group-hover:text-[#37003C] transition-colors truncate">
                              {m.fplName}
                            </span>
                            {m.activeChip && (
                              <span className="rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-[10px] px-1.5 py-0.2">
                                {m.activeChip === "bboost"
                                  ? "BB"
                                  : m.activeChip === "3xc"
                                  ? "3xC"
                                  : m.activeChip.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">
                            {m.fplTeamName || "Fantasy Team"}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="font-black text-sm text-gray-900">
                              {m.gameweekPoints}
                            </span>
                            <span className="text-[10px] text-gray-500 ml-0.5">
                              pts
                            </span>
                            {m.chipDeduction > 0 && (
                              <p className="text-[10px] text-rose-600 font-semibold">
                                -{m.chipDeduction} chip adj.
                              </p>
                            )}
                          </div>
                          <Eye className="h-4 w-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Excluded Admin/Organizer notice */}
                {homeExcluded.length > 0 && (
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-amber-600" />
                      <span>Organizer · Excluded from Team Scoring</span>
                    </div>

                    {homeExcluded.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          setSelectedModalPlayer({
                            member: m,
                            teamName: match.homeTeam.name,
                            teamLogo: match.homeTeam.logo,
                          })
                        }
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 hover:bg-amber-100/60 transition-colors cursor-pointer text-left"
                      >
                        <div className="min-w-0 truncate">
                          <span className="font-semibold text-xs text-amber-900">
                            {m.fplName}
                          </span>
                          <span className="text-[10px] text-amber-700 block">
                            Organizer (Zero impact on match score)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-amber-900/60 line-through">
                            {m.gameweekPoints} pts
                          </span>
                          <Eye className="h-3.5 w-3.5 text-amber-700" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Away Squad Card */}
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-5 sm:p-6 space-y-5">
                {/* Team Card Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    {match.awayTeam.logo ? (
                      <div className="h-12 w-12 rounded-xl bg-gray-50 p-1.5 border border-gray-200 flex items-center justify-center shrink-0">
                        <img
                          src={match.awayTeam.logo}
                          alt={match.awayTeam.name}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-[#37003C] text-white font-black text-sm flex items-center justify-center shrink-0">
                        {match.awayTeam.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-gray-900">
                          {match.awayTeam.name}
                        </h3>
                        {match.awayTeam.isWinner && (
                          <span className="rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] px-2 py-0.5 uppercase">
                            Winner
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        {awayIncluded.length} Contributing{" "}
                        {awayIncluded.length === 1 ? "Manager" : "Managers"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-black text-gray-900">
                      {match.awayTeam.score ?? "—"}
                    </span>
                    <span className="text-xs font-bold text-gray-500 ml-1">pts</span>
                  </div>
                </div>

                {/* Included Managers */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Contributing Lineup
                  </div>

                  {awayIncluded.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400 italic">
                      No managers assigned to this squad yet.
                    </div>
                  ) : (
                    awayIncluded.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          setSelectedModalPlayer({
                            member: m,
                            teamName: match.awayTeam.name,
                            teamLogo: match.awayTeam.logo,
                          })
                        }
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 border border-gray-200/80 transition-all cursor-pointer group text-left"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-900 group-hover:text-[#37003C] transition-colors truncate">
                              {m.fplName}
                            </span>
                            {m.activeChip && (
                              <span className="rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-[10px] px-1.5 py-0.2">
                                {m.activeChip === "bboost"
                                  ? "BB"
                                  : m.activeChip === "3xc"
                                  ? "3xC"
                                  : m.activeChip.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">
                            {m.fplTeamName || "Fantasy Team"}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="font-black text-sm text-gray-900">
                              {m.gameweekPoints}
                            </span>
                            <span className="text-[10px] text-gray-500 ml-0.5">
                              pts
                            </span>
                            {m.chipDeduction > 0 && (
                              <p className="text-[10px] text-rose-600 font-semibold">
                                -{m.chipDeduction} chip adj.
                              </p>
                            )}
                          </div>
                          <Eye className="h-4 w-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Excluded Admin/Organizer notice */}
                {awayExcluded.length > 0 && (
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-amber-600" />
                      <span>Organizer · Excluded from Team Scoring</span>
                    </div>

                    {awayExcluded.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          setSelectedModalPlayer({
                            member: m,
                            teamName: match.awayTeam.name,
                            teamLogo: match.awayTeam.logo,
                          })
                        }
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 hover:bg-amber-100/60 transition-colors cursor-pointer text-left"
                      >
                        <div className="min-w-0 truncate">
                          <span className="font-semibold text-xs text-amber-900">
                            {m.fplName}
                          </span>
                          <span className="text-[10px] text-amber-700 block">
                            Organizer (Zero impact on match score)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-amber-900/60 line-through">
                            {m.gameweekPoints} pts
                          </span>
                          <Eye className="h-3.5 w-3.5 text-amber-700" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 2: MATCH STATS & KEY DUELS                                          */}
        {/* ======================================================================= */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Match Stats &amp; Head-to-Head Analytics
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
                Key performance metrics, point shares, and individual standouts
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stat 1: Top Match Scorer */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span>Match MVP</span>
                  <Flame className="h-4 w-4 text-amber-500" />
                </div>
                {stats.topScorer ? (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 flex items-center justify-center">
                      <img
                        src="/images/players/mvp of the match.png"
                        alt={stats.topScorer.fplName}
                        className="h-full w-full object-contain drop-shadow-sm"
                      />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="text-lg font-black text-gray-900 truncate">
                        {stats.topScorer.fplName}
                      </div>
                      <div className="text-xs font-semibold text-[#00A855] truncate">
                        {stats.topScorer.gameweekPoints} pts ({stats.topScorer.teamName})
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-gray-400">N/A</div>
                )}
              </div>

              {/* Stat 2: Score Margin */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span>Margin of Victory</span>
                  <Trophy className="h-4 w-4 text-[#37003C]" />
                </div>
                <div className="mt-3 space-y-1">
                  <div className="text-2xl font-black text-gray-900">
                    {hasScore ? `${stats.diff} pts` : "—"}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    {match.result === "DRAW"
                      ? "Evenly matched draw"
                      : hasScore
                      ? "Points difference"
                      : "Awaiting kickoff"}
                  </div>
                </div>
              </div>

              {/* Stat 3: Home Average Output */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span>{match.homeTeam.name} Avg</span>
                  <Users className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="mt-3 space-y-1">
                  <div className="text-2xl font-black text-gray-900">
                    {stats.homeAvg} <span className="text-xs font-bold text-gray-500">pts/mgr</span>
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    {homeIncluded.length} contributing managers
                  </div>
                </div>
              </div>

              {/* Stat 4: Away Average Output */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span>{match.awayTeam.name} Avg</span>
                  <Users className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="mt-3 space-y-1">
                  <div className="text-2xl font-black text-gray-900">
                    {stats.awayAvg} <span className="text-xs font-bold text-gray-500">pts/mgr</span>
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    {awayIncluded.length} contributing managers
                  </div>
                </div>
              </div>
            </div>

            {/* Total Points Distribution Bar */}
            {hasScore && (
              <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between text-sm font-bold text-gray-900">
                  <div className="flex items-center gap-2">
                    <span>{match.homeTeam.name}</span>
                    <span className="text-xs font-black text-[#00A855]">
                      {stats.homePercent}% ({match.homeTeam.score} pts)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#37003C]">
                      {stats.awayPercent}% ({match.awayTeam.score} pts)
                    </span>
                    <span>{match.awayTeam.name}</span>
                  </div>
                </div>

                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${stats.homePercent}%` }}
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                  />
                  <div
                    style={{ width: `${stats.awayPercent}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-[#37003C] transition-all duration-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 3: TOURNAMENT CONTEXT & ROUND SISTER MATCHES                        */}
        {/* ======================================================================= */}
        {activeTab === "standings" && (
          <div className="space-y-8">
            {/* Context Notice */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                <Trophy className="h-5 w-5 text-[#37003C]" />
                <h3 className="text-lg font-black text-gray-900">
                  Current Tournament Standings Context
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-12 text-center">Rank</th>
                      <th className="py-2.5 px-3">Team</th>
                      <th className="py-2.5 px-2 text-center">Played</th>
                      <th className="py-2.5 px-2 text-center">W</th>
                      <th className="py-2.5 px-2 text-center">D</th>
                      <th className="py-2.5 px-2 text-center">L</th>
                      <th className="py-2.5 px-3 text-center">PF</th>
                      <th className="py-2.5 px-3 text-center">+/-</th>
                      <th className="py-2.5 px-3 text-right">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {standings.map((team) => {
                      const isMatchCompetitor = team.isHome || team.isAway;
                      return (
                        <tr
                          key={team.groupId}
                          className={`transition-colors ${
                            isMatchCompetitor
                              ? "bg-emerald-50/50 font-bold"
                              : "hover:bg-gray-50/60 text-gray-700"
                          }`}
                        >
                          <td className="py-3 px-3 text-center font-bold text-xs">
                            {team.rank}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              {team.logo ? (
                                <img
                                  src={team.logo}
                                  alt={team.groupName}
                                  className="h-6 w-6 object-contain shrink-0"
                                />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-[#37003C] text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                                  {team.groupName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span>{team.groupName}</span>
                              {team.isHome && (
                                <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">
                                  Home
                                </span>
                              )}
                              {team.isAway && (
                                <span className="text-[10px] text-indigo-800 bg-indigo-100 px-1.5 py-0.2 rounded font-bold">
                                  Away
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center text-xs">
                            {team.played}
                          </td>
                          <td className="py-3 px-2 text-center text-xs text-emerald-700">
                            {team.won}
                          </td>
                          <td className="py-3 px-2 text-center text-xs text-amber-700">
                            {team.drawn}
                          </td>
                          <td className="py-3 px-2 text-center text-xs text-rose-700">
                            {team.lost}
                          </td>
                          <td className="py-3 px-3 text-center text-xs">
                            {team.pointsFor.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-center text-xs">
                            {team.pointsDiff > 0 ? `+${team.pointsDiff}` : team.pointsDiff}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-gray-900">
                            {team.leaguePoints}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Other Matches in This Gameweek */}
            {sisterMatches.length > 1 && (
              <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="text-base font-black text-gray-900">
                    Other Gameweek {match.gameweek} Matches
                  </h3>
                  <Link
                    href={`/tournaments/${tournament.id}`}
                    className="text-xs font-bold text-[#00A855] hover:text-[#008f49] flex items-center gap-1"
                  >
                    <span>Full Schedule</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sisterMatches.map((sm) => {
                    const smHasScore =
                      sm.homeScore !== null && sm.awayScore !== null;
                    const isSmLive =
                      sm.status === "IN_PROGRESS" || sm.status === "LIVE";
                    const isSmCompleted =
                      sm.status === "COMPLETED" || sm.status === "FINALIZED";
                    return (
                      <Link
                        key={sm.id}
                        href={`/matches/${sm.id}`}
                        className={cn(
                          "relative overflow-hidden p-3.5 rounded-xl border flex items-center justify-between transition-all",
                          sm.isCurrent
                            ? "border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20 shadow-2xs"
                            : isSmLive
                            ? "border-rose-300/80 bg-rose-50/40 hover:border-rose-400 shadow-2xs"
                            : isSmCompleted
                            ? "border-gray-200/80 bg-white hover:border-gray-300 shadow-2xs"
                            : "border-gray-200/60 bg-gray-50/50 hover:bg-white hover:border-gray-300"
                        )}
                      >
                        {isSmLive && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
                        )}
                        {isSmCompleted && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00D06C]" />
                        )}

                        <div className="flex items-center gap-2 flex-1 truncate pl-1">
                          <span className="font-bold text-xs text-gray-900 truncate">
                            {sm.homeName}
                          </span>
                        </div>

                        <div
                          className={cn(
                            "px-2.5 py-1 rounded text-xs font-black mx-2 shrink-0 flex items-center gap-1.5",
                            isSmLive
                              ? "bg-rose-100/90 text-rose-800 border border-rose-200/80"
                              : isSmCompleted
                              ? "bg-[#37003C] text-white shadow-2xs"
                              : "bg-white border border-gray-200 text-gray-900"
                          )}
                        >
                          {isSmLive && (
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                          )}
                          <span>
                            {smHasScore
                              ? `${Math.round(sm.homeScore!)} - ${Math.round(sm.awayScore!)}`
                              : "VS"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-1 justify-end truncate">
                          <span className="font-bold text-xs text-gray-900 truncate">
                            {sm.awayName}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* FANTASY TEAM MODAL FOR PITCH INSPECTION                                   */}
      {/* ========================================================================= */}
      {selectedModalPlayer && (
        <FantasyTeamModal
          isOpen={true}
          onClose={() => setSelectedModalPlayer(null)}
          fplId={selectedModalPlayer.member.fplId}
          managerName={selectedModalPlayer.member.fplName}
          fplTeamName={selectedModalPlayer.member.fplTeamName}
          tournamentTeamName={selectedModalPlayer.teamName}
          tournamentTeamLogo={selectedModalPlayer.teamLogo}
          gameweek={match.gameweek}
          allowBenchBoost={tournament.allowBenchBoost}
          allowTripleCaptain={tournament.allowTripleCaptain}
        />
      )}
    </div>
  );
}
