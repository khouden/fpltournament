import { getManagerGameweekSquad } from "@/lib/fpl";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ entryId: string }> }
) {
  try {
    const { entryId } = await props.params;
    const entryIdNum = Number(entryId);
    if (!entryIdNum || isNaN(entryIdNum)) {
      return NextResponse.json(
        { error: "Invalid manager entry ID" },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const gwParam = searchParams.get("gameweek") || searchParams.get("gw") || "1";
    const gameweek = parseInt(gwParam, 10) || 1;

    const allowBenchBoost = searchParams.get("allowBenchBoost") !== "false";
    const allowTripleCaptain = searchParams.get("allowTripleCaptain") !== "false";

    const squad = await getManagerGameweekSquad(entryIdNum, gameweek, {
      allowBenchBoost,
      allowTripleCaptain,
    });

    return NextResponse.json({ squad });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve fantasy squad";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
