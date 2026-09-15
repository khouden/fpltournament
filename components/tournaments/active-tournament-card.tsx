"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Clock, Users, Loader2 } from "lucide-react";
import type { TournamentCardItem } from "@/lib/tournaments-data";

interface ActiveTournamentCardProps {
  tournament: TournamentCardItem;
}

export function ActiveTournamentCard({ tournament }: ActiveTournamentCardProps) {
  const [isNavigating, setIsNavigating] = React.useState(false);
  return (
    <article className="group relative flex flex-col justify-between rounded-[20px] border border-[#E8ECF2] bg-white overflow-hidden shadow-[0_2px_12px_rgba(11,8,30,0.03)] hover:shadow-[0_12px_32px_rgba(11,8,30,0.08)] hover:-translate-y-1 transition-all duration-200">
      {/* Top Banner Area */}
      <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-[#16042B]">
        <Image
          src={tournament.banner}
          alt={tournament.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized={tournament.banner.startsWith("http") || tournament.banner.startsWith("data:")}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Soft gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-black/30" />

        {/* FEATURED Badge */}
        {tournament.isFeatured && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center rounded-full bg-[#00FF87] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#0B081E] shadow-xs">
              FEATURED
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
        <div>
          {/* Tournament Title & Subtitle */}
          <h3 className="text-lg sm:text-xl font-black tracking-tight text-gray-900 line-clamp-1 transition-colors group-hover:text-[#37003C]">
            {tournament.name}
          </h3>
          <p className="mt-1 text-xs text-gray-500 font-medium line-clamp-1">
            {tournament.description}
          </p>

          {/* Progress Bar & Current Round */}
          <div className="mt-4">
            <div className="flex items-center justify-end mb-1.5">
              <span className="text-[11px] font-bold text-gray-500">
                Round {tournament.currentRound} / {tournament.totalRounds || 1}
              </span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00D9FF] to-[#00FF87] rounded-full transition-all duration-500"
                style={{ width: `${tournament.progressPercent}%` }}
              />
            </div>
          </div>

          {/* 3-Column Stats Row */}
          <div className="mt-4 grid grid-cols-3 gap-1.5 py-3 border-y border-gray-100">
            {/* Teams */}
            <div className="flex items-center gap-2 min-w-0">
              <Users className="h-4 w-4 text-gray-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-black text-gray-900 leading-tight">
                  {tournament.teamsCount}
                </div>
                <div className="text-[10px] sm:text-[11px] text-gray-400 font-medium leading-none mt-0.5">
                  Teams
                </div>
              </div>
            </div>

            {/* Rounds */}
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="h-4 w-4 text-gray-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-black text-gray-900 leading-tight">
                  {tournament.roundsCount}
                </div>
                <div className="text-[10px] sm:text-[11px] text-gray-400 font-medium leading-none mt-0.5">
                  Rounds
                </div>
              </div>
            </div>

            {/* Season */}
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="h-4 w-4 text-gray-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] sm:text-xs font-black text-gray-900 leading-tight whitespace-nowrap">
                  {tournament.seasonFormatted}
                </div>
                <div className="text-[10px] sm:text-[11px] text-gray-400 font-medium leading-none mt-0.5">
                  Season
                </div>
              </div>
            </div>
          </div>

          {/* Top 3 Standings Section */}
          <div className="mt-4">
            <div className="text-xs font-bold text-gray-800 mb-2.5">
              Top 3
            </div>

            <div className="space-y-2">
              {tournament.top3.length > 0 ? (
                tournament.top3.map((team, idx) => (
                  <div
                    key={`${team.name}-${idx}`}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Circular Rank Medal */}
                      {idx === 0 && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[#B45309] text-[10px] font-black">
                          1
                        </span>
                      )}
                      {idx === 1 && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B] text-[10px] font-black">
                          2
                        </span>
                      )}
                      {idx === 2 && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFEDD5] text-[#C2410C] text-[10px] font-black">
                          3
                        </span>
                      )}

                      {/* Logo / Avatar */}
                      <div className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full overflow-hidden bg-gray-100 text-[9px] font-bold text-gray-600">
                        {team.logo ? (
                          <Image
                            src={team.logo}
                            alt={team.name}
                            width={20}
                            height={20}
                            className="object-cover"
                          />
                        ) : (
                          team.name.charAt(0)
                        )}
                      </div>

                      {/* Team Name */}
                      <span className="font-medium text-gray-800 truncate">
                        {team.name}
                      </span>
                    </div>

                    {/* Points */}
                    <span
                      suppressHydrationWarning
                      className="text-xs font-medium text-gray-600 shrink-0 ml-2"
                    >
                      {team.points.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} pts
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-400 italic py-1">
                  Standings will appear once matches begin.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-5 pt-2">
          <Link
            href={`/tournaments/${tournament.id}`}
            onClick={() => setIsNavigating(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#2D0036] hover:bg-[#3E004B] text-white py-2.5 px-4 rounded-xl text-xs font-black tracking-wide shadow-xs transition-all duration-150 group"
          >
            {isNavigating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00FFA3]" />
                <span className="text-[#00FFA3]">Opening...</span>
              </>
            ) : (
              <>
                <span>View tournament</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Link>
        </div>
      </div>
    </article>
  );
}
