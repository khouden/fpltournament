import * as React from "react";
import { Search, Users, Trophy, ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    step: 1,
    title: "Choose a tournament",
    description: "Browse available tournaments and pick the one that fits your style.",
    icon: Search,
  },
  {
    step: 2,
    title: "Compete each gameweek",
    description: "Make your transfers, set your lineup and earn points like in the real FPL.",
    icon: Users,
  },
  {
    step: 3,
    title: "Climb the leaderboard",
    description: "Grow your points, beat your opponents and win amazing rewards.",
    icon: Trophy,
  },
];

export function HowItWorks({ className }: { className?: string }) {
  return (
    <section id="how-it-works" className={cn("py-20 lg:py-28 bg-white", className)}>
      <Container>
        {/* Section Header */}
        <div className="max-w-2xl">
          <span className="text-xs font-black uppercase tracking-wider text-[#059669]">
            HOW IT WORKS
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl lg:text-[44px] font-black tracking-tight text-[#0B081E] leading-[1.1]">
            Simple steps to join the action
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#64748B]">
            Get started in minutes and be part of the next tournament.
          </p>
        </div>

        {/* 3 Horizontal Steps Grid with Connecting Arrows */}
        <div className="mt-14 sm:mt-18 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative items-start">
          {STEPS.map((item, idx) => {
            const Icon = item.icon;
            const isLast = idx === STEPS.length - 1;

            return (
              <div key={item.step} className="relative flex flex-col items-start pr-0 md:pr-6 group">
                {/* Icon Container with Floating Step Number Badge */}
                <div className="relative mb-6">
                  {/* Mint squircle container */}
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E6FBF2] text-[#059669] transition-all duration-300 group-hover:scale-105 group-hover:bg-[#D1FAE5] group-hover:shadow-[0_8px_20px_rgba(0,255,163,0.2)]">
                    <Icon className="h-7 w-7 stroke-[2.2]" />
                  </div>

                  {/* Step Number Black Pill/Circle */}
                  <div className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#0B081E] text-white text-xs font-black ring-2 ring-white">
                    {item.step}
                  </div>
                </div>

                {/* Text Content */}
                <h3 className="text-lg sm:text-xl font-black text-[#0B081E] tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm sm:text-[15px] text-[#64748B] leading-relaxed">
                  {item.description}
                </p>

                {/* Connecting arrow for desktop */}
                {!isLast && (
                  <div
                    aria-hidden="true"
                    className="hidden md:flex absolute top-8 -right-4 lg:-right-2 text-[#CBD5E1] transition-transform group-hover:translate-x-1"
                  >
                    <ArrowRight className="h-5 w-5 stroke-[2]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
