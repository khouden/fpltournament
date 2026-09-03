import * as React from "react";
import Link from "next/link";
import { Trophy, ShieldCheck, ExternalLink } from "lucide-react";
import { Container } from "@/components/layout/container";

export function Footer() {
  return (
    <footer className="w-full bg-[#240027] text-white border-t border-[#37003C] mt-auto">
      <div className="border-b border-[#37003C]/80 py-12 sm:py-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand column */}
            <div className="md:col-span-2 space-y-4">
              <Link href="/" className="inline-flex items-center gap-2.5 group">
                <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#00FF87] text-[#37003C] shadow-fpl-glow-green transition group-hover:scale-105">
                  <Trophy className="h-5 w-5" />
                </div>
                <div className="leading-none">
                  <span className="text-lg font-black tracking-tight text-white">FPL</span>
                  <span className="text-lg font-black tracking-tight text-[#00FF87] ml-1">TOURNAMENTS</span>
                </div>
              </Link>
              <p className="text-sm text-gray-400 max-w-md leading-relaxed">
                The premier competitive platform for Fantasy Premier League knockout tournaments,
                automated gameweek scoring, and private league head-to-head battles.
              </p>
              <div className="flex items-center gap-2 text-xs text-[#00FF87] font-semibold pt-1">
                <ShieldCheck className="h-4 w-4 text-[#00FF87]" />
                <span>Verified FPL API Data Sync & Strict Admin Points Exclusion</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#00D9FF]">
                Tournaments
              </div>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <Link href="/tournaments" className="hover:text-[#00FF87] transition">
                    Browse Tournaments
                  </Link>
                </li>
                <li>
                  <Link href="/#scoring-rules" className="hover:text-[#00FF87] transition">
                    Scoring Rules
                  </Link>
                </li>
                <li>
                  <Link href="/tournaments" className="hover:text-[#00FF87] transition">
                    Live Standings
                  </Link>
                </li>
              </ul>
            </div>

            {/* Admin & Official */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#E7FF00]">
                Platform
              </div>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <Link href="/admin" className="hover:text-[#E7FF00] transition">
                    Admin Portal
                  </Link>
                </li>
                <li>
                  <Link href="/design-system" className="hover:text-[#E7FF00] transition">
                    Design System Catalog
                  </Link>
                </li>
                <li>
                  <a
                    href="https://fantasy.premierleague.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-[#00FF87] transition"
                  >
                    Official FPL Website <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </div>

      {/* Bottom Bar */}
      <div className="py-6 bg-[#1b001d]">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
            <p>© {new Date().getFullYear()} FPL Tournaments. Unofficial Fantasy Premier League companion application.</p>
            <p className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#00FF87] animate-fpl-pulse-dot" />
              <span>All systems operational</span>
            </p>
          </div>
        </Container>
      </div>
    </footer>
  );
}
