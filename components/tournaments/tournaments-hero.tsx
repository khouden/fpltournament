import * as React from "react";
import Image from "next/image";
import { Container } from "@/components/layout/container";

export function TournamentsHero() {
  return (
    <section className="relative overflow-hidden bg-[#0A021A] min-h-[340px] sm:min-h-[380px] lg:min-h-[430px] flex items-center border-b border-white/[0.08]">
      {/* Responsive Hero Background Images */}
      {/* 1. Small Screens (< md / Mobile): Tailored vertical composition */}
      <div className="absolute inset-0 z-0 block md:hidden">
        <Image
          src="/images/backgrounds/tournaments-hero-small.jpg"
          alt="FPL Tournaments Hero Mobile"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 0vw"
          className="object-cover object-[center_bottom] select-none pointer-events-none"
        />
        {/* Dark vignette to ensure pristine text legibility at the top */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A021A] via-[#0A021A]/80 to-transparent h-4/5 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0A021A] to-transparent pointer-events-none" />
      </div>

      {/* 2. Medium Screens (md to lg / Tablet): Tailored 4:3 composition */}
      <div className="absolute inset-0 z-0 hidden md:block lg:hidden">
        <Image
          src="/images/backgrounds/tournaments-hero-medium.jpg"
          alt="FPL Tournaments Hero Tablet"
          fill
          priority
          sizes="(min-width: 768px) and (max-width: 1024px) 100vw, 0vw"
          className="object-cover object-right select-none pointer-events-none"
        />
        {/* Soft dark vignette on the left */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A021A] via-[#0A021A]/80 to-transparent w-3/5 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0A021A] to-transparent pointer-events-none" />
      </div>

      {/* 3. Large Screens (lg+ / Desktop): Original panoramic artwork */}
      <div className="absolute inset-0 z-0 hidden lg:block">
        <Image
          src="/images/backgrounds/tournaments page hero background.png"
          alt="FPL Tournaments Hero Banner"
          fill
          priority
          sizes="(min-width: 1024px) 100vw, 0vw"
          className="object-cover object-right select-none pointer-events-none"
        />
        {/* Soft dark vignette on the left for crisp typography */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A021A] via-[#0A021A]/85 to-transparent w-2/3 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0A021A] to-transparent pointer-events-none" />
      </div>

      <Container className="relative z-10 py-12 sm:py-16 lg:py-20">
        <div className="max-w-xl">
          {/* Eyebrow / Category Tag */}
          <div className="text-[#00FF87] font-black text-xs sm:text-[13px] uppercase tracking-[0.2em] mb-2.5 sm:mb-3">
            FPL TOURNAMENTS
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black tracking-tight leading-[1.06] text-white">
            Tournaments <br />
            <span className="text-[#00FF87]">for every manager</span>
          </h1>

          {/* Description */}
          <p className="mt-4 text-sm sm:text-base text-gray-200/90 font-normal leading-relaxed max-w-md sm:max-w-lg">
            Join exciting FPL tournaments, compete with other managers and win amazing rewards.
          </p>
        </div>
      </Container>
    </section>
  );
}
