import { prisma } from "@/lib/db";
import { TournamentForm } from "@/components/tournament-form";
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
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs sm:text-sm text-[#777777]">
        <Link
          href="/admin"
          className="font-medium text-[#666666] hover:text-[#37003C] transition-colors"
        >
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-[#AAAAAA] shrink-0" />
        <Link
          href={`/admin/tournaments/${id}`}
          className="font-medium text-[#666666] hover:text-[#37003C] transition-colors truncate max-w-[180px] sm:max-w-md"
          title={tournament.name}
        >
          {tournament.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-[#AAAAAA] shrink-0" />
        <span className="font-semibold text-[#1F1F1F]">
          Edit
        </span>
      </nav>

      {/* 2. Page Header Block */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-[#37003C] border-[#37003C]/30 bg-[#37003C]/5 uppercase tracking-wider text-[10px] font-extrabold px-2.5 py-0.5 rounded-[6px]"
          >
            EDITING TOURNAMENT
          </Badge>
          <span className="text-xs text-[#777777] font-medium truncate max-w-[200px] sm:max-w-none">
            {tournament.name}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1F1F1F] tracking-tight flex items-center gap-2.5">
          <span>Edit Tournament</span>
          <Settings className="h-6 w-6 text-[#555555]" />
        </h1>
        <p className="text-sm sm:text-base text-[#666666]">
          Update tournament details and organizers.
        </p>
      </div>

      {/* 3. Pre-populated Editing Form */}
      <TournamentForm
        initialData={{
          id: tournament.id,
          name: tournament.name,
          season: tournament.season,
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

