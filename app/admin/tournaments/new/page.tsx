import { TournamentForm } from "@/components/tournament-form";
import { TournamentWizardStepper } from "@/components/tournament-wizard-stepper";
import Link from "next/link";
import { ChevronRight, Trophy, Sparkles, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function NewTournamentPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fpl-fade-in">
      {/* 1. Breadcrumb & Navigation */}
      <div className="flex flex-col gap-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
          <Link
            href="/admin"
            className="font-semibold text-gray-600 hover:text-[#37003C] transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="font-bold text-[#1F1F1F]">
            New Tournament
          </span>
        </nav>

        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#008744] bg-[#00FF87]/15 px-2.5 py-0.5 rounded-full border border-[#00FF87]/30 shadow-2xs">
              <Sparkles className="h-3 w-3" />
              <span>Step 1 of 4: Setup Wizard</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1F1F1F] tracking-tight flex items-center gap-2.5">
            <span>Create Tournament</span>
            <Trophy className="h-7 w-7 text-[#00A855]" />
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-gray-500">
            Configure competition identity, select a stadium banner, set scoring chip rules, and verify FPL organizers.
          </p>
        </div>
      </div>

      {/* 4-Step Creation Wizard Navigation */}
      <TournamentWizardStepper currentStep={1} />

      {/* Form Card */}
      <TournamentForm />
    </div>
  );
}
