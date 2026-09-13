"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { MobileNavigation } from "@/components/navigation/mobile-navigation";
import { IconButton } from "@/components/ui/icon-button";
import { FplLogo } from "@/components/brand/fpl-logo";

export function MobileHeader() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <header className="md:hidden w-full bg-[#0B081E] text-white border-b border-white/[0.08] sticky top-0 z-40 px-4 h-15 flex items-center justify-between shadow-fpl-sm backdrop-blur-md">
        <FplLogo size="sm" />

        <IconButton
          icon={<Menu className="h-5 w-5 text-white" />}
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
