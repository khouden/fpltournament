import { finalizeMatchAction } from "@/lib/scoring-actions";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
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

    const result = await finalizeMatchAction(id, match.round.tournamentId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to finalize match";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
