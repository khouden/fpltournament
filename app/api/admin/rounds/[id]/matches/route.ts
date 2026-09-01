import { createMatchAction } from "@/lib/schedule-actions";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await request.json();

    const round = await prisma.round.findUnique({
      where: { id },
    });

    if (!round) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 });
    }

    const result = await createMatchAction(id, round.tournamentId, {
      homeGroupId: body.homeGroupId,
      awayGroupId: body.awayGroupId,
      homeWinnerOfMatchId: body.homeWinnerOfMatchId,
      awayWinnerOfMatchId: body.awayWinnerOfMatchId,
      matchNumber: body.matchNumber ? Number(body.matchNumber) : undefined,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ match: result.match }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create match";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
