import { checkFPLDeadlineStatus } from "@/lib/fpl";
import { setSimulatedDeadline } from "@/lib/fpl-deadline";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const status = checkFPLDeadlineStatus();
  return NextResponse.json(status);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const shouldSimulate =
      body.simulate !== undefined ? Boolean(body.simulate) : true;
    const reason = body.reason || "Simulated FPL Gameweek deadline active for testing";

    setSimulatedDeadline(shouldSimulate, reason);
    const updatedStatus = checkFPLDeadlineStatus();

    return NextResponse.json({
      success: true,
      message: shouldSimulate
        ? "Simulated FPL Gameweek deadline mode ENABLED"
        : "Simulated FPL Gameweek deadline mode DISABLED",
      status: updatedStatus,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to toggle deadline mode";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
