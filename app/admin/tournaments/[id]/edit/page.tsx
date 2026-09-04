import { prisma } from "@/lib/db";
import { TournamentForm } from "@/components/tournament-form";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function EditTournamentPage(
  props: PageProps<"/admin/tournaments/[id]/edit">
) {
  const { id } = await props.params;

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
      <div className="flex flex-col gap-4">
        <Link 
          href={`/admin/tournaments/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#555555] hover:text-[#37003C] transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Tournament</span>
        </Link>
        
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="text-[#37003C] border-[#37003C] uppercase tracking-wider text-[10px] font-extrabold px-2 py-0.5 shadow-none rounded-[6px]">
              Settings
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1F1F1F] tracking-tight flex items-center gap-2">
            Edit Tournament
            <Settings className="h-6 w-6 text-[#555555] drop-shadow-sm" />
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#666666]">
            Update tournament details, scoring rules, and organizers.
          </p>
        </div>
      </div>

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
