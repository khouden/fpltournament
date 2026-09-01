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
                homeGroup: { select: { id: true, name: true } },
                awayGroup: { select: { id: true, name: true } },
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

    return NextResponse.json({ tournament });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch tournament";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
