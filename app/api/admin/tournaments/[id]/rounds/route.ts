import { createRoundAction } from "@/lib/schedule-actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await request.json();

    if (!body.gameweek) {
      return NextResponse.json(
        { error: "Gameweek is required" },
        { status: 400 }
      );
    }

    const result = await createRoundAction(
      id,
      Number(body.gameweek),
      body.name,
      body.roundNumber ? Number(body.roundNumber) : undefined
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ round: result.round }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create round";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
