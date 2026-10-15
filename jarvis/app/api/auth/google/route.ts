import { NextRequest, NextResponse } from "next/server";
import { getGoogleOAuthClient } from "@/lib/adapters/gmail";

export async function GET(req: NextRequest) {
  try {
    const oauth2Client = getGoogleOAuthClient();

    const scopes = [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/calendar.events",
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
    });

    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Google OAuth credentials not configured",
        details: err.message || "Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local",
      },
      { status: 400 }
    );
  }
}
