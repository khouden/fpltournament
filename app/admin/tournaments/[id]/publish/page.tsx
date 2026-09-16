import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { validateScheduleAction } from "@/lib/schedule-actions";
import { TournamentPublishWizard } from "@/components/tournament-publish-wizard";

export default async function PublishTournamentPage(
  props: PageProps<"/admin/tournaments/[id]/publish">
) {
  const { id } = await props.params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      admins: {
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      },
      groups: {
        include: { members: true },
        orderBy: { createdAt: "asc" },
      },
      rounds: {
        include: {
          matches: {
            include: {
              homeGroup: true,
              awayGroup: true,
            },
            orderBy: { matchNumber: "asc" },
          },
        },
        orderBy: { roundNumber: "asc" },
      },
    },
  });

  if (!tournament) {
    notFound();
  }

  const validationResult = await validateScheduleAction(tournament.id, tournament);

  return (
    <div className="max-w-5xl mx-auto">
      <TournamentPublishWizard
        tournament={{
          id: tournament.id,
          name: tournament.name,
          season: tournament.season,
          banner: tournament.banner,
          status: tournament.status as "DRAFT" | "PUBLISHED" | "FINISHED",
          allowBenchBoost: tournament.allowBenchBoost,
          allowTripleCaptain: tournament.allowTripleCaptain,
          adminFplId: Number(tournament.adminFplId),
          admins: tournament.admins.map((a) => ({
            fplId: a.fplId,
            name: a.name,
            teamName: a.teamName,
            isPrimary: a.isPrimary,
          })),
          groups: tournament.groups.map((g) => ({
            id: g.id,
            name: g.name,
            logo: g.logo,
            members: g.members.map((m) => ({
              id: m.id,
              fplId: m.fplId,
              name: m.fplName,
              isAdmin: m.isAdmin,
            })),
          })),
          rounds: tournament.rounds.map((r) => ({
            id: r.id,
            roundNumber: r.roundNumber,
            name: r.name,
            gameweek: r.gameweek,
            matches: r.matches.map((m) => ({
              id: m.id,
              matchNumber: m.matchNumber,
              homeGroup: m.homeGroup
                ? { name: m.homeGroup.name, logo: m.homeGroup.logo }
                : null,
              awayGroup: m.awayGroup
                ? { name: m.awayGroup.name, logo: m.awayGroup.logo }
                : null,
            })),
          })),
        }}
        initialValidation={{
          isValid: validationResult.isValid,
          issues: validationResult.issues,
        }}
      />
    </div>
  );
}
