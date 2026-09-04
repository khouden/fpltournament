import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Trophy, ArrowRight, Users, ShieldCheck, Sparkles } from "lucide-react";
import { Header } from "@/components/navigation/header";
import { FantasyHero } from "@/components/fantasy/fantasy-hero";
import { TournamentCard } from "@/components/football/tournament-card";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackgroundNumber } from "@/components/decorative/background-number";

export const metadata: Metadata = {
  title: "FPL Tournaments — Custom Fantasy Premier League Knockout Tournaments",
  description:
    "Follow custom knockout tournaments between FPL Classic Leagues with automatic score calculation and admin exclusion.",
};

export default async function Home() {
  const tournaments = await prisma.tournament.findMany({
    where: {
      status: { in: ["PUBLISHED", "FINISHED"] },
    },
    include: {
      groups: true,
      rounds: {
        include: { matches: true },
        orderBy: { roundNumber: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const active = tournaments.filter((t) => t.status === "PUBLISHED");
  const finished = tournaments.filter((t) => t.status === "FINISHED");

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F7] text-[#1F1F1F]">
      {/* Sticky Global Header */}
      <Header />

      <main className="flex-1">
        {/* Fantasy Hero Section */}
        <FantasyHero
          gradient="fantasyPrimary"
          badge={
            <div className="inline-flex items-center gap-2 rounded-[8px] border border-[#37003C]/20 bg-[#37003C]/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-[#37003C]">
              <Trophy className="h-3.5 w-3.5 text-[#37003C]" />
              <span>FPL TOURNAMENT ENGINE</span>
            </div>
          }
          headline="Custom Knockout Tournaments for FPL Leagues"
          subheadline="Automated Gameweek score calculations, strict Admin points exclusion, and live knockout progression tracking."
          actions={
            <Button
              size="lg"
              asChild
              className="bg-[#37003C] text-white hover:bg-[#5A0A63] font-black tracking-tight rounded-[10px] px-8 py-6 text-base shadow-fpl-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
            >
              <Link href="/tournaments">
                <span>Browse Tournaments</span>
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          }
          visual={
            <div className="relative flex items-center justify-center w-full max-w-lg">
              {/* Overlay Background Bracket & Badges Graphic */}
              <div
                aria-hidden="true"
                className="absolute -inset-4 sm:-inset-8 opacity-75 pointer-events-none select-none"
              >
                <Image
                  src="/images/heroes/hero-graphic.svg"
                  alt=""
                  width={520}
                  height={520}
                  priority
                  className="h-full w-full object-contain"
                />
              </div>

              {/* Dynamic Player Action Cutout */}
              <div className="relative z-10 h-72 sm:h-96 lg:h-[460px] w-72 sm:w-96 lg:w-[460px]">
                <Image
                  src="/images/heroes/hero-player.png"
                  alt="Premier League Player Celebrating"
                  fill
                  priority
                  className="object-contain object-bottom drop-shadow-[0_25px_40px_rgba(55,0,60,0.3)] transition-transform duration-300 hover:scale-105"
                />
              </div>
            </div>
          }
        />

        {/* Active Tournaments Section */}
        <Section className="bg-[#F7F7F7] py-12 sm:py-16">
          <Container>
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#008744] mb-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#00FF87] animate-fpl-pulse-dot" />
                  <span>LIVE COMPETITIONS</span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#37003C]">
                  Active Tournaments
                </h2>
                <p className="mt-1 text-sm sm:text-base text-[#777777]">
                  Follow ongoing competitions and live head-to-head knockout progression.
                </p>
              </div>

              {active.length > 0 && (
                <Badge
                  variant="outline"
                  className="self-start sm:self-auto border-[#00FF87]/40 bg-[#00FF87]/15 text-[#007038] font-black px-3.5 py-1 text-xs uppercase tracking-wider shadow-xs"
                >
                  {active.length} Live
                </Badge>
              )}
            </div>

            {/* Tournaments Grid or Empty State */}
            {active.length === 0 ? (
              <div className="rounded-[16px] border border-[#E5E5E5] bg-white p-10 sm:p-14 text-center shadow-fpl-sm max-w-lg mx-auto">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#37003C]/10 text-[#37003C] mb-4">
                  <Trophy className="h-7 w-7 text-[#37003C]" />
                </div>
                <h3 className="text-xl font-extrabold text-[#37003C]">
                  No active tournaments
                </h3>
                <p className="mt-2 text-sm text-[#777777] max-w-sm mx-auto leading-relaxed">
                  There are no published tournaments available at the moment. Check back soon for upcoming tournaments and fixtures.
                </p>
                <div className="mt-6">
                  <Button asChild variant="outline" size="sm" className="font-bold">
                    <Link href="/tournaments">Browse Tournaments</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {active.map((t) => (
                  <TournamentCard key={t.id} tournament={t} />
                ))}
              </div>
            )}
          </Container>
        </Section>

        {/* Completed Tournaments Section (Conditional) */}
        {finished.length > 0 && (
          <Section className="bg-[#F7F7F7] pt-2 pb-14 sm:pb-20 border-t border-[#EAEAEA]">
            <Container>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-[#777777] mb-1">
                    ARCHIVE &amp; RESULTS
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#37003C]">
                    Completed Tournaments
                  </h2>
                  <p className="mt-1 text-sm text-[#777777]">
                    Historical tournament brackets, final match results, and champions.
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className="self-start sm:self-auto border-[#E5E5E5] bg-[#F4F4F5] text-[#555555] font-extrabold px-3 py-1 text-xs uppercase tracking-wider"
                >
                  {finished.length} Completed
                </Badge>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {finished.map((t) => (
                  <TournamentCard key={t.id} tournament={t} />
                ))}
              </div>
            </Container>
          </Section>
        )}

        {/* How It Works / Scoring Rules Section */}
        <section
          id="scoring-rules"
          className="py-16 sm:py-20 lg:py-24 bg-white border-y border-[#E5E5E5] relative overflow-hidden"
        >
          {/* Subtle decorative background glow */}
          <div
            aria-hidden="true"
            className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-[#00FF87]/5 blur-3xl pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-[#E9007F]/5 blur-3xl pointer-events-none"
          />

          <Container className="relative z-10">
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <div className="text-xs font-black uppercase tracking-wider text-[#E9007F] mb-2">
                TOURNAMENT RULES &amp; SCORING
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#37003C] uppercase">
                How It Works
              </h2>
              <p className="mt-3 text-base sm:text-lg text-[#555555] font-medium leading-relaxed">
                Simple rules. Automated scoring. Competitive progression.
              </p>
            </div>

            {/* 3 Rule Cards with oversized numbers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {/* Card 01: Group Score */}
              <div className="relative overflow-hidden rounded-[14px] border border-[#E5E5E5] bg-[#FAFAFA] p-7 sm:p-8 transition-all duration-200 hover:shadow-fpl-md hover:-translate-y-1 hover:border-[#37003C]/30 hover:bg-white group">
                <BackgroundNumber
                  number="01"
                  position="top-right"
                  opacity={0.06}
                  className="text-[#37003C] font-black group-hover:opacity-10 transition-opacity"
                />

                <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#00D9FF]/20 text-[#006880] mb-5">
                  <Users className="h-6 w-6" />
                </div>

                <div className="text-xs font-black uppercase tracking-wider text-[#00D9FF] mb-1">
                  RULE 01
                </div>

                <h3 className="text-xl font-black text-[#37003C] tracking-tight mb-2.5">
                  Group Score
                </h3>

                <p className="text-sm text-[#555555] leading-relaxed">
                  Each group represents an FPL Classic League, and the group score is based on the combined Gameweek points of its members.
                </p>
              </div>

              {/* Card 02: Admin Exclusion */}
              <div className="relative overflow-hidden rounded-[14px] border border-[#E5E5E5] bg-[#FAFAFA] p-7 sm:p-8 transition-all duration-200 hover:shadow-fpl-md hover:-translate-y-1 hover:border-[#37003C]/30 hover:bg-white group">
                <BackgroundNumber
                  number="02"
                  position="top-right"
                  opacity={0.06}
                  className="text-[#37003C] font-black group-hover:opacity-10 transition-opacity"
                />

                <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#00FF87]/25 text-[#007038] mb-5">
                  <ShieldCheck className="h-6 w-6" />
                </div>

                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-black uppercase tracking-wider text-[#008744]">
                    RULE 02
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#00FF87]/15 text-[#007038] px-2 py-0.5 rounded-full">
                    FAIR PLAY GUARANTEE
                  </span>
                </div>

                <h3 className="text-xl font-black text-[#37003C] tracking-tight mb-2.5">
                  Admin Exclusion
                </h3>

                <p className="text-sm text-[#555555] leading-relaxed">
                  The organizer participates in every league to manage the competition, but their points are strictly excluded from scoring.
                </p>
              </div>

              {/* Card 03: Chips & Progression */}
              <div className="relative overflow-hidden rounded-[14px] border border-[#E5E5E5] bg-[#FAFAFA] p-7 sm:p-8 transition-all duration-200 hover:shadow-fpl-md hover:-translate-y-1 hover:border-[#37003C]/30 hover:bg-white group">
                <BackgroundNumber
                  number="03"
                  position="top-right"
                  opacity={0.06}
                  className="text-[#37003C] font-black group-hover:opacity-10 transition-opacity"
                />

                <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#E7FF00]/30 text-[#37003C] mb-5">
                  <Sparkles className="h-6 w-6" />
                </div>

                <div className="text-xs font-black uppercase tracking-wider text-[#37003C] mb-1">
                  RULE 03
                </div>

                <h3 className="text-xl font-black text-[#37003C] tracking-tight mb-2.5">
                  Chips &amp; Progression
                </h3>

                <p className="text-sm text-[#555555] leading-relaxed">
                  Bench Boost and Triple Captain rules are configurable, while head-to-head results determine standings and progression.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 sm:py-20 bg-gradient-to-br from-[#37003C] via-[#240027] to-[#1a001c] text-white relative overflow-hidden">
          {/* Subtle fantasy background glows */}
          <div
            aria-hidden="true"
            className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[#00FF87]/15 blur-3xl pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[#00D9FF]/15 blur-3xl pointer-events-none"
          />

          <Container className="relative z-10 text-center max-w-3xl">
            <Badge
              variant="outline"
              className="mb-4 border-[#00FF87]/30 bg-[#00FF87]/10 text-[#00FF87] font-black uppercase tracking-wider text-xs px-3.5 py-1"
            >
              READY TO COMPETE
            </Badge>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase leading-[1.05]">
              Ready to Follow the Competition?
            </h2>

            <p className="mt-4 text-base sm:text-lg text-indigo-200/80 leading-relaxed max-w-xl mx-auto">
              Explore all active and completed FPL knockout tournaments, view fixtures, and track live gameweek progression.
            </p>

            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                asChild
                className="bg-[#00FF87] text-[#37003C] hover:bg-[#E7FF00] font-black tracking-tight rounded-[10px] px-8 py-6 text-base shadow-fpl-glow-green transition-all duration-200 hover:scale-105 cursor-pointer"
              >
                <Link href="/tournaments">
                  <span>Browse Tournaments</span>
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            </div>
          </Container>
        </section>
      </main>

      {/* Global FPL Footer */}
      <Footer />
    </div>
  );
}
