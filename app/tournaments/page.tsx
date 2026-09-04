import { prisma } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { Header } from "@/components/navigation/header";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { TournamentCard } from "@/components/football/tournament-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Tournaments — FPL Tournament",
  description:
    "Browse published fantasy football tournaments, view scores and match results.",
};

export default async function TournamentsPage() {
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
      {/* Sticky Global FPL Header */}
      <Header />

      <main className="flex-1 pb-16 sm:pb-24">
        {/* Page Intro Header */}
        <section className="relative overflow-hidden bg-white border-b border-[#EAEAEA] py-10 sm:py-14">
          {/* Subtle decorative background glows */}
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#00FF87]/10 blur-3xl pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-[#37003C]/5 blur-3xl pointer-events-none"
          />

          {/* Subtle background typography watermark */}
          <div
            aria-hidden="true"
            className="absolute right-6 -bottom-4 select-none pointer-events-none text-7xl sm:text-8xl lg:text-9xl font-black text-[#37003C]/[0.025] tracking-tighter uppercase leading-none hidden sm:block"
          >
            TOURNAMENTS
          </div>

          <Container className="relative z-10">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 rounded-[8px] border border-[#37003C]/15 bg-[#37003C]/5 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#37003C] mb-3">
              <Trophy className="h-3.5 w-3.5 text-[#37003C]" />
              <span>COMPETITION DIRECTORY</span>
            </div>

            {/* Title & Description */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#37003C] uppercase leading-[1.05]">
              Tournaments
            </h1>
            <p className="mt-2.5 text-base sm:text-lg text-[#555555] font-medium leading-relaxed max-w-[650px]">
              Browse active and completed FPL competitions.
            </p>

            {/* Stat Summary Strip (Derived strictly from existing data) */}
            {tournaments.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-[10px] border border-[#E5E5E5] bg-[#F9F9F9] px-3.5 py-1.5 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#777777]">
                    ACTIVE
                  </span>
                  <span className="text-xs font-black text-[#008744] bg-[#00FF87]/20 px-2 py-0.5 rounded-md">
                    {active.length}
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 rounded-[10px] border border-[#E5E5E5] bg-[#F9F9F9] px-3.5 py-1.5 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#777777]">
                    COMPLETED
                  </span>
                  <span className="text-xs font-black text-[#555555] bg-[#EBEBEB] px-2 py-0.5 rounded-md">
                    {finished.length}
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 rounded-[10px] border border-[#E5E5E5] bg-[#F9F9F9] px-3.5 py-1.5 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#777777]">
                    TOURNAMENTS
                  </span>
                  <span className="text-xs font-black text-[#37003C] bg-[#37003C]/10 px-2 py-0.5 rounded-md">
                    {tournaments.length}
                  </span>
                </div>
              </div>
            )}
          </Container>
        </section>

        {/* Catalog Body Container */}
        <Container className="pt-10 sm:pt-14">
          {/* Zero Tournaments Empty State (When zero published & zero completed) */}
          {tournaments.length === 0 && (
            <div className="rounded-[16px] border border-[#E5E5E5] bg-white p-10 sm:p-14 text-center shadow-fpl-sm max-w-lg mx-auto mt-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#37003C]/10 text-[#37003C] mb-4">
                <Trophy className="h-7 w-7 text-[#37003C]" />
              </div>
              <h2 className="text-xl font-black text-[#37003C] uppercase tracking-tight">
                No Tournaments Yet
              </h2>
              <p className="mt-2 text-sm text-[#777777] max-w-sm mx-auto leading-relaxed">
                There are no published tournaments available at the moment. Check back later for upcoming competitions.
              </p>
              <div className="mt-6">
                <Button asChild variant="primary" size="default" className="font-extrabold">
                  <Link href="/">Return to Home</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Active Tournaments Section (Rendered whenever tournaments exist) */}
          {tournaments.length > 0 && (
            <section aria-labelledby="active-tournaments-heading">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#008744] mb-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#00FF87] animate-fpl-pulse-dot" />
                    <span>ACTIVE</span>
                  </div>
                  <h2
                    id="active-tournaments-heading"
                    className="text-2xl sm:text-3xl font-black tracking-tight text-[#37003C]"
                  >
                    Active Tournaments
                  </h2>
                  <p className="mt-1 text-sm sm:text-base text-[#777777]">
                    Follow ongoing competitions and their current progress.
                  </p>
                </div>

                {active.length > 0 && (
                  <Badge
                    variant="outline"
                    className="self-start sm:self-auto border-[#00FF87]/40 bg-[#00FF87]/15 text-[#007038] font-black px-3.5 py-1 text-xs uppercase tracking-wider shadow-xs"
                  >
                    {active.length} In Progress
                  </Badge>
                )}
              </div>

              {/* Decorative fantasy gradient accent line */}
              <div
                aria-hidden="true"
                className="mb-8 h-1 w-20 rounded-full bg-gradient-to-r from-[#00D9FF] via-[#00FF87] to-[#E7FF00]"
              />

              {/* Active Tournament Grid or Empty State when finished exist but no active */}
              {active.length === 0 ? (
                <div className="rounded-[14px] border border-[#E5E5E5] bg-white p-8 text-center shadow-fpl-sm max-w-lg mx-auto">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#37003C]/10 text-[#37003C] mb-3">
                    <Trophy className="h-6 w-6 text-[#37003C]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#37003C]">
                    No active tournaments right now
                  </h3>
                  <p className="mt-1 text-sm text-[#777777] max-w-sm mx-auto">
                    Check back soon for the next competition.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {active.map((t) => (
                    <TournamentCard
                      key={t.id}
                      tournament={t}
                      variant="active"
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Completed Tournaments Section (Conditional: Only when finished.length > 0) */}
          {finished.length > 0 && (
            <section
              aria-labelledby="completed-tournaments-heading"
              className="mt-16 sm:mt-24 pt-12 sm:pt-16 border-t border-[#EAEAEA]"
            >
              {/* Completed Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-[#777777] mb-1">
                    COMPLETED
                  </div>
                  <h2
                    id="completed-tournaments-heading"
                    className="text-2xl sm:text-3xl font-black tracking-tight text-[#555555]"
                  >
                    Completed Tournaments
                  </h2>
                  <p className="mt-1 text-sm sm:text-base text-[#777777]">
                    Browse previous competitions and their results.
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className="self-start sm:self-auto border-[#E5E5E5] bg-[#F4F4F5] text-[#555555] font-extrabold px-3 py-1 text-xs uppercase tracking-wider"
                >
                  {finished.length} Completed
                </Badge>
              </div>

              {/* Completed Tournaments Grid */}
              <div className="grid gap-6 sm:grid-cols-2">
                {finished.map((t) => (
                  <TournamentCard
                    key={t.id}
                    tournament={t}
                    variant="completed"
                  />
                ))}
              </div>
            </section>
          )}
        </Container>
      </main>

      {/* Global FPL Footer */}
      <Footer />
    </div>
  );
}
