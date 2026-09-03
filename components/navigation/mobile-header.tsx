"use client";

import * as React from "react";
import Link from "next/link";
import { Trophy, Menu } from "lucide-react";
import { MobileNavigation } from "@/components/navigation/mobile-navigation";
import { IconButton } from "@/components/ui/icon-button";

export function MobileHeader() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <header className="md:hidden w-full bg-[#37003C] text-white border-b border-[#5A0A63] sticky top-0 z-40 px-4 h-14 flex items-center justify-between shadow-fpl-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#00FF87] text-[#37003C]">
            <Trophy className="h-4 w-4" />
          </div>
          <span className="text-sm font-black tracking-tight text-white">
            FPL <span className="text-[#00FF87]">TOURNAMENTS</span>
          </span>
        </Link>

        <IconButton
          icon={<Menu className="h-5 w-5" />}
          aria-label="Open menu"
          size="icon-sm"
          variant="subtle"
          onClick={() => setIsOpen(true)}
        />
      </header>

      <MobileNavigation isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
