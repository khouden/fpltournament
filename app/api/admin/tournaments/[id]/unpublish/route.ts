import { unpublishTournamentAction } from "@/lib/tournament-actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const result = await unpublishTournamentAction(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ tournament: result.tournament });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to unpublish tournament";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
