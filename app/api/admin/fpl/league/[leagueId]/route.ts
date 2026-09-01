import { getLeague, getLeagueMembers } from "@/lib/fpl";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ leagueId: string }> }
) {
  try {
    const { leagueId } = await props.params;
    const { league, standings } = await getLeague(Number(leagueId));
    return NextResponse.json({ league, members: standings });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve league";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
