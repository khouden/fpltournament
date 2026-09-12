"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Trophy,
  Calendar,
  Users,
  LayoutDashboard,
  Shield,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Armchair,
  Crown,
  Info,
  FileText,
  Flame,
  Award,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { MatchSquadList, MatchPlayerScoreItem } from "@/components/match-squad-client";

export interface TeamStandingItem {
  rank: number;
  groupId: string;
  groupName: string;
  logo: string | null;
  managerName: string;
  gwPoints: number;
  totalPoints: number;
  leaguePoints: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsDiff: number;
  form: ("W" | "D" | "L")[];
}

export interface MatchScoreItem {
  id: string;
  matchNumber: number;
  status: string;
  result: string | null;
  homeGroupId: string | null;
  awayGroupId: string | null;
  homeTeam: { id: string; name: string; logo: string | null };
  awayTeam: { id: string; name: string; logo: string | null };
  homeScore: number | null;
  awayScore: number | null;
  scores: Array<{
    id: string;
    gameweekPoints: number;
    isExcluded: boolean;
    activeChip: string | null;
    chipDeduction: number;
    member: {
      id: string;
      groupId: string;
      fplName: string;
      fplTeamName: string | null;
      fplId: number;
      isAdmin?: boolean;
    };
  }>;
}

export interface RoundItem {
  id: string;
  roundNumber: number;
  gameweek: number;
  name: string;
  dateLabel: string;
  matches: MatchScoreItem[];
}

export interface TeamDirectoryItem {
  id: string;
  name: string;
  logo: string | null;
  managerName: string;
  activePlayerCount: number;
  members: Array<{
    id: string;
    fplName: string;
    fplTeamName: string | null;
    fplId: number;
    isAdmin: boolean;
  }>;
}

export interface TournamentDetailViewProps {
  tournament: {
    id: string;
    name: string;
    season: number;
    seasonDisplay: string;
    status: string;
    isActive: boolean;
    bannerSrc: string;
    allowBenchBoost: boolean;
    allowTripleCaptain: boolean;
    description?: string;
    adminName: string;
    startDate: string;
    endDate: string;
    totalRounds: number;
    totalTeams: number;
    leagueType: string;
  };
  standings: TeamStandingItem[];
  rounds: RoundItem[];
  teams: TeamDirectoryItem[];
}

