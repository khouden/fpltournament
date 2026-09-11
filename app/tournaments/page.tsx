import type { Metadata } from "next";
import { Header } from "@/components/navigation/header";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { TournamentsHero } from "@/components/tournaments/tournaments-hero";
import { TournamentsCatalogClient } from "@/components/tournaments/tournaments-catalog-client";
import { getTournamentsPageData } from "@/lib/tournaments-data";

export const metadata: Metadata = {
  title: "Tournaments for every manager — FPL Tournaments",
  description:
    "Join exciting FPL tournaments, compete with other managers and win amazing rewards.",
};

export const revalidate = 0; // Ensure live fresh tournament standings

export default async function TournamentsPage() {
  const { active, completed } = await getTournamentsPageData();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FB] text-[#1F1F1F]">
      {/* Current Navbar preserved as requested */}
      <Header />

      <main className="flex-1">
        {/* Cinematic Hero Section with trophy artwork background */}
        <TournamentsHero />

        {/* Interactive Tournaments Catalog */}
        <Container>
          <TournamentsCatalogClient
            activeTournaments={active}
            completedTournaments={completed}
          />
        </Container>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
