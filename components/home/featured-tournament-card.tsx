import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Shield, Calendar, ArrowRight, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FeaturedTournamentItem {
  id: string;
  name: string;
  description?: string;
  status: "LIVE" | "UPCOMING" | "COMPLETED" | "FINISHED";
  crestType?: "cup" | "crown" | "shield";
  banner?: string | null;
  participants: string;
  gameweeks: string;
  prizePool?: string;
  prizeLabel?: string;
  href: string;
  buttonVariant?: "dark" | "outline";
}

export function FeaturedTournamentCard({
  item,
  className,
}: {
  item: FeaturedTournamentItem;
  className?: string;
}) {
  const isLive = item.status === "LIVE";
  const isCompleted = item.status === "COMPLETED" || item.status === "FINISHED";

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-[20px] border border-[#E8ECF2] bg-white overflow-hidden transition-all duration-300 hover:shadow-[0_20px_45px_rgba(11,8,30,0.09)] hover:-translate-y-1 hover:border-[#CBD5E1]",
        className
      )}
    >
      {/* Graphic Banner */}
      <div className="relative h-44 sm:h-52 w-full bg-[#150B33] overflow-hidden flex items-center justify-center">
        {item.banner ? (
          <>
            {/* Real Tournament Banner Image */}
            <Image
              src={item.banner}
              alt={item.name}
              fill
              unoptimized={item.banner.startsWith("http")}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Top fantasy neon accent glow line */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#00D9FF] via-[#00FFA3] to-[#E7FF00] z-10"
            />
            {/* Cinematic subtle contrast gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

            {/* Bottom Tournament pill badge */}
            <div className="absolute bottom-3 left-3.5 z-10 flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/20 px-2.5 py-0.5 shadow-sm">
              <Trophy className="h-3 w-3 text-[#00FFA3]" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white/95">
                Championship
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Fallback deep cosmic gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#180B3A] via-[#12082E] to-[#0D0524]" />

            {/* Dynamic Neon Green Speed Streaks */}
            <div
              aria-hidden="true"
              className="absolute -top-6 -left-10 w-48 h-24 bg-gradient-to-r from-transparent via-[#00FFA3]/35 to-transparent -rotate-30 blur-sm pointer-events-none"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-8 -right-8 w-56 h-28 bg-gradient-to-l from-transparent via-[#00FFA3]/40 to-transparent -rotate-25 blur-xs pointer-events-none"
            />
            <div
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full bg-[#00FFA3]/15 blur-2xl pointer-events-none"
            />

            {/* Central Glowing Crest for cards without image */}
            <div className="relative z-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <div className="relative flex h-20 w-18 items-center justify-center">
                <svg viewBox="0 0 60 70" fill="none" className="w-16 h-18" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M30 65C30 65 52 53 52 28V14L30 6L8 14V28C8 53 30 65 30 65Z"
                    fill="#160B33"
                    stroke="#00FFA3"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                  />
                  {item.crestType === "cup" && (
                    <>
                      <path d="M20 18L24 12L30 16L36 12L40 18" stroke="#00FFA3" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="30" cy="34" r="8" stroke="#00FFA3" strokeWidth="2.5" fill="#0E0720" />
                      <polygon points="30,31 33,33 32,36 28,36 27,33" fill="#00FFA3" />
                    </>
                  )}
                  {item.crestType === "crown" && (
                    <>
                      <path d="M18 25L24 16L30 22L36 16L42 25" stroke="#00FFA3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M22 37L30 31L38 37L30 43Z" fill="#00FFA3" />
                    </>
                  )}
                  {item.crestType === "shield" && (
                    <>
                      <path d="M22 22H38V30C38 34.4 34.4 38 30 38C25.6 38 22 34.4 22 30V22Z" stroke="#00FFA3" strokeWidth="2.5" />
                      <path d="M22 25H17C17 29 20 31 22 31" stroke="#00FFA3" strokeWidth="2" strokeLinecap="round" />
                      <path d="M38 25H43C43 29 40 31 38 31" stroke="#00FFA3" strokeWidth="2" strokeLinecap="round" />
                      <line x1="30" y1="38" x2="30" y2="44" stroke="#00FFA3" strokeWidth="2.5" />
                      <line x1="24" y1="44" x2="36" y2="44" stroke="#00FFA3" strokeWidth="2.5" strokeLinecap="round" />
                    </>
                  )}
                </svg>
              </div>
            </div>
          </>
        )}

        {/* Status Badge (Top Right) */}
        <div className="absolute top-3.5 right-3.5 z-20">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00FFA3] text-[#0B081E] px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-[0_0_12px_rgba(0,255,163,0.4)]">
              LIVE
            </span>
          ) : isCompleted ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 px-3 py-1 text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
              COMPLETED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#8B5CF6]/40 border border-[#8B5CF6]/60 text-[#DDD6FE] px-3 py-1 text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
              UPCOMING
            </span>
          )}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between gap-5">
        <div>
          <h3 className="text-xl sm:text-[22px] font-black tracking-tight text-[#0B081E] group-hover:text-[#160B33] transition-colors">
            {item.name}
          </h3>
        </div>

        {/* Metadata Details */}
        <div className="pt-3 border-t border-[#F1F5F9]">
          <div className="grid grid-cols-2 gap-4">
            {/* Teams */}
            <div className="flex items-center gap-2.5">
              <Shield className="h-4 w-4 text-[#64748B] shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-black text-[#0B081E] leading-none">
                  {item.participants}
                </span>
                <span className="text-[11px] font-medium text-[#64748B] mt-0.5">
                  Teams
                </span>
              </div>
            </div>

            {/* Gameweeks */}
            <div className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-[#64748B] shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-black text-[#0B081E] leading-none">
                  {item.gameweeks}
                </span>
                <span className="text-[11px] font-medium text-[#64748B] mt-0.5">
                  Gameweeks
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {item.buttonVariant === "outline" ? (
            <Link
              href={item.href}
              className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-full border border-[#CBD5E1] bg-white text-[#0B081E] font-extrabold text-sm tracking-tight transition-all duration-200 hover:bg-[#F8F9FD] hover:border-[#94A3B8]"
            >
              <span>View tournament</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          ) : (
            <Link
              href={item.href}
              className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-full bg-[#160B33] text-white font-extrabold text-sm tracking-tight transition-all duration-200 hover:bg-[#251352] shadow-sm"
            >
              <span>View tournament</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
