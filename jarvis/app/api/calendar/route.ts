import { NextRequest, NextResponse } from "next/server";
import {
  getCalendarEvents,
  createCalendarEvent,
  checkCalendarSlot,
  deleteCalendarEvent,
} from "@/lib/adapters/calendar";

export async function GET(req: NextRequest) {
  const events = getCalendarEvents();
  const checkStart = req.nextUrl.searchParams.get("checkStart");
  const checkEnd = req.nextUrl.searchParams.get("checkEnd");
  const excludeId = req.nextUrl.searchParams.get("excludeId");

  let slotStatus = null;
  if (checkStart && checkEnd) {
    slotStatus = checkCalendarSlot(checkStart, checkEnd, excludeId || undefined);
  }

  return NextResponse.json({
    events,
    total: events.length,
    slotStatus,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, date, time, startTime, endTime, description, location } = body;

    if (!title) {
      return NextResponse.json({ error: "Event title is required" }, { status: 400 });
    }

    // Determine ISO startTime
    let finalStart = startTime;
    if (!finalStart && date) {
      const timeStr = time || "10:00";
      // Construct date string
      const fullDateStr = `${date}T${timeStr}:00`;
      const parsed = new Date(fullDateStr);
      finalStart = isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
    } else if (!finalStart) {
      finalStart = new Date().toISOString();
    }

    const result = createCalendarEvent({
      title,
      startTime: finalStart,
      endTime,
      description,
      location,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create event" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing event id" }, { status: 400 });
  }
  const deleted = deleteCalendarEvent(id);
  return NextResponse.json({ success: deleted });
}
