import { getManager } from "@/lib/fpl";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const entryId = request.nextUrl.searchParams.get("entryId");

  if (!entryId) {
    return NextResponse.json(
      { error: "Missing entryId parameter" },
      { status: 400 }
    );
  }

  try {
    const manager = await getManager(parseInt(entryId));

    return NextResponse.json({ manager });
  } catch (error) {
    console.error("FPL verification error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to verify entry",
      },
      { status: 500 }
    );
  }
}
