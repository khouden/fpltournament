import { prisma } from "@/lib/db";
import { TournamentForm } from "@/components/tournament-form";
import { notFound } from "next/navigation";

export default async function EditTournamentPage(
  props: PageProps<"/admin/tournaments/[id]/edit">
) {
  const { id } = await props.params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
  });

  if (!tournament) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Tournament</h1>
        <p className="mt-2 text-gray-600">Update tournament details</p>
      </div>

      <div className="rounded-lg bg-white p-8 shadow">
        <TournamentForm
          initialData={{
            id: tournament.id,
            name: tournament.name,
            season: tournament.season,
            adminFplId: Number(tournament.adminFplId),
            allowChips: tournament.allowChips,
          }}
        />
      </div>
    </div>
  );
}
