import { updateGroupAction, deleteGroupAction } from "@/lib/group-actions";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await request.json();

    const group = await prisma.group.findUnique({
      where: { id },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (body.name === undefined && body.logo === undefined) {
      return NextResponse.json(
        { error: "Group name or logo is required" },
        { status: 400 }
      );
    }

    const result = await updateGroupAction(id, group.tournamentId, {
      name: body.name,
      logo: body.logo,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ group: result.group });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update group";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const group = await prisma.group.findUnique({
      where: { id },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    let deleteSchedule = url.searchParams.get("deleteSchedule") === "true";
    try {
      const body = await request.json();
      if (body?.deleteSchedule) {
        deleteSchedule = true;
      }
    } catch {
      // Body is optional for DELETE requests
    }

    const result = await deleteGroupAction(id, group.tournamentId, {
      deleteSchedule,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          isScheduled: result.isScheduled,
          matchesCount: result.matchesCount,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      scheduleDeleted: result.scheduleDeleted,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete group";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

