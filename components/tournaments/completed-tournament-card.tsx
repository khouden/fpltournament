import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { TournamentCardItem } from "@/lib/tournaments-data";

interface CompletedTournamentCardProps {
  tournament: TournamentCardItem;
}

export function CompletedTournamentCard({ tournament }: CompletedTournamentCardProps) {
  return (
    <article className="group relative flex flex-col justify-between rounded-[20px] border border-[#E8ECF2] bg-white overflow-hidden shadow-[0_2px_10px_rgba(11,8,30,0.03)] hover:shadow-[0_8px_24px_rgba(11,8,30,0.07)] hover:-translate-y-0.5 transition-all duration-200">
      {/* Top Banner */}
      <div className="relative h-24 sm:h-28 w-full overflow-hidden bg-[#16042B]">
        <Image
          src={tournament.banner}
          alt={tournament.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          unoptimized={tournament.banner.startsWith("http")}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Soft overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/20" />

        {/* COMPLETED Tag */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className="inline-flex items-center rounded-full bg-white/30 backdrop-blur-md border border-white/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xs">
            COMPLETED
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          {/* Tournament Name & Season */}
          <h4 className="text-sm sm:text-[15px] font-black tracking-tight text-gray-900 line-clamp-1 transition-colors group-hover:text-[#37003C]">
            {tournament.name}
          </h4>
          <div className="text-[11px] text-gray-400 font-medium mt-0.5">
            {tournament.seasonFormatted}
          </div>

          {/* Top 3 Section */}
          <div className="mt-3">
            <div className="text-[11px] font-bold text-gray-700 mb-2">
              Top 3
            </div>

            <div className="space-y-1.5">
              {tournament.top3.slice(0, 3).map((team, idx) => (
                <div
                  key={`${team.name}-${idx}`}
                  className="flex items-center justify-between text-[11px]"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {/* Medal Badge */}
                    {idx === 0 && (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[#B45309] text-[9px] font-black">
                        1
                      </span>
                    )}
                    {idx === 1 && (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B] text-[9px] font-black">
                        2
                      </span>
                    )}
                    {idx === 2 && (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FFEDD5] text-[#C2410C] text-[9px] font-black">
                        3
                      </span>
                    )}

                    {/* Team Name */}
                    <span className="font-medium text-gray-800 truncate">
                      {team.name}
                    </span>
                  </div>

                  {/* Points */}
                  <span
                    suppressHydrationWarning
                    className="text-[11px] font-medium text-gray-500 shrink-0 ml-1"
                  >
                    {team.points.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* View Results Link */}
        <div className="mt-4 pt-2.5 border-t border-gray-100">
          <Link
            href={`/tournaments/${tournament.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#00A86B] hover:text-[#008F5B] transition-colors"
          >
            <span>View results</span>
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
