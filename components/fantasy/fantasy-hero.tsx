import * as React from "react";
import Image from "next/image";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

export interface FantasyHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  badge?: React.ReactNode;
  headline: string;
  subheadline?: string;
  actions?: React.ReactNode;
  playerImageSrc?: string | null;
  playerAlt?: string;
  backgroundNumber?: string | number;
  gradient?: "purple" | "fantasyPrimary" | "darkPurple";
}

export function FantasyHero({
  badge,
  headline,
  subheadline,
  actions,
  playerImageSrc,
  playerAlt = "Featured Player",
  backgroundNumber,
  gradient = "purple",
  className,
  ...props
}: FantasyHeroProps) {
  const gradientStyles = {
    purple: "bg-gradient-to-br from-[#37003C] via-[#240027] to-[#1a001c]",
    fantasyPrimary: "bg-gradient-to-br from-[#00D9FF] via-[#00FF87] to-[#E7FF00]",
    darkPurple: "bg-gradient-to-b from-[#37003C] to-[#120014]",
  };

  const isLightGradient = gradient === "fantasyPrimary";

  return (
    <div
      className={cn(
        "relative overflow-hidden py-16 sm:py-24 border-b border-[#5A0A63]/50",
        gradientStyles[gradient],
        isLightGradient ? "text-[#1F1F1F]" : "text-white",
        className
      )}
      {...props}
    >
      {/* Background Watermark Number */}
      {backgroundNumber && (
        <div
          aria-hidden="true"
          className="absolute -right-6 -bottom-10 pointer-events-none select-none font-mono font-black text-[160px] sm:text-[240px] text-white/[0.04] leading-none"
        >
          {backgroundNumber}
        </div>
      )}

      {/* Decorative subtle polygon shapes */}
      <div
        aria-hidden="true"
        className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#00FF87]/10 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-24 right-1/4 h-80 w-80 rounded-full bg-[#E9007F]/15 blur-3xl pointer-events-none"
      />

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Content Column */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            {badge && <div className="inline-block">{badge}</div>}

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] text-inherit">
              {headline}
            </h1>

            {subheadline && (
              <p
                className={cn(
                  "text-base sm:text-lg max-w-xl leading-relaxed mx-auto lg:mx-0",
                  isLightGradient ? "text-[#37003C]/80 font-medium" : "text-indigo-200/90"
                )}
              >
                {subheadline}
              </p>
            )}

            {actions && (
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                {actions}
              </div>
            )}
          </div>

          {/* Optional Prominent Player Imagery Column */}
          {playerImageSrc && (
            <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
              <div className="relative h-64 sm:h-80 lg:h-96 w-64 sm:w-80 lg:w-96">
                <Image
                  src={playerImageSrc}
                  alt={playerAlt}
                  fill
                  priority
                  className="object-contain object-bottom drop-shadow-2xl"
                />
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
