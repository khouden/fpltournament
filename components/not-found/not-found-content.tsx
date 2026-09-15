"use client";

import * as React from "react";
import Link from "next/link";
import { Home, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

export function NotFoundContent() {
  return (
    <div className="w-full bg-white py-16 sm:py-24">
      <Container>
        <div className="max-w-xl mx-auto text-center space-y-6">
          {/* Subtle Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#37003C]/5 border border-[#37003C]/10 text-xs font-bold text-[#37003C]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E9007F]" />
            <span>404 Error</span>
          </div>

          {/* Clean 404 Display */}
          <div className="select-none">
            <span className="text-7xl sm:text-9xl font-black tracking-tight text-[#1F1F1F] leading-none">
              4<span className="text-[#37003C]">0</span>4
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1F1F1F]">
            Page not found
          </h1>

          {/* Simple, clear description */}
          <p className="text-base text-[#555555] leading-relaxed max-w-md mx-auto">
            Sorry, the tournament, fixture, or page you are looking for doesn&apos;t exist or has been moved.
          </p>

          {/* Clean Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              variant="default"
              size="pill"
              className="cursor-pointer bg-[#37003C] hover:bg-[#5A0A63] text-white font-semibold shadow-xs"
            >
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="pill"
              className="cursor-pointer border-[#E5E5E5] text-[#1F1F1F] hover:bg-[#F7F7F7] font-semibold"
            >
              <Link href="/tournaments">
                <Trophy className="w-4 h-4 mr-2 text-[#37003C]" />
                Browse Tournaments
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
