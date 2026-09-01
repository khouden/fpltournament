import { getManagerLeagues } from "@/lib/fpl";
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
    const leagues = await getManagerLeagues(parseInt(entryId));

    return NextResponse.json({ leagues });
  } catch (error) {
    console.error("Get leagues error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get leagues",
      },
      { status: 500 }
    );
  }
}
