import { getManager } from "@/lib/fpl";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ entryId: string }> }
) {
  try {
    const { entryId } = await props.params;
    const manager = await getManager(Number(entryId));
    return NextResponse.json({ manager });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve manager";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
