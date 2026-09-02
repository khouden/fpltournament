import { importLeagueAsGroupAction } from "@/lib/group-actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await request.json();

    if (!body.leagueId) {
      return NextResponse.json(
        { error: "FPL league ID is required" },
        { status: 400 }
      );
    }

    const result = await importLeagueAsGroupAction(
      id,
      Number(body.leagueId),
      body.name || body.customName,
      body.logo
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ group: result.group }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to import group";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
