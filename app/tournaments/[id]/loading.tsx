import { Header } from "@/components/navigation/header";
import { Footer } from "@/components/layout/footer";
import { TournamentDetailSkeleton } from "@/components/tournaments/tournament-skeletons";

export default function TournamentDetailLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#1F1F1F]">
      <Header />
      <div className="flex-1">
        <TournamentDetailSkeleton />
      </div>
      <Footer />
    </div>
  );
}
