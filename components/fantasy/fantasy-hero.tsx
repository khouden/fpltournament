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
  visual?: React.ReactNode;
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
  visual,
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
        "relative overflow-hidden py-14 sm:py-20 lg:py-24 border-b border-[#E5E5E5]",
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
          className={cn(
            "absolute -right-6 -bottom-10 pointer-events-none select-none font-mono font-black text-[160px] sm:text-[240px] leading-none",
            isLightGradient ? "text-[#37003C]/[0.05]" : "text-white/[0.04]"
          )}
        >
          {backgroundNumber}
        </div>
      )}

      {/* Subtle decorative geometric overlay shapes */}
      <div
        aria-hidden="true"
        className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/20 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-24 right-1/4 h-80 w-80 rounded-full bg-[#37003C]/10 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 right-12 h-64 w-64 rounded-full bg-[#00FF87]/20 blur-2xl pointer-events-none"
      />

      {/* Diagonal angled polygon accent */}
      <div
        aria-hidden="true"
        className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/15 rotate-12 rounded-3xl pointer-events-none transform"
      />

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          {/* Content Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {badge && <div className="inline-block">{badge}</div>}

            <h1
              className={cn(
                "text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-black tracking-tight leading-[1.02] uppercase font-sans",
                isLightGradient ? "text-[#37003C]" : "text-white"
              )}
            >
              {headline}
            </h1>

            {subheadline && (
              <p
                className={cn(
                  "text-base sm:text-lg lg:text-[19px] max-w-xl leading-relaxed mx-auto lg:mx-0 font-medium",
                  isLightGradient
                    ? "text-[#37003C]/85"
                    : "text-indigo-200/90"
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

          {/* Visual Column */}
          {(visual || playerImageSrc) && (
            <div className="lg:col-span-5 relative flex justify-center lg:justify-end items-center">
              {visual ? (
                visual
              ) : playerImageSrc ? (
                <div className="relative h-72 sm:h-96 lg:h-[440px] w-72 sm:w-96 lg:w-[440px]">
                  <Image
                    src={playerImageSrc}
                    alt={playerAlt}
                    fill
                    priority
                    className="object-contain object-bottom drop-shadow-2xl"
                  />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
