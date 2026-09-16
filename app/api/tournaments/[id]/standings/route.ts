import { prisma } from "@/lib/db";
import { computeStandingsFromData } from "@/lib/scoring";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        groups: true,
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

    if (!tournament || tournament.status === "DRAFT") {
      return NextResponse.json(
        { error: "Tournament not found or not published" },
        { status: 404 }
      );
    }

    const standings = computeStandingsFromData(tournament.groups, tournament.rounds);

    return NextResponse.json({ standings });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to calculate standings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
