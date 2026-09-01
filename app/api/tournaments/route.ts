import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      where: {
        status: { in: ["PUBLISHED", "FINISHED"] },
      },
      include: {
        groups: {
          select: {
            id: true,
            name: true,
            fplLeagueId: true,
          },
        },
        rounds: {
          include: {
            matches: {
              select: {
                id: true,
                matchNumber: true,
                status: true,
                homeScore: true,
                awayScore: true,
                result: true,
                winnerId: true,
              },
            },
          },
          orderBy: { roundNumber: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tournaments });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch tournaments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
