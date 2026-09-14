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
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { MatchSquadList, MatchPlayerScoreItem } from "@/components/match-squad-client";
import {
  TeamDetailModal,
  type TeamDirectoryItem,
  type TeamMemberItem,
  type TeamFixtureItem,
} from "./team-detail-modal";

export type { TeamDirectoryItem, TeamMemberItem, TeamFixtureItem };
import { cn } from "@/lib/utils";

export interface TeamStandingItem {
  rank: number;
  groupId: string;
  groupName: string;
  logo: string | null;
  managerName: string;
  topPlayerName?: string;
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
  initialTab?: "overview" | "standings" | "fixtures" | "teams";
}

export function TournamentDetailView({
  tournament,
  standings,
  rounds,
  teams,
  initialTab = "overview",
}: TournamentDetailViewProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "standings" | "fixtures" | "teams"
  >(initialTab);

  const [selectedTeam, setSelectedTeam] = useState<TeamDirectoryItem | null>(null);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");

  const filteredDirectoryTeams = useMemo(() => {
    if (!teamSearchQuery.trim()) return teams;
    const q = teamSearchQuery.toLowerCase().trim();
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.topPlayerName && t.topPlayerName.toLowerCase().includes(q)) ||
        (t.managerName && t.managerName.toLowerCase().includes(q)) ||
        t.members.some(
          (m) =>
            m.fplName.toLowerCase().includes(q) ||
            (m.fplTeamName && m.fplTeamName.toLowerCase().includes(q))
        )
    );
  }, [teams, teamSearchQuery]);

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
                          <th className="py-3 px-3">Top Player</th>
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
                              onClick={() => {
                                const found = teams.find((t) => t.id === team.groupId);
                                if (found) setSelectedTeam(found);
                              }}
                              className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                              title={`View ${team.groupName} details`}
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

                              {/* Top Player Name */}
                              <td className="py-3 px-3 text-gray-600 text-xs font-medium">
                                <span className="inline-flex items-center gap-1">
                                  <Crown className="h-3 w-3 text-amber-500/80 shrink-0" />
                                  <span>{team.topPlayerName || team.managerName}</span>
                                </span>
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
                              onClick={() => {
                                const found = teams.find((t) => t.id === team.groupId);
                                if (found) setSelectedTeam(found);
                              }}
                              className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                              title={`View ${team.groupName} details`}
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
                                <span className="inline-flex items-center gap-1">
                                  <Crown className="h-3 w-3 text-amber-500/80 shrink-0" />
                                  <span>{team.topPlayerName || team.managerName}</span>
                                </span>
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
                        const isRoundLive = r.matches.some(
                          (m) => m.status === "IN_PROGRESS" || m.status === "LIVE"
                        );
                        const isRoundComplete =
                          r.matches.length > 0 &&
                          r.matches.every(
                            (m) => m.status === "COMPLETED" || m.status === "FINALIZED"
                          );
                        return (
                          <button
                            key={r.id}
                            onClick={() => setSelectedRoundId(r.id)}
                            className={cn(
                              "px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5",
                              isSelected
                                ? "bg-[#00D06C] text-white shadow-xs"
                                : isRoundLive
                                ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100/80"
                                : "bg-gray-100/80 text-gray-600 hover:bg-gray-200/80"
                            )}
                          >
                            {isRoundLive && (
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span
                                  className={cn(
                                    "relative inline-flex rounded-full h-1.5 w-1.5",
                                    isSelected ? "bg-white" : "bg-rose-500"
                                  )}
                                ></span>
                              </span>
                            )}
                            <span>{r.name || `Round ${r.roundNumber}`}</span>
                            {isRoundComplete && (
                              <span
                                className={cn(
                                  "text-[10px]",
                                  isSelected ? "text-white/80" : "text-emerald-600 font-bold"
                                )}
                              >
                                ✓
                              </span>
                            )}
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
                        const isLive =
                          match.status === "IN_PROGRESS" || match.status === "LIVE";
                        const isCompleted =
                          match.status === "COMPLETED" || match.status === "FINALIZED";
                        const isScheduled = !isLive && !isCompleted;

                        const homeScore =
                          match.homeScore !== null ? Math.round(match.homeScore) : null;
                        const awayScore =
                          match.awayScore !== null ? Math.round(match.awayScore) : null;
                        const hasScore = homeScore !== null && awayScore !== null;

                        const homeWon = isCompleted && hasScore && homeScore > awayScore;
                        const awayWon = isCompleted && hasScore && awayScore > homeScore;
                        const isDraw = isCompleted && hasScore && homeScore === awayScore;

                        return (
                          <Link
                            key={match.id}
                            href={`/matches/${match.id}`}
                            className={cn(
                              "relative rounded-xl border p-3.5 sm:p-4 flex items-center justify-between transition-all group cursor-pointer overflow-hidden",
                              isLive
                                ? "border-rose-300/90 bg-gradient-to-r from-rose-50/70 via-white to-rose-50/40 hover:border-rose-400 hover:shadow-md shadow-2xs"
                                : isCompleted
                                ? "border-gray-200/90 bg-white hover:border-[#37003C]/30 hover:shadow-xs"
                                : "border-gray-100 bg-[#FCFCFD] hover:bg-white hover:border-gray-300 hover:shadow-xs"
                            )}
                          >
                            {/* Accent Bar on Left */}
                            {isLive && (
                              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500" />
                            )}
                            {isCompleted && (
                              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#00D06C]" />
                            )}

                            {/* Home Team */}
                            <div className="flex items-center justify-end gap-2.5 flex-1 min-w-0 pl-1.5 sm:pl-2">
                              <span
                                className={cn(
                                  "text-sm truncate text-right transition-colors",
                                  homeWon
                                    ? "font-black text-gray-900 group-hover:text-[#37003C]"
                                    : awayWon
                                    ? "font-medium text-gray-500 group-hover:text-gray-700"
                                    : "font-bold text-gray-900 group-hover:text-[#37003C]"
                                )}
                              >
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

                            {/* Score / Status Center Box */}
                            {isLive ? (
                              <div className="mx-2 sm:mx-3 flex flex-col items-center gap-1 shrink-0">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 text-[10px] font-black tracking-wider text-white uppercase shadow-2xs animate-pulse">
                                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                                  LIVE
                                </span>
                                <div className="px-3 sm:px-4 py-1 rounded-lg bg-rose-100/90 border border-rose-200/80 text-center min-w-[75px] sm:min-w-[84px] group-hover:bg-rose-500 group-hover:text-white transition-colors">
                                  <span className="font-black text-sm text-rose-800 group-hover:text-white tracking-wider">
                                    {homeScore ?? 0} - {awayScore ?? 0}
                                  </span>
                                </div>
                              </div>
                            ) : isCompleted ? (
                              <div className="mx-2 sm:mx-3 flex flex-col items-center gap-1 shrink-0">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[10px] font-black tracking-wider text-emerald-700 uppercase">
                                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                                  FT
                                </span>
                                <div className="px-3 sm:px-4 py-1 rounded-lg bg-[#37003C] text-white text-center min-w-[75px] sm:min-w-[84px] shadow-2xs group-hover:bg-[#5A0A63] transition-colors">
                                  <span className="font-black text-sm text-white tracking-wider">
                                    {homeScore} - {awayScore}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="mx-2 sm:mx-3 flex flex-col items-center gap-1 shrink-0">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                                  <Clock className="h-2.5 w-2.5 text-gray-400" />
                                  UPCOMING
                                </span>
                                <div className="px-3 sm:px-4 py-1 rounded-lg bg-gray-100/90 text-center min-w-[75px] sm:min-w-[84px] group-hover:bg-[#37003C] group-hover:text-white transition-colors">
                                  <span className="text-xs font-extrabold text-gray-500 group-hover:text-white uppercase tracking-wider">
                                    VS
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Away Team */}
                            <div className="flex items-center justify-start gap-2.5 flex-1 min-w-0 pr-1.5 sm:pr-2">
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
                              <span
                                className={cn(
                                  "text-sm truncate text-left transition-colors",
                                  awayWon
                                    ? "font-black text-gray-900 group-hover:text-[#37003C]"
                                    : homeWon
                                    ? "font-medium text-gray-500 group-hover:text-gray-700"
                                    : "font-bold text-gray-900 group-hover:text-[#37003C]"
                                )}
                              >
                                {match.awayTeam.name}
                              </span>
                            </div>

                            {/* Right Arrow */}
                            <ChevronRight
                              className={cn(
                                "h-4 w-4 transition-all ml-1 sm:ml-2 shrink-0 group-hover:translate-x-0.5",
                                isLive
                                  ? "text-rose-400 group-hover:text-rose-600"
                                  : isCompleted
                                  ? "text-emerald-500/80 group-hover:text-[#37003C]"
                                  : "text-gray-400 group-hover:text-[#37003C]"
                              )}
                            />
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
                      onClick={() => setSelectedTeam(team)}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100/80 transition-all cursor-pointer group"
                      title={`View ${team.name} roster & details`}
                    >
                      <span className="text-xs font-bold text-gray-400 w-4 text-center group-hover:text-[#37003C]">
                        {idx + 1}
                      </span>
                      {team.logo ? (
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="h-7 w-7 object-contain shrink-0 group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-[#37003C] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {team.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-gray-900 truncate group-hover:text-[#37003C] transition-colors">
                          {team.name}
                        </h4>
                        <p className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                          <Crown className="h-3 w-3 text-amber-500 shrink-0 inline" />
                          <span className="font-semibold text-gray-700 truncate">
                            {team.topPlayerName || team.managerName}
                          </span>
                        </p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-[#37003C] group-hover:translate-x-0.5 transition-all shrink-0" />
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
                        onClick={() => {
                          const found = teams.find((t) => t.id === team.groupId);
                          if (found) setSelectedTeam(found);
                        }}
                        className={`hover:bg-gray-50/90 transition-colors cursor-pointer group ${
                          isFirst ? "bg-emerald-50/30 font-medium" : ""
                        }`}
                        title={`View ${team.groupName} details`}
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
                                className="h-7 w-7 object-contain shrink-0 group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-[#37003C] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                {team.groupName.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-gray-900 group-hover:text-[#37003C] transition-colors">
                                {team.groupName}
                              </div>
                              <div className="text-[11px] text-gray-500 flex items-center gap-1">
                                <Crown className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                                <span>{team.topPlayerName || team.managerName}</span>
                              </div>
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
                  const isRoundLive = r.matches.some(
                    (m) => m.status === "IN_PROGRESS" || m.status === "LIVE"
                  );
                  const isRoundComplete =
                    r.matches.length > 0 &&
                    r.matches.every(
                      (m) => m.status === "COMPLETED" || m.status === "FINALIZED"
                    );
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRoundId(r.id)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5",
                        isSelected
                          ? "bg-[#00D06C] text-white shadow-xs"
                          : isRoundLive
                          ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {isRoundLive && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span
                            className={cn(
                              "relative inline-flex rounded-full h-2 w-2",
                              isSelected ? "bg-white" : "bg-rose-500"
                            )}
                          ></span>
                        </span>
                      )}
                      <span>{r.name || `Round ${r.roundNumber}`} (GW {r.gameweek})</span>
                      {isRoundComplete && (
                        <span
                          className={cn(
                            "text-[10px]",
                            isSelected ? "text-white/80" : "text-emerald-600 font-bold"
                          )}
                        >
                          ✓
                        </span>
                      )}
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
                      const isLive =
                        match.status === "IN_PROGRESS" || match.status === "LIVE";
                      const isCompleted =
                        match.status === "COMPLETED" || match.status === "FINALIZED";
                      const isScheduled = !isLive && !isCompleted;

                      const homeScore =
                        match.homeScore !== null ? Math.round(match.homeScore) : null;
                      const awayScore =
                        match.awayScore !== null ? Math.round(match.awayScore) : null;
                      const hasScore = homeScore !== null && awayScore !== null;

                      const homeWon = isCompleted && hasScore && homeScore > awayScore;
                      const awayWon = isCompleted && hasScore && awayScore > homeScore;
                      const isDraw = isCompleted && hasScore && homeScore === awayScore;

                      return (
                        <div
                          key={match.id}
                          className={cn(
                            "relative overflow-hidden rounded-2xl border p-5 sm:p-6 shadow-xs space-y-3.5 transition-all",
                            isLive
                              ? "border-rose-300/90 bg-gradient-to-r from-rose-50/50 via-white to-rose-50/30 shadow-sm"
                              : isCompleted
                              ? "border-gray-200/90 bg-white hover:border-gray-300"
                              : "border-gray-200/70 bg-[#FAFAFA]"
                          )}
                        >
                          {/* Accent Bar on Left */}
                          {isLive && (
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500" />
                          )}
                          {isCompleted && (
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#00D06C]" />
                          )}

                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            {/* Home Side */}
                            <div className="flex items-center gap-3 flex-1 justify-center sm:justify-start min-w-0 pl-1.5 sm:pl-2">
                              {match.homeTeam.logo ? (
                                <img
                                  src={match.homeTeam.logo}
                                  alt={match.homeTeam.name}
                                  className="h-10 w-10 object-contain shrink-0"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-[#37003C] text-white font-bold text-xs flex items-center justify-center shrink-0">
                                  {match.homeTeam.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0 text-center sm:text-left">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "text-base leading-tight truncate block",
                                      homeWon
                                        ? "font-black text-gray-900"
                                        : awayWon
                                        ? "font-semibold text-gray-500"
                                        : "font-extrabold text-gray-900"
                                    )}
                                  >
                                    {match.homeTeam.name}
                                  </span>
                                  {homeWon && (
                                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md shrink-0">
                                      WINNER
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Center Score Display */}
                            {isLive ? (
                              <div className="flex flex-col items-center gap-1.5 shrink-0">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-2xs animate-pulse">
                                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                                  LIVE MATCH
                                </span>
                                <div className="text-center px-5 py-2 rounded-xl bg-rose-100/90 border border-rose-200/80 min-w-[100px] shadow-2xs">
                                  <span className="font-black text-xl text-rose-800 tracking-widest">
                                    {homeScore ?? 0} - {awayScore ?? 0}
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold text-rose-600">Provisional Score</span>
                              </div>
                            ) : isCompleted ? (
                              <div className="flex flex-col items-center gap-1.5 shrink-0">
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                  FULL TIME
                                </span>
                                <div className="text-center px-5 py-2 rounded-xl bg-[#37003C] text-white min-w-[100px] shadow-2xs">
                                  <span className="font-black text-xl text-white tracking-widest">
                                    {homeScore} - {awayScore}
                                  </span>
                                </div>
                                <span className="text-[10px] font-semibold text-gray-500">Official Result</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1.5 shrink-0">
                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  SCHEDULED
                                </span>
                                <div className="text-center px-5 py-2 rounded-xl bg-white border border-gray-200 text-gray-500 min-w-[100px]">
                                  <span className="font-black text-xs uppercase tracking-widest text-gray-500">
                                    VS
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Away Side */}
                            <div className="flex items-center gap-3 flex-1 justify-center sm:justify-end min-w-0 pr-1.5 sm:pr-2">
                              <div className="min-w-0 text-center sm:text-right">
                                <div className="flex items-center justify-center sm:justify-end gap-2">
                                  {awayWon && (
                                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md shrink-0">
                                      WINNER
                                    </span>
                                  )}
                                  <span
                                    className={cn(
                                      "text-base leading-tight truncate block",
                                      awayWon
                                        ? "font-black text-gray-900"
                                        : homeWon
                                        ? "font-semibold text-gray-500"
                                        : "font-extrabold text-gray-900"
                                    )}
                                  >
                                    {match.awayTeam.name}
                                  </span>
                                </div>
                              </div>
                              {match.awayTeam.logo ? (
                                <img
                                  src={match.awayTeam.logo}
                                  alt={match.awayTeam.name}
                                  className="h-10 w-10 object-contain shrink-0"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-[#37003C] text-white font-bold text-xs flex items-center justify-center shrink-0">
                                  {match.awayTeam.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Match Action Link & Footer */}
                          <div
                            className={cn(
                              "pt-3 border-t flex items-center justify-between text-xs",
                              isLive ? "border-rose-100" : "border-gray-100"
                            )}
                          >
                            {isLive ? (
                              <span className="inline-flex items-center gap-1.5 font-bold text-rose-600">
                                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                                Match #{match.matchNumber} · Live in Progress
                              </span>
                            ) : isCompleted ? (
                              <span className="inline-flex items-center gap-1.5 font-bold text-gray-600">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                Match #{match.matchNumber} · {match.status === "FINALIZED" ? "Finalized Result" : "Completed"}
                              </span>
                            ) : (
                              <span className="text-gray-400 font-medium">
                                Match #{match.matchNumber} · Scheduled
                              </span>
                            )}

                            <Link
                              href={`/matches/${match.id}`}
                              className={cn(
                                "font-bold inline-flex items-center gap-1 transition-colors",
                                isLive
                                  ? "text-rose-600 hover:text-rose-700"
                                  : isCompleted
                                  ? "text-[#00A855] hover:text-[#008f49]"
                                  : "text-gray-500 hover:text-gray-900"
                              )}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
                  <Users className="h-6 w-6 text-[#37003C]" />
                  <span>Participating Teams</span>
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Directory of all fantasy clubs competing in this tournament. Click any team to view full roster and match details.
                </p>
              </div>

              <div className="flex items-center gap-3 self-stretch sm:self-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search teams or players..."
                    value={teamSearchQuery}
                    onChange={(e) => setTeamSearchQuery(e.target.value)}
                    className="h-9 pl-8 text-xs rounded-xl bg-gray-50/70 border-gray-200"
                  />
                </div>
                <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-2 rounded-xl shrink-0">
                  {teams.length} Teams
                </span>
              </div>
            </div>

            {filteredDirectoryTeams.length === 0 ? (
              <div className="p-12 text-center bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-500">
                No teams found matching &quot;{teamSearchQuery}&quot;
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {filteredDirectoryTeams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className="relative rounded-2xl border border-gray-200/80 bg-white p-5 flex flex-col items-center text-center hover:border-[#37003C]/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer"
                    title={`Click to view ${team.name} roster and info`}
                  >
                    {/* Rank Badge in Corner */}
                    {team.rank && (
                      <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-gray-100 group-hover:bg-[#37003C] group-hover:text-white transition-colors font-mono text-[10px] font-black text-gray-700 flex items-center justify-center">
                        #{team.rank}
                      </div>
                    )}

                    {/* Crest */}
                    <div className="mb-3">
                      {team.logo ? (
                        <div className="h-16 w-16 rounded-2xl bg-gray-50 p-2 border border-gray-200 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                          <img
                            src={team.logo}
                            alt={team.name}
                            className="h-12 w-12 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-2xl bg-[#37003C] text-white font-black text-lg flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                          {team.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Team Name */}
                    <h3 className="font-extrabold text-sm sm:text-base text-gray-900 truncate w-full group-hover:text-[#37003C] transition-colors">
                      {team.name}
                    </h3>

                    {/* Top Player Name */}
                    <div className="text-xs text-gray-600 font-medium mt-1 flex items-center justify-center gap-1.5 truncate max-w-full">
                      <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="text-gray-400 font-semibold">Top Player:</span>
                      <span className="font-bold text-gray-800 truncate">
                        {team.topPlayerName || team.managerName}
                      </span>
                    </div>

                    {/* Active Player Count */}
                    <span className="mt-2.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                      {team.activePlayerCount} {team.activePlayerCount === 1 ? "Active Player" : "Active Players"}
                    </span>

                    {/* Quick Standings Stat if available */}
                    {team.leaguePoints !== undefined && (
                      <div className="mt-2 text-[11px] font-bold text-gray-500 flex items-center gap-1">
                        <span>{team.won ?? 0}W-{team.drawn ?? 0}D-{team.lost ?? 0}L</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-[#37003C] font-black">{team.leaguePoints} pts</span>
                      </div>
                    )}

                    {/* Interactive Hover Prompt */}
                    <div className="mt-4 pt-3 border-t border-gray-100 w-full text-center">
                      <span className="text-[11px] font-bold text-[#37003C] group-hover:text-[#5A0A63] flex items-center justify-center gap-1 transition-colors">
                        <span>View Team &amp; Roster</span>
                        <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Team Detail Modal */}
        {selectedTeam && (
          <TeamDetailModal
            isOpen={!!selectedTeam}
            onClose={() => setSelectedTeam(null)}
            team={selectedTeam}
            tournamentName={tournament.name}
            seasonDisplay={tournament.seasonDisplay}
            currentGameweek={selectedRound?.gameweek || 1}
            allowBenchBoost={tournament.allowBenchBoost}
            allowTripleCaptain={tournament.allowTripleCaptain}
          />
        )}
      </main>
    </div>
  );
}
