import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { PrimaryNavigation } from "@/components/navigation/primary-navigation";
import { Button } from "@/components/ui/button";
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

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="glass"
              size="sm"
              className="rounded-full px-5 py-2 text-xs font-bold border border-white/20 hover:border-white/35"
            >
              <Link href="/admin">Log in</Link>
            </Button>

            <Button
              asChild
              variant="neon"
              size="sm"
              className="rounded-full px-5 py-2 text-xs font-black text-[#0B081E] shadow-[0_0_18px_rgba(0,255,163,0.35)] hover:shadow-[0_0_24px_rgba(0,255,163,0.5)]"
            >
              <Link href="/tournaments">Get started</Link>
            </Button>
          </div>
        </div>
      </Container>
    </header>
  );
}
