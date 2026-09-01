import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        round: {
          include: {
            tournament: true,
          },
        },
        homeGroup: {
          include: { members: true },
        },
        awayGroup: {
          include: { members: true },
        },
        scores: {
          include: { member: true },
        },
      },
    });

    if (!match || match.round.tournament.status === "DRAFT") {
      return NextResponse.json(
        { error: "Match not found or tournament not published" },
        { status: 404 }
      );
    }

    return NextResponse.json({ match });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch match";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
