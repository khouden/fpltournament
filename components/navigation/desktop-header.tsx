import * as React from "react";
import { Container } from "@/components/layout/container";
import { PrimaryNavigation } from "@/components/navigation/primary-navigation";
import { FplLogo } from "@/components/brand/fpl-logo";

export function DesktopHeader() {
  return (
    <header className="hidden md:block w-full bg-[#0B081E] text-white border-b border-white/[0.08] sticky top-0 z-50 backdrop-blur-md">
      <Container>
        <div className="flex h-18 items-center justify-between gap-6">
          {/* Brand Logo */}
          <FplLogo size="md" />

          {/* Primary Navigation */}
          <PrimaryNavigation />
        </div>
      </Container>
    </header>
  );
}