export function TournamentDetailView({
  tournament,
  standings,
  rounds,
  teams,
}: TournamentDetailViewProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "standings" | "fixtures" | "teams"
  >("overview");

  // Default selected round for Fixtures widget
  const initialRoundId = useMemo(() => {
    if (rounds.length === 0) return "";
    // Find active/live round, or latest completed, or first round
    const liveRound = rounds.find((r) =>
      r.matches.some((m) => m.status === "IN_PROGRESS")
    );
    if (liveRound) return liveRound.id;
    const completedRounds = rounds.filter((r) =>
      r.matches.length > 0 && r.matches.every((m) => m.status === "FINALIZED" || m.status === "COMPLETED")
    );
    if (completedRounds.length > 0) {
      return completedRounds[completedRounds.length - 1].id;
    }
    return rounds[0].id;
  }, [rounds]);

  const [selectedRoundId, setSelectedRoundId] = useState<string>(initialRoundId);

  const selectedRound = useMemo(() => {
    return rounds.find((r) => r.id === selectedRoundId) || rounds[0];
  }, [rounds, selectedRoundId]);

  const selectedRoundIndex = useMemo(() => {
    return rounds.findIndex((r) => r.id === selectedRoundId);
  }, [rounds, selectedRoundId]);

  const handlePrevRound = () => {
    if (selectedRoundIndex > 0) {
      setSelectedRoundId(rounds[selectedRoundIndex - 1].id);
    }
  };

  const handleNextRound = () => {
    if (selectedRoundIndex < rounds.length - 1) {
      setSelectedRoundId(rounds[selectedRoundIndex + 1].id);
    }
  };

  // Standings preview logic: top 5, dots, bottom 5 if > 10 teams
  const standingsPreview = useMemo(() => {
    if (standings.length <= 10) {
      return { showTruncation: false, topTeams: standings, bottomTeams: [] };
    }
    const topTeams = standings.slice(0, 5);
    const bottomTeams = standings.slice(-5);
    return { showTruncation: true, topTeams, bottomTeams };
  }, [standings]);

  // Top 3 Podium
  const top3 = useMemo(() => {
    return standings.slice(0, 3);
  }, [standings]);

  // Teams Preview for Sidebar (first 5)
  const participatingPreview = useMemo(() => {
    return teams.slice(0, 5);
  }, [teams]);

  return (
    <div className="w-full bg-[#F8F9FA] text-[#1F1F1F]">
      {/* ========================================================================= */}
      {/* HERO SECTION                                                              */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-[#180022] text-white min-h-[380px] sm:min-h-[420px] flex items-center">
        {/* Background Banner Image of the Tournament (Crisp, Clear, Prominent) */}
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
          {/* Subtle directional gradient so text on the left is easily readable while preserving the banner image */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-2xl space-y-4">
            {/* Active Status Badge */}
            <div className="inline-flex">
              {tournament.isActive ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00FF87] px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#063319] shadow-md">
                  <span className="h-2 w-2 rounded-full bg-[#063319] animate-pulse" />
                  ACTIVE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white/90">
                  FINISHED
                </span>
              )}
            </div>

            {/* Tournament Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.1] drop-shadow-lg">
              {tournament.name}
            </h1>

            {/* Tournament Chips Row */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {/* Bench Boost Chip */}
              <div className="inline-flex items-center gap-2 rounded-full bg-black/40 hover:bg-black/50 backdrop-blur-md border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white/95 transition-colors shadow-xs">
                <Armchair className="h-3.5 w-3.5 text-[#00FF87]" />
                <span>Bench Boost</span>
                {tournament.allowBenchBoost ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00FF87]" />
                ) : (
                  <span className="text-[10px] text-white/60">(Off)</span>
                )}
              </div>

              {/* Triple Captain Chip */}
              <div className="inline-flex items-center gap-2 rounded-full bg-black/40 hover:bg-black/50 backdrop-blur-md border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white/95 transition-colors shadow-xs">
                <span className="text-[11px] font-extrabold px-1 rounded bg-[#00D9FF]/20 text-[#00D9FF]">
                  3x
                </span>
                <span>Triple Captain</span>
                {tournament.allowTripleCaptain ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00D9FF]" />
                ) : (
                  <span className="text-[10px] text-white/60">(2x)</span>
                )}
              </div>

              {/* Season Chip */}
              <div className="inline-flex items-center gap-2 rounded-full bg-black/40 hover:bg-black/50 backdrop-blur-md border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white/95 transition-colors shadow-xs">
                <Calendar className="h-3.5 w-3.5 text-[#FFD700]" />
                <span>{tournament.seasonDisplay}</span>
              </div>
            </div>

            {/* Tournament Subtitle / Tagline */}
            <p className="text-sm sm:text-base text-white/90 font-normal max-w-xl pt-1 leading-relaxed drop-shadow-md">
              {tournament.description ||
                "The ultimate tournament for elite managers. Are you ready to claim the crown?"}
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* NAVIGATION TABS STRIP                                                     */}
      {/* ========================================================================= */}
      <nav
        aria-label="Tournament navigation"
        className="w-full bg-white border-b border-gray-200 sticky top-16 z-30 shadow-xs"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-6 sm:space-x-8 overflow-x-auto no-scrollbar">
            {/* Overview Tab */}
            <button
              onClick={() => setActiveTab("overview")}
              className={`inline-flex items-center gap-2 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "overview"
                  ? "border-[#00D06C] text-[#00A855]"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Overview</span>
            </button>

            {/* Standings Tab */}
            <button
              onClick={() => setActiveTab("standings")}
              className={`inline-flex items-center gap-2 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "standings"
                  ? "border-[#00D06C] text-[#00A855]"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <Trophy className="h-4 w-4" />
              <span>Standings</span>
            </button>

            {/* Fixtures & Results Tab */}
            <button
              onClick={() => setActiveTab("fixtures")}
              className={`inline-flex items-center gap-2 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "fixtures"
                  ? "border-[#00D06C] text-[#00A855]"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Fixtures &amp; Results</span>
            </button>

            {/* Teams Tab */}
            <button
              onClick={() => setActiveTab("teams")}
              className={`inline-flex items-center gap-2 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "teams"
                  ? "border-[#00D06C] text-[#00A855]"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Teams</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* MAIN CONTENT BODY                                                         */}
      {/* ========================================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW (EXACT 2-COLUMN LAYOUT MATCHING USER MOCKUP)              */}
        {/* ========================================================================= */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* --------------------------------------------------------------------- */}
            {/* LEFT COLUMN: LEAGUE STANDINGS & FIXTURES (COL 8)                      */}
            {/* --------------------------------------------------------------------- */}
            <div className="lg:col-span-8 space-y-6 sm:space-y-8">
              {/* CARD 1: LEAGUE STANDINGS */}
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-5 sm:p-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-5 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <Trophy className="h-5 w-5 text-[#37003C]" />
                    <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">
                      League Standings
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveTab("standings")}
                    className="text-xs sm:text-sm font-bold text-[#00A855] hover:text-[#008f49] inline-flex items-center gap-1 cursor-pointer group transition-colors"
                  >
                    <span>View all</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>

                {/* Standings Table */}
                {standings.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Trophy className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                    <p className="font-semibold text-sm">No standings data available yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto pt-2">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          <th className="py-3 px-3 w-12 text-center">#</th>
                          <th className="py-3 px-3">Team</th>
                          <th className="py-3 px-3">Manager</th>
                          <th className="py-3 px-3 text-center">GW</th>
                          <th className="py-3 px-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-sm">
                        {/* Top Teams (Up to 5) */}
                        {standingsPreview.topTeams.map((team) => {
                          const isFirst = team.rank === 1;
                          const isTop3 = team.rank <= 3;
                          return (
                            <tr
                              key={team.groupId}
                              className="hover:bg-gray-50/80 transition-colors group"
                            >
                              {/* Rank */}
                              <td className="py-3 px-3 text-center">
                                {isFirst ? (
                                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-[#00FF87]/25 text-[#008744] font-black text-xs">
                                    {team.rank}
                                  </span>
                                ) : isTop3 ? (
                                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-gray-100 text-gray-800 font-bold text-xs">
                                    {team.rank}
                                  </span>
                                ) : (
                                  <span className="font-semibold text-gray-600 text-xs">
                                    {team.rank}
                                  </span>
                                )}
                              </td>

                              {/* Team with Crest */}
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  {team.logo ? (
                                    <div className="relative h-7 w-7 rounded-full bg-gray-50 p-0.5 border border-gray-200/80 shrink-0 flex items-center justify-center overflow-hidden">
                                      <img
                                        src={team.logo}
                                        alt={team.groupName}
                                        className="h-full w-full object-contain"
                                      />
                                    </div>
                                  ) : (
                                    <div className="h-7 w-7 rounded-full bg-[#37003C] text-[#00FF87] font-black text-[10px] flex items-center justify-center shrink-0">
                                      {team.groupName.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="font-bold text-gray-900 group-hover:text-[#37003C] transition-colors">
                                    {team.groupName}
                                  </span>
                                </div>
                              </td>

                              {/* Manager Name */}
                              <td className="py-3 px-3 text-gray-600 text-xs font-medium">
                                {team.managerName}
                              </td>

                              {/* GW Points */}
                              <td className="py-3 px-3 text-center font-bold text-gray-700 text-xs">
                                {team.gwPoints > 0 ? team.gwPoints : "—"}
                              </td>

                              {/* Total Points */}
                              <td className="py-3 px-3 text-right font-black text-gray-900">
                                {team.totalPoints.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Truncation Divider if > 10 teams */}
                        {standingsPreview.showTruncation && (
                          <tr>
                            <td className="py-2.5 px-3 text-center text-gray-400 font-bold">
                              ...
                            </td>
                            <td
                              colSpan={4}
                              className="py-2.5 px-3 text-gray-400 font-medium text-xs tracking-wider"
                            >
                              ...
                            </td>
                          </tr>
                        )}

                        {/* Bottom Teams (when truncated) */}
                        {standingsPreview.showTruncation &&
                          standingsPreview.bottomTeams.map((team) => (
                            <tr
                              key={team.groupId}
                              className="hover:bg-gray-50/80 transition-colors group"
                            >
                              <td className="py-3 px-3 text-center font-semibold text-gray-600 text-xs">
                                {team.rank}
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  {team.logo ? (
                                    <div className="relative h-7 w-7 rounded-full bg-gray-50 p-0.5 border border-gray-200/80 shrink-0 flex items-center justify-center overflow-hidden">
                                      <img
                                        src={team.logo}
                                        alt={team.groupName}
                                        className="h-full w-full object-contain"
                                      />
                                    </div>
                                  ) : (
                                    <div className="h-7 w-7 rounded-full bg-[#37003C] text-[#00FF87] font-black text-[10px] flex items-center justify-center shrink-0">
                                      {team.groupName.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="font-bold text-gray-900 group-hover:text-[#37003C] transition-colors">
                                    {team.groupName}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-gray-600 text-xs font-medium">
                                {team.managerName}
                              </td>
                              <td className="py-3 px-3 text-center font-bold text-gray-700 text-xs">
                                {team.gwPoints > 0 ? team.gwPoints : "—"}
                              </td>
                              <td className="py-3 px-3 text-right font-black text-gray-900">
                                {team.totalPoints.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* CARD 2: FIXTURES & RESULTS */}
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-5 sm:p-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="h-5 w-5 text-[#37003C]" />
                    <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">
                      Fixtures &amp; Results
                    </h2>
                  </div>
                </div>

                {/* Round Selector Strip */}
                {rounds.length > 0 && (
                  <div className="flex items-center gap-2 py-3 border-y border-gray-100">
                    <button
                      onClick={handlePrevRound}
                      disabled={selectedRoundIndex <= 0}
                      aria-label="Previous round"
                      className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                      {rounds.map((r) => {
                        const isSelected = r.id === selectedRoundId;
                        return (
                          <button
                            key={r.id}
                            onClick={() => setSelectedRoundId(r.id)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                              isSelected
                                ? "bg-[#00D06C] text-white shadow-xs"
                                : "bg-gray-100/80 text-gray-600 hover:bg-gray-200/80"
                            }`}
                          >
                            {r.name || `Round ${r.roundNumber}`}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={handleNextRound}
                      disabled={selectedRoundIndex >= rounds.length - 1}
                      aria-label="Next round"
                      className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0 cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Selected Round Matches List */}
                {!selectedRound || selectedRound.matches.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <Calendar className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                    <p className="font-semibold text-sm">No matches scheduled for this round.</p>
                  </div>
                ) : (
                  <div className="pt-4 space-y-4">
                    {/* Date / Gameweek Header */}
                    <div className="text-xs font-bold text-gray-900 tracking-wide uppercase">
                      {selectedRound.dateLabel || `Gameweek ${selectedRound.gameweek}`}
                    </div>

                    {/* Match Rows */}
                    <div className="space-y-2.5">
                      {selectedRound.matches.map((match) => {
                        const hasScore =
                          match.homeScore !== null && match.awayScore !== null;
                        return (
                          <Link
                            key={match.id}
                            href={`/matches/${match.id}`}
                            className="rounded-xl border border-gray-100 bg-[#FCFCFD] hover:bg-white hover:border-gray-300 hover:shadow-xs p-3.5 sm:p-4 flex items-center justify-between transition-all group cursor-pointer"
                          >
                            {/* Home Team */}
                            <div className="flex items-center justify-end gap-2.5 flex-1 min-w-0">
                              <span className="font-bold text-sm text-gray-900 truncate text-right group-hover:text-[#37003C] transition-colors">
                                {match.homeTeam.name}
                              </span>
                              {match.homeTeam.logo ? (
                                <img
                                  src={match.homeTeam.logo}
                                  alt={match.homeTeam.name}
                                  className="h-7 w-7 object-contain shrink-0"
                                />
                              ) : (
                                <div className="h-7 w-7 rounded-full bg-[#37003C] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {match.homeTeam.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>

                            {/* Score Box */}
                            <div className="mx-3 px-3 sm:px-4 py-1.5 rounded-lg bg-gray-100/90 text-center shrink-0 min-w-[75px] sm:min-w-[84px] group-hover:bg-[#37003C] group-hover:text-white transition-colors">
                              {hasScore ? (
                                <span className="font-black text-sm text-gray-900 group-hover:text-white tracking-wider">
                                  {match.homeScore} - {match.awayScore}
                                </span>
                              ) : (
                                <span className="text-xs font-extrabold text-gray-500 group-hover:text-white uppercase tracking-wider">
                                  VS
                                </span>
                              )}
                            </div>

                            {/* Away Team */}
                            <div className="flex items-center justify-start gap-2.5 flex-1 min-w-0">
                              {match.awayTeam.logo ? (
                                <img
                                  src={match.awayTeam.logo}
                                  alt={match.awayTeam.name}
                                  className="h-7 w-7 object-contain shrink-0"
                                />
                              ) : (
                                <div className="h-7 w-7 rounded-full bg-[#37003C] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {match.awayTeam.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span className="font-bold text-sm text-gray-900 truncate text-left group-hover:text-[#37003C] transition-colors">
                                {match.awayTeam.name}
                              </span>
                            </div>

                            {/* Right Arrow */}
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#37003C] group-hover:translate-x-0.5 transition-all ml-2 shrink-0" />
                          </Link>
                        );
                      })}
                    </div>

                    {/* View All Fixtures Button */}
                    <div className="pt-2">
                      <button
                        onClick={() => setActiveTab("fixtures")}
                        className="w-full py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-gray-900 text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>View all fixtures &amp; results</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* RIGHT COLUMN: SIDEBAR WIDGETS (COL 4)                                */}
            {/* --------------------------------------------------------------------- */}
            <div className="lg:col-span-4 space-y-6">
              {/* SIDEBAR WIDGET 1: TOURNAMENT INFO */}
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-5 sm:p-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                  <div className="h-5 w-5 rounded-full bg-[#37003C] text-white flex items-center justify-center text-[10px] font-black">
                    i
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
                    Tournament Info
                  </h3>
                </div>

                <div className="divide-y divide-gray-50 text-xs pt-1">
                  {/* Status */}
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-gray-500 font-medium">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <span>Status</span>
                    </div>
                    {tournament.isActive ? (
                      <span className="rounded-full bg-emerald-100/90 text-emerald-800 font-bold px-2.5 py-0.5 text-[11px]">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 text-gray-700 font-bold px-2.5 py-0.5 text-[11px]">
                        Finished
                      </span>
                    )}
                  </div>

                  {/* Season */}
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-gray-500 font-medium">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>Season</span>
                    </div>
                    <span className="font-bold text-gray-900">
                      {tournament.seasonDisplay}
                    </span>
                  </div>

                  {/* Start Date */}
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-gray-500 font-medium">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Start Date</span>
                    </div>
                    <span className="font-bold text-gray-900">
                      {tournament.startDate}
                    </span>
                  </div>

                  {/* End Date */}
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-gray-500 font-medium">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>End Date</span>
                    </div>
                    <span className="font-bold text-gray-900">
                      {tournament.endDate}
                    </span>
                  </div>

                  {/* Total Rounds */}
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-gray-500 font-medium">
                      <Trophy className="h-4 w-4 text-gray-400" />
                      <span>Total Rounds</span>
                    </div>
                    <span className="font-bold text-gray-900">
                      {tournament.totalRounds}
                    </span>
                  </div>

                  {/* Teams */}
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-gray-500 font-medium">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>Teams</span>
                    </div>
                    <span className="font-bold text-gray-900">
                      {tournament.totalTeams}
                    </span>
                  </div>

                  {/* League Type */}
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-gray-500 font-medium">
                      <Award className="h-4 w-4 text-gray-400" />
                      <span>League Type</span>
                    </div>
                    <span className="font-bold text-gray-900">
                      {tournament.leagueType}
                    </span>
                  </div>

                  {/* Created by */}
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-gray-500 font-medium">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>Created by</span>
                    </div>
                    <span className="font-bold text-gray-900">
                      {tournament.adminName}
                    </span>
                  </div>
                </div>
              </div>

              {/* SIDEBAR WIDGET 2: TOP 3 PODIUM */}
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-5 sm:p-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                  <Trophy className="h-5 w-5 text-[#37003C]" />
                  <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
                    Top 3
                  </h3>
                </div>

                <div className="space-y-3 pt-3">
                  {top3.length === 0 ? (
                    <p className="text-xs text-gray-500">No teams ranked yet.</p>
                  ) : (
                    top3.map((team, idx) => {
                      const badgeBg =
                        idx === 0
                          ? "bg-[#FFB800] text-white"
                          : idx === 1
                          ? "bg-[#A0AEC0] text-white"
                          : "bg-[#D69E2E] text-white";

                      return (
                        <div
                          key={team.groupId}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50/80 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`h-6 w-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${badgeBg}`}
                            >
                              {team.rank}
                            </span>
                            {team.logo ? (
                              <img
                                src={team.logo}
                                alt={team.groupName}
                                className="h-7 w-7 object-contain shrink-0"
                              />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-[#37003C] text-[#00FF87] font-bold text-[10px] flex items-center justify-center shrink-0">
                                {team.groupName.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className="font-bold text-sm text-gray-900 truncate max-w-[130px]">
                              {team.groupName}
                            </span>
                          </div>
                          <span className="text-xs font-black text-gray-700 shrink-0">
                            {team.totalPoints.toLocaleString()} pts
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* SIDEBAR WIDGET 3: TOURNAMENT RULES */}
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-5 sm:p-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                  <FileText className="h-5 w-5 text-[#37003C]" />
                  <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
                    Tournament Rules
                  </h3>
                </div>

                <ul className="space-y-2.5 pt-3 text-xs text-gray-600 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                    <span>Standard FPL scoring rules apply</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                    <span>
                      {tournament.allowBenchBoost
                        ? "Bench Boost and Triple Captain chips allowed"
                        : "Bench Boost points excluded from group total"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                    <span>
                      {tournament.allowTripleCaptain
                        ? "Triple Captain 3x multiplier fully counted"
                        : "Triple Captain reduced to 2x (1x captain deduction)"}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                    <span>Head-to-head match scoring: +3 Win, +1 Draw, 0 Loss</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                    <span>Points are verified by official FPL scoring engine</span>
                  </li>
                </ul>
              </div>

              {/* SIDEBAR WIDGET 4: PARTICIPATING TEAMS */}
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-5 sm:p-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#37003C]" />
                    <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
                      Participating Teams
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-gray-500">
                    {teams.length} teams
                  </span>
                </div>

                <div className="space-y-3 pt-3">
                  {participatingPreview.map((team, idx) => (
                    <div
                      key={team.id}
                      className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-xs font-bold text-gray-400 w-4 text-center">
                        {idx + 1}
                      </span>
                      {team.logo ? (
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="h-7 w-7 object-contain shrink-0"
                        />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-[#37003C] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {team.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-gray-900 truncate">
                          {team.name}
                        </h4>
                        <p className="text-[11px] text-gray-500 truncate">
                          {team.managerName}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* View All Teams Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab("teams")}
                      className="w-full py-2 rounded-xl border border-[#37003C]/20 text-xs font-bold text-[#37003C] hover:bg-[#37003C]/5 text-center flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>View all teams</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: STANDINGS (FULL LEAGUE TABLE VIEW)                                 */}
        {/* ========================================================================= */}
        {activeTab === "standings" && (
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
                  <Trophy className="h-6 w-6 text-[#FFD700]" />
                  <span>Full League Standings</span>
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Complete head-to-head table with points, goals difference, and recent form
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>+3 Win · +1 Draw · 0 Loss</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/70 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-3 w-12 text-center">#</th>
                    <th className="py-3 px-4 min-w-[200px]">Team</th>
                    <th className="py-3 px-2 text-center" title="Matches Played">
                      MP
                    </th>
                    <th className="py-3 px-2 text-center" title="Won">
                      W
                    </th>
                    <th className="py-3 px-2 text-center" title="Drawn">
                      D
                    </th>
                    <th className="py-3 px-2 text-center" title="Lost">
                      L
                    </th>
                    <th className="py-3 px-2 text-center" title="Points For">
                      PF
                    </th>
                    <th className="py-3 px-2 text-center" title="Points Against">
                      PA
                    </th>
                    <th className="py-3 px-2 text-center" title="Points Difference">
                      +/-
                    </th>
                    <th className="py-3 px-3 text-center font-black text-[#37003C]" title="Total League Points">
                      PTS
                    </th>
                    <th className="py-3 px-3 text-center">Form</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {standings.map((team) => {
                    const isFirst = team.rank === 1 && team.played > 0;
                    return (
                      <tr
                        key={team.groupId}
                        className={`hover:bg-gray-50/90 transition-colors ${
                          isFirst ? "bg-emerald-50/30 font-medium" : ""
                        }`}
                      >
                        <td className="py-3.5 px-3 text-center font-bold text-xs">
                          {team.rank === 1 ? (
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-[#00FF87]/30 text-[#008744] font-black">
                              1
                            </span>
                          ) : (
                            team.rank
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {team.logo ? (
                              <img
                                src={team.logo}
                                alt={team.groupName}
                                className="h-7 w-7 object-contain shrink-0"
                              />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-[#37003C] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                {team.groupName.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-gray-900">{team.groupName}</div>
                              <div className="text-[11px] text-gray-500">{team.managerName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-2 text-center font-semibold text-gray-600 text-xs">
                          {team.played}
                        </td>
                        <td className="py-3.5 px-2 text-center font-semibold text-emerald-700 text-xs">
                          {team.won}
                        </td>
                        <td className="py-3.5 px-2 text-center font-semibold text-amber-700 text-xs">
                          {team.drawn}
                        </td>
                        <td className="py-3.5 px-2 text-center font-semibold text-rose-700 text-xs">
                          {team.lost}
                        </td>
                        <td className="py-3.5 px-2 text-center text-gray-700 text-xs font-medium">
                          {team.pointsFor.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-2 text-center text-gray-700 text-xs font-medium">
                          {team.pointsAgainst.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-2 text-center font-bold text-xs">
                          {team.pointsDiff > 0 ? (
                            <span className="text-emerald-700">+{team.pointsDiff}</span>
                          ) : team.pointsDiff < 0 ? (
                            <span className="text-rose-700">{team.pointsDiff}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-center font-black text-gray-900 text-sm">
                          {team.leaguePoints}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {team.form.length === 0 ? (
                              <span className="text-gray-400 text-xs">—</span>
                            ) : (
                              team.form.slice(-5).map((f, i) => (
                                <span
                                  key={i}
                                  className={`h-5 w-5 rounded text-[10px] font-black flex items-center justify-center text-white ${
                                    f === "W"
                                      ? "bg-emerald-600"
                                      : f === "D"
                                      ? "bg-amber-500"
                                      : "bg-rose-500"
                                  }`}
                                >
                                  {f}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: FIXTURES & RESULTS (FULL SCHEDULE VIEW)                            */}
        {/* ========================================================================= */}
        {activeTab === "fixtures" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-5 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
                    <Calendar className="h-6 w-6 text-[#37003C]" />
                    <span>All Rounds &amp; Fixtures</span>
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Select any gameweek round to inspect match scores and player squad breakdowns
                  </p>
                </div>
                <span className="text-xs font-bold text-[#37003C] bg-[#37003C]/5 px-3 py-1.5 rounded-lg border border-[#37003C]/10 self-start sm:self-auto">
                  {rounds.length} Total Rounds
                </span>
              </div>

              {/* Round Selector Bar */}
              <div className="py-4 overflow-x-auto no-scrollbar flex items-center gap-2 border-b border-gray-100">
                {rounds.map((r) => {
                  const isSelected = r.id === selectedRoundId;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRoundId(r.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? "bg-[#00D06C] text-white shadow-xs"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {r.name || `Round ${r.roundNumber}`} (GW {r.gameweek})
                    </button>
                  );
                })}
              </div>

              {/* Matches for the Selected Round */}
              {selectedRound && (
                <div className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-900">
                      {selectedRound.name || `Round ${selectedRound.roundNumber}`} · Gameweek {selectedRound.gameweek}
                    </h3>
                    <span className="text-xs font-semibold text-gray-500">
                      {selectedRound.matches.length} matches
                    </span>
                  </div>

                  <div className="space-y-4">
                    {selectedRound.matches.map((match) => {
                      const hasScore =
                        match.homeScore !== null && match.awayScore !== null;
                      return (
                        <div
                          key={match.id}
                          className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            {/* Home Side */}
                            <div className="flex items-center gap-3 flex-1 justify-center sm:justify-start">
                              {match.homeTeam.logo ? (
                                <img
                                  src={match.homeTeam.logo}
                                  alt={match.homeTeam.name}
                                  className="h-9 w-9 object-contain"
                                />
                              ) : (
                                <div className="h-9 w-9 rounded-full bg-[#37003C] text-white font-bold text-xs flex items-center justify-center">
                                  {match.homeTeam.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span className="font-extrabold text-base text-gray-900">
                                {match.homeTeam.name}
                              </span>
                            </div>

                            {/* Score Display */}
                            <div className="text-center px-4 py-1.5 rounded-xl bg-gray-100 min-w-[90px]">
                              {hasScore ? (
                                <span className="font-black text-lg text-gray-900 tracking-widest">
                                  {match.homeScore} - {match.awayScore}
                                </span>
                              ) : (
                                <span className="font-black text-xs text-gray-500 uppercase tracking-widest">
                                  SCHEDULED
                                </span>
                              )}
                            </div>

                            {/* Away Side */}
                            <div className="flex items-center gap-3 flex-1 justify-center sm:justify-end">
                              <span className="font-extrabold text-base text-gray-900">
                                {match.awayTeam.name}
                              </span>
                              {match.awayTeam.logo ? (
                                <img
                                  src={match.awayTeam.logo}
                                  alt={match.awayTeam.name}
                                  className="h-9 w-9 object-contain"
                                />
                              ) : (
                                <div className="h-9 w-9 rounded-full bg-[#37003C] text-white font-bold text-xs flex items-center justify-center">
                                  {match.awayTeam.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Match Action Link */}
                          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                            <span className="text-gray-400 font-medium">
                              Match #{match.matchNumber} · {match.status}
                            </span>
                            <Link
                              href={`/matches/${match.id}`}
                              className="font-bold text-[#00A855] hover:text-[#008f49] inline-flex items-center gap-1 transition-colors"
                            >
                              <span>View Squad Breakdown</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: TEAMS DIRECTORY                                                    */}
        {/* ========================================================================= */}
        {activeTab === "teams" && (
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
                  <Users className="h-6 w-6 text-[#37003C]" />
                  <span>Participating Teams</span>
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Directory of all fantasy clubs competing in this tournament
                </p>
              </div>
              <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
                {teams.length} Teams Registered
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="rounded-xl border border-gray-200/80 p-5 flex flex-col items-center text-center hover:border-gray-400 hover:shadow-sm transition-all group"
                >
                  {/* Crest */}
                  <div className="mb-3">
                    {team.logo ? (
                      <div className="h-16 w-16 rounded-xl bg-gray-50 p-1.5 border border-gray-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="h-12 w-12 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-[#37003C] text-white font-black text-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                        {team.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Team Name */}
                  <h3 className="font-extrabold text-sm sm:text-base text-gray-900 truncate w-full group-hover:text-[#37003C] transition-colors">
                    {team.name}
                  </h3>

                  {/* Manager Name */}
                  <p className="text-xs text-gray-500 font-semibold mt-0.5">
                    Manager: {team.managerName}
                  </p>

                  {/* Active Player Count */}
                  <span className="mt-3 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                    {team.activePlayerCount} {team.activePlayerCount === 1 ? "Active Player" : "Active Players"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
