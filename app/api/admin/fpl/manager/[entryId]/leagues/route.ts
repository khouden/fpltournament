import { getManagerLeagues } from "@/lib/fpl";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ entryId: string }> }
) {
  try {
    const { entryId } = await props.params;
    const leagues = await getManagerLeagues(Number(entryId));
    return NextResponse.json({ leagues });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve leagues";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
