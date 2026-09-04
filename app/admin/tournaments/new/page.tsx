import { TournamentForm } from "@/components/tournament-form";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function NewTournamentPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fpl-fade-in">
      <div className="flex flex-col gap-4">
        <Link 
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#555555] hover:text-[#37003C] transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
        
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="default" className="bg-[#37003C] hover:bg-[#37003C] uppercase tracking-wider text-[10px] font-extrabold px-2 py-0.5 shadow-none rounded-[6px]">
              New Tournament
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1F1F1F] tracking-tight flex items-center gap-2">
            Create Tournament
            <Trophy className="h-6 w-6 text-[#00FF87] drop-shadow-sm" />
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#666666]">
            Set up a new FPL competition, configure its scoring rules, and assign tournament administrators.
          </p>
        </div>
      </div>

      <TournamentForm />
    </div>
  );
}
