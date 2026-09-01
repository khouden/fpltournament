import { updateMatchAction, deleteMatchAction } from "@/lib/schedule-actions";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await request.json();

    const match = await prisma.match.findUnique({
      where: { id },
      include: { round: true },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const result = await updateMatchAction(id, match.round.tournamentId, {
      homeGroupId: body.homeGroupId,
      awayGroupId: body.awayGroupId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ match: result.match });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update match";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const match = await prisma.match.findUnique({
      where: { id },
      include: { round: true },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const result = await deleteMatchAction(id, match.round.tournamentId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete match";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
