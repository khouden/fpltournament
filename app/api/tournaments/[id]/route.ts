import { prisma } from "@/lib/db";
import { calculateLeagueStandings } from "@/lib/scoring";
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
        groups: {
          include: {
            members: {
              select: {
                id: true,
                fplName: true,
                fplTeamName: true,
                isAdmin: true,
              },
            },
          },
        },
        rounds: {
          include: {
            matches: {
              include: {
                homeGroup: { select: { id: true, name: true, logo: true } },
                awayGroup: { select: { id: true, name: true, logo: true } },
              },
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

    const standings = await calculateLeagueStandings(id);

    return NextResponse.json({ tournament, standings });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch tournament";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
