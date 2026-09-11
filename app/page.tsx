import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight, Play } from "lucide-react";
import { Header } from "@/components/navigation/header";
import { Container } from "@/components/layout/container";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { StatsStrip } from "@/components/home/stats-strip";
import {
  FeaturedTournamentCard,
  type FeaturedTournamentItem,
} from "@/components/home/featured-tournament-card";
import { HowItWorks } from "@/components/home/how-it-works";
import { getTournamentBannerOrDefault, TOURNAMENT_BANNERS } from "@/lib/tournament-banners";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "FPL Tournaments — Compete. Strategize. Win.",
  description:
    "Join fantasy tournaments created by the community and prove your FPL skills with automated scoring and knockout progression.",
};

export default async function Home() {
  const [tournaments, totalMembersCount, completedMatchesCount] = await Promise.all([
    prisma.tournament.findMany({
      where: {
        status: { in: ["PUBLISHED", "FINISHED"] },
      },
      include: {
        groups: {
          include: {
            members: true,
          },
        },
        rounds: {
          include: { matches: true },
          orderBy: { roundNumber: "asc" },
        },
      },
      orderBy: [
        { status: "asc" }, // PUBLISHED before FINISHED alphabetically
        { createdAt: "desc" },
      ],
    }),
    prisma.groupMember.count(),
    prisma.match.count({
      where: {
        status: { in: ["COMPLETED", "FINALIZED"] },
      },
    }),
  ]);

  const activeTournaments = tournaments.filter((t) => t.status === "PUBLISHED");
  const finishedTournaments = tournaments.filter((t) => t.status === "FINISHED");

  const nonTestActive = activeTournaments.filter(
    (t) => !t.name.toLowerCase().startsWith("test")
  );
  const testActive = activeTournaments.filter((t) =>
    t.name.toLowerCase().startsWith("test")
  );

  const featuredCandidates = [
    ...nonTestActive,
    ...testActive,
    ...finishedTournaments,
  ];

  // Pick up to 3 featured tournaments with distinct banners for visual variety
  const featuredSelection: typeof tournaments = [];
  const usedBanners = new Set<string>();

  for (const t of featuredCandidates) {
    if (featuredSelection.length >= 3) break;
    const banner = getTournamentBannerOrDefault(t.banner, t.id);
    if (!usedBanners.has(banner)) {
      usedBanners.add(banner);
      featuredSelection.push(t);
    }
  }

  // Fill up to 3 if not enough unique banners
  for (const t of featuredCandidates) {
    if (featuredSelection.length >= 3) break;
    if (!featuredSelection.some((s) => s.id === t.id)) {
      featuredSelection.push(t);
    }
  }

  const activeCount = activeTournaments.length;
  const managersCount = totalMembersCount > 0 ? totalMembersCount.toLocaleString() : "0";
  const matchesCount = completedMatchesCount;

  // Crest types to cycle through for visual variety
  const crestCycle: ("cup" | "crown" | "shield")[] = ["cup", "crown", "shield"];

  // Map real database tournaments to FeaturedTournamentItems
  const dynamicFeatured: FeaturedTournamentItem[] = featuredSelection.map((t, idx) => {
    const totalMembers = t.groups.reduce((acc, g) => acc + g.members.length, 0);

    const gws = t.rounds
      .map((r) => r.gameweek)
      .filter((gw): gw is number => typeof gw === "number" && gw > 0);

    const gameweeksText =
      gws.length > 0
        ? gws.length === 1 || Math.min(...gws) === Math.max(...gws)
          ? `GW ${gws[0]}`
          : `GW ${Math.min(...gws)} - GW ${Math.max(...gws)}`
        : `${t.rounds.length} Rounds`;

    const hasLiveMatches = t.rounds.some((r) =>
      r.matches.some((m) => m.status === "IN_PROGRESS")
    );
    const hasCompletedMatches = t.rounds.some((r) =>
      r.matches.some((m) => m.status === "COMPLETED" || m.status === "FINALIZED")
    );

    let status: "LIVE" | "UPCOMING" | "COMPLETED" = "UPCOMING";
    if (t.status === "FINISHED") {
      status = "COMPLETED";
    } else if (hasLiveMatches || hasCompletedMatches) {
      status = "LIVE";
    } else {
      status = "UPCOMING";
    }

    const seasonFormatted = t.season
      ? `${t.season}/${String(t.season + 1).slice(-2)}`
      : "";

    const description =
      t.groups.length > 0
        ? `${t.groups.length} groups competing in custom knockout stages${seasonFormatted ? ` for ${seasonFormatted}` : ""}.`
        : "Custom fantasy tournament with automated scoring and knockout brackets.";

    const banner = getTournamentBannerOrDefault(t.banner, t.id);

    return {
      id: t.id,
      name: t.name,
      description,
      status,
      crestType: crestCycle[idx % crestCycle.length],
      banner,
      participants: totalMembers > 0 ? `${totalMembers} Managers` : `${t.groups.length} Groups`,
      gameweeks: gameweeksText,
      prizePool: "Trophy & Glory",
      prizeLabel: "Tournament prize",
      href: `/tournaments/${t.id}`,
      buttonVariant: idx === 1 ? "outline" : "dark",
    };
  });

  // Fallback defaults with preset default banners if no tournaments exist in the database yet
  const showcaseDefaults: FeaturedTournamentItem[] = [
    {
      id: "fpl-champions-cup",
      name: "FPL Champions Cup",
      description: "The ultimate tournament for elite managers. Are you ready?",
      status: "LIVE",
      crestType: "cup",
      banner: TOURNAMENT_BANNERS[0].path,
      participants: "256 / 512",
      gameweeks: "GW 5 - GW 38",
      prizePool: "$500",
      href: "/tournaments",
      buttonVariant: "dark",
    },
    {
      id: "weekend-rivals",
      name: "Weekend Rivals",
      description: "Short format. High intensity. Only the best survive.",
      status: "UPCOMING",
      crestType: "crown",
      banner: TOURNAMENT_BANNERS[1].path,
      participants: "128 / 256",
      gameweeks: "GW 8 - GW 12",
      prizePool: "$250",
      href: "/tournaments",
      buttonVariant: "outline",
    },
    {
      id: "elite-managers-league",
      name: "Elite Managers League",
      description: "For true FPL strategists. Prove your skills against the best.",
      status: "LIVE",
      crestType: "shield",
      banner: TOURNAMENT_BANNERS[3].path,
      participants: "320 / 1024",
      gameweeks: "GW 4 - GW 38",
      prizePool: "$1,000",
      href: "/tournaments",
      buttonVariant: "dark",
    },
  ];

  const featuredList = dynamicFeatured.length > 0 ? dynamicFeatured : showcaseDefaults;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FD] text-[#0B081E]">
      {/* Sticky Global Cosmic Header */}
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-[#0B081E] text-white pt-10 sm:pt-14 pb-20 sm:pb-28 lg:pt-18 lg:pb-36 border-b border-white/[0.06]">
          {/* Hero Background Images: Desktop vs Mobile/Tablet */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            {/* Desktop Hero Background: Keep current hero.png on large screens (lg+) */}
            <Image
              src="/images/heroes/hero.png"
              alt="FPL Tournaments Hero Background"
              fill
              priority
              className="hidden lg:block object-cover object-center"
              quality={95}
            />

            {/* Small and Medium Screens Hero Background (< lg) */}
            <Image
              src="/images/heroes/hero-mobile-clean.jpg"
              alt="FPL Tournaments Hero Background"
              fill
              priority
              className="block lg:hidden object-cover object-center"
              quality={90}
            />

            {/* Subtle bottom gradient to blend seamlessly into the floating stats strip */}
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0B081E] via-[#0B081E]/60 to-transparent" />
          </div>

          <Container className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
              {/* Left Column: Headline & CTAs */}
              <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                {/* Kicker tag */}
                <div className="inline-flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-[0.16em] text-[#00FFA3]">
                    FPL TOURNAMENTS
                  </span>
                </div>

                {/* Hero Headline */}
                <h1 className="text-4xl sm:text-6xl lg:text-[70px] font-black tracking-tight text-white leading-[1.02]">
                  Compete.
                  <br />
                  Strategize. <span className="text-[#00FFA3]">Win.</span>
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-[#A69DC6] max-w-lg leading-relaxed font-medium mx-auto lg:mx-0">
                  Join fantasy tournaments created by the community and prove your FPL skills.
                </p>

                {/* CTAs */}
                <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                  <Button
                    asChild
                    variant="neon"
                    size="pill-lg"
                    className="shadow-[0_0_24px_rgba(0,255,163,0.45)] hover:scale-105 cursor-pointer text-sm sm:text-base"
                  >
                    <Link href="/tournaments">
                      <span>Explore tournaments</span>
                      <ArrowRight className="h-4 w-4 ml-1 stroke-[2.5]" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="glass"
                    size="pill-lg"
                    className="border border-white/20 hover:border-white/40 cursor-pointer text-sm sm:text-base"
                  >
                    <Link href="#how-it-works">
                      <span>How it works</span>
                      <Play className="h-3.5 w-3.5 ml-1.5 fill-white text-white" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Floating Stats Bar bridging Hero & Content */}
        <div className="-mt-9 sm:-mt-11 relative z-30">
          <StatsStrip
            activeTournaments={activeCount}
            managersCount={managersCount}
            matchesPlayed={matchesCount}
          />
        </div>

        {/* Featured Tournaments Section */}
        <section className="py-20 lg:py-28 bg-[#F8F9FD]">
          <Container>
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div className="max-w-2xl">
                <span className="text-xs font-black uppercase tracking-wider text-[#059669]">
                  FEATURED TOURNAMENTS
                </span>
                <h2 className="mt-2 text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-[#0B081E] leading-[1.1]">
                  Top tournaments for your FPL journey
                </h2>
                <p className="mt-2.5 text-sm sm:text-base text-[#64748B]">
                  Take part in exciting tournaments, compete with other managers and win amazing rewards.
                </p>
              </div>

              <Link
                href="/tournaments"
                className="group inline-flex items-center gap-1.5 text-sm font-black text-[#059669] hover:text-[#047857] transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
              >
                <span>View all tournaments</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Featured Tournaments Grid */}
            <div
              className={cn(
                "grid gap-6 lg:gap-8",
                featuredList.length === 1
                  ? "grid-cols-1 max-w-md mx-auto"
                  : featuredList.length === 2
                  ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto"
                  : "grid-cols-1 md:grid-cols-3"
              )}
            >
              {featuredList.map((item) => (
                <FeaturedTournamentCard key={item.id} item={item} />
              ))}
            </div>
          </Container>
        </section>

        {/* How It Works Section */}
        <HowItWorks />
      </main>

      {/* Global Cosmic Footer */}
      <Footer />
    </div>
  );
}
