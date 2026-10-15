import { NextRequest, NextResponse } from "next/server";
import { sendScheduleConfirmationEmail } from "@/lib/adapters/mailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, eventTitle, eventDate, eventTime, location, description } = body;

    if (!eventTitle) {
      return NextResponse.json({ error: "Missing eventTitle" }, { status: 400 });
    }

    const result = await sendScheduleConfirmationEmail({
      to,
      eventTitle,
      eventDate: eventDate || new Date().toISOString().split("T")[0],
      eventTime: eventTime || "14:00",
      location,
      description,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Failed to send schedule confirmation email:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to dispatch email." },
      { status: 500 }
    );
  }
}
