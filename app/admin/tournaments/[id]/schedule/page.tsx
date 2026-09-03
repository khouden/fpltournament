import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ScheduleBuilder } from "@/components/schedule-builder";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default async function SchedulePage(
  props: PageProps<"/admin/tournaments/[id]/schedule">
) {
  const { id } = await props.params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      groups: {
        orderBy: { name: "asc" },
      },
      rounds: {
        include: {
          matches: {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/admin" className="hover:text-indigo-600 transition">
              Dashboard
            </Link>
            <span>/</span>
            <Link
              href={`/admin/tournaments/${id}/groups`}
              className="hover:text-indigo-600 transition"
            >
              {tournament.name}
            </Link>
            <span>/</span>
            <span className="font-medium text-gray-700">Schedule</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            Tournament Schedule
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href={`/admin/tournaments/${id}/groups`}>
              <ArrowLeft className="h-4 w-4" />
              <span>Groups</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Tournament Info */}
      <Card className="p-4 shadow-xs border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm text-gray-600 font-medium">
              Season {tournament.season} · {tournament.groups.length} groups ·{" "}
              {tournament.rounds.reduce((acc, r) => acc + r.matches.length, 0)}{" "}
              matches
            </p>
          </div>
          <Badge
            variant={
              tournament.status === "PUBLISHED"
                ? "success"
                : tournament.status === "DRAFT"
                  ? "warning"
                  : "secondary"
            }
          >
            {tournament.status}
          </Badge>
        </div>
      </Card>

      {/* Groups Warning */}
      {tournament.groups.length < 2 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            You need at least 2 groups to create matches.{" "}
            <Link
              href={`/admin/tournaments/${id}/groups`}
              className="font-semibold underline hover:text-amber-900"
            >
              Import groups first
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}

      {/* Schedule Builder */}
      <Card className="p-6 shadow-xs border-gray-200">
        <ScheduleBuilder
          tournamentId={tournament.id}
          initialRounds={tournament.rounds}
          groups={tournament.groups.map((g) => ({ id: g.id, name: g.name }))}
        />
      </Card>
    </div>
  );
}
