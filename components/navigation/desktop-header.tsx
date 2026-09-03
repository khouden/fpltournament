import * as React from "react";
import Link from "next/link";
import { Trophy, ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PrimaryNavigation } from "@/components/navigation/primary-navigation";
import { Button } from "@/components/ui/button";

export function DesktopHeader() {
  return (
    <header className="hidden md:block w-full bg-[#37003C] text-white border-b border-[#5A0A63] sticky top-0 z-40 shadow-fpl-sm">
      <Container>
        <div className="flex h-16 items-center justify-between gap-6">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#00FF87] text-[#37003C] shadow-fpl-glow-green transition-transform group-hover:scale-105">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-black tracking-tight text-white">
                FPL <span className="text-[#00FF87]">TOURNAMENTS</span>
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-200/70">
                Knockout Engine
              </span>
            </div>
          </Link>

          {/* Primary Navigation */}
          <PrimaryNavigation />

          {/* Action CTA */}
          <div className="flex items-center gap-3">
            <Button asChild variant="fantasy" size="sm" className="shadow-fpl-glow-green">
              <Link href="/tournaments">
                <span>View Tournaments</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </header>
  );
}
