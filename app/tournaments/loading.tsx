import { Header } from "@/components/navigation/header";
import { Footer } from "@/components/layout/footer";
import { TournamentsCatalogSkeleton } from "@/components/tournaments/tournament-skeletons";

export default function TournamentsLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FB] text-[#1F1F1F]">
      <Header />
      <div className="flex-1">
        <TournamentsCatalogSkeleton />
      </div>
      <Footer />
    </div>
  );
}
