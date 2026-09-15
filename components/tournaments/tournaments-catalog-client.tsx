"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Search, Trophy, X } from "lucide-react";
import type { TournamentCardItem } from "@/lib/tournaments-data";
import { ActiveTournamentCard } from "@/components/tournaments/active-tournament-card";
import { CompletedTournamentCard } from "@/components/tournaments/completed-tournament-card";

interface TournamentsCatalogClientProps {
  activeTournaments: TournamentCardItem[];
  completedTournaments: TournamentCardItem[];
}

export function TournamentsCatalogClient({
  activeTournaments,
  completedTournaments,
}: TournamentsCatalogClientProps) {
  const [selectedTab, setSelectedTab] = React.useState<"active" | "completed">("active");
  const [searchQuery, setSearchQuery] = React.useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("q") || params.get("search") || "";
    }
    return "";
  });

  // Smooth scroll to target section when tab is clicked
  const handleTabClick = (tab: "active" | "completed") => {
    setSelectedTab(tab);
    const targetId = tab === "active" ? "active-tournaments" : "completed-tournaments";
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Filter lists based on search query
  const filteredActive = React.useMemo(() => {
    if (!searchQuery.trim()) return activeTournaments;
    const q = searchQuery.toLowerCase();
    return activeTournaments.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.seasonFormatted.toLowerCase().includes(q)
    );
  }, [activeTournaments, searchQuery]);

  const filteredCompleted = React.useMemo(() => {
    if (!searchQuery.trim()) return completedTournaments;
    const q = searchQuery.toLowerCase();
    return completedTournaments.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.seasonFormatted.toLowerCase().includes(q)
    );
  }, [completedTournaments, searchQuery]);

  return (
    <div className="pt-8 sm:pt-10 pb-20">
      {/* Filter & Search Bar Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-10">
        {/* Segmented Pill Tabs */}
        <div className="inline-flex items-center rounded-full border border-[#E2E8F0] bg-white p-1 shadow-xs">
          <button
            type="button"
            onClick={() => handleTabClick("active")}
            className={`rounded-full px-5 py-2 text-xs sm:text-sm font-bold transition-all duration-200 ${
              selectedTab === "active"
                ? "bg-[#2D0036] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Active Tournaments
          </button>
          <button
            type="button"
            onClick={() => handleTabClick("completed")}
            className={`rounded-full px-5 py-2 text-xs sm:text-sm font-bold transition-all duration-200 ${
              selectedTab === "completed"
                ? "bg-[#2D0036] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Completed Tournaments
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72 md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tournaments..."
            className="w-full rounded-full sm:rounded-xl border border-gray-200 bg-white pl-10 pr-9 py-2 text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#2D0036] focus:outline-none focus:ring-2 focus:ring-[#2D0036]/15 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: ACTIVE TOURNAMENTS */}
      <section
        id="active-tournaments"
        aria-labelledby="active-tournaments-title"
        className="scroll-mt-24"
      >
        {/* Section Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF87] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00FF87]" />
            </span>
            <h2
              id="active-tournaments-title"
              className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-900"
            >
              ACTIVE TOURNAMENTS
            </h2>
          </div>
          <p className="text-xs text-gray-500 font-medium">
            Currently running tournaments. Join now and make your mark!
          </p>
        </div>

        {/* Active Cards Grid */}
        {filteredActive.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filteredActive.map((tournament) => (
              <ActiveTournamentCard
                key={tournament.id}
                tournament={tournament}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
            <Trophy className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <div className="text-sm font-bold text-gray-800">
              No active tournaments found
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {searchQuery
                ? `No tournament matches "${searchQuery}". Try a different search.`
                : "Check back soon for new competitions."}
            </p>
          </div>
        )}
      </section>

      {/* SECTION 2: COMPLETED TOURNAMENTS */}
      <section
        id="completed-tournaments"
        aria-labelledby="completed-tournaments-title"
        className="mt-14 sm:mt-18 pt-10 sm:pt-12 border-t border-gray-200/80 scroll-mt-24"
      >
        {/* Section Header */}
        <div className="flex items-start sm:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2D0036] text-white">
              <Check className="h-3 w-3 stroke-[3]" />
            </div>
            <h2
              id="completed-tournaments-title"
              className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-900"
            >
              COMPLETED TOURNAMENTS
            </h2>
          </div>

          <Link
            href="#completed-tournaments"
            onClick={(e) => {
              e.preventDefault();
              handleTabClick("completed");
            }}
            className="text-xs font-bold text-[#00A86B] hover:text-[#008F5B] transition-colors shrink-0"
          >
            View all completed &rarr;
          </Link>
        </div>
        <p className="text-xs text-gray-500 font-medium mb-6">
          Check out the results of past tournaments and see who stood on top.
        </p>

        {/* Completed Cards Grid */}
        {filteredCompleted.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredCompleted.map((tournament) => (
              <CompletedTournamentCard
                key={tournament.id}
                tournament={tournament}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
            <div className="text-sm font-bold text-gray-800">
              No completed tournaments found
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {searchQuery
                ? `No completed tournament matches "${searchQuery}".`
                : "Completed tournaments will appear here."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
