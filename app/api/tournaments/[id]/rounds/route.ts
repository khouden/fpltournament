import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament || tournament.status === "DRAFT") {
      return NextResponse.json(
        { error: "Tournament not found or not published" },
        { status: 404 }
      );
    }

    const rounds = await prisma.round.findMany({
      where: { tournamentId: id },
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
    });

    return NextResponse.json({ rounds });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch rounds";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
