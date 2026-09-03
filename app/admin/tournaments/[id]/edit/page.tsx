import { prisma } from "@/lib/db";
import { TournamentForm } from "@/components/tournament-form";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Tournament</h1>
        <p className="mt-2 text-gray-600">Update tournament details and organizers</p>
      </div>

      <Card className="p-8 shadow-xs border-gray-200">
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
      </Card>
    </div>
  );
}
