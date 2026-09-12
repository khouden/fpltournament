import { prisma } from "@/lib/db";
import { TournamentForm } from "@/components/tournament-form";
import { TournamentWizardStepper } from "@/components/tournament-wizard-stepper";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function EditTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      admins: {
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!tournament) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fpl-fade-in">
      {/* 1. Compact Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
        <Link
          href="/admin"
          className="font-semibold text-gray-600 hover:text-[#37003C] transition-colors"
        >
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
        <Link
          href={`/admin/tournaments/${id}`}
          className="font-semibold text-gray-600 hover:text-[#37003C] transition-colors truncate max-w-[180px] sm:max-w-md"
          title={tournament.name}
        >
          {tournament.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
        <span className="font-bold text-[#1F1F1F]">
          Edit Details
        </span>
      </nav>

      {/* 2. Page Header Block */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#37003C] bg-[#37003C]/10 px-2.5 py-0.5 rounded-full border border-[#37003C]/20">
            EDITING TOURNAMENT
          </span>
          <span className="text-xs text-gray-400 font-medium truncate max-w-[200px] sm:max-w-none">
            {tournament.name}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1F1F1F] tracking-tight flex items-center gap-2.5">
          <span>Edit Tournament Settings</span>
          <Settings className="h-7 w-7 text-[#37003C]" />
        </h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Update tournament title, season, stadium banner, scoring chip rules, and assign co-administrators.
        </p>
      </div>

      {/* 4-Step Creation/Setup Wizard Navigation */}
      <TournamentWizardStepper
        currentStep={1}
        tournamentId={tournament.id}
        tournamentStatus={tournament.status as "DRAFT" | "PUBLISHED" | "FINISHED"}
      />

      {/* 3. Pre-populated Editing Form */}
      <TournamentForm
        initialData={{
          id: tournament.id,
          name: tournament.name,
          season: tournament.season,
          banner: tournament.banner,
          adminFplId: Number(tournament.adminFplId),
          allowBenchBoost: tournament.allowBenchBoost,
          allowTripleCaptain: tournament.allowTripleCaptain,
          admins: tournament.admins.map((a) => ({
            fplId: a.fplId,
            name: a.name,
            teamName: a.teamName,
            isPrimary: a.isPrimary,
          })),
        }}
      />
    </div>
  );
}

