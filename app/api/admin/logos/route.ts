import { NextRequest, NextResponse } from "next/server";
import {
  getLeagues,
  searchTeamLogos,
  suggestLogoForTeamName,
  getAllTeamLogos,
} from "@/lib/team-logos";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || undefined;
    const league = searchParams.get("league") || undefined;
    const suggest = searchParams.get("suggest") || undefined;

    if (suggest) {
      const suggested = suggestLogoForTeamName(suggest);
      return NextResponse.json({ suggested });
    }

    const leagues = getLeagues();
    const logos = searchTeamLogos(query, league);

    return NextResponse.json({
      leagues,
      logos,
      total: logos.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch team logos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
