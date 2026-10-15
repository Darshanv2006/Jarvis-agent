import { NextRequest, NextResponse } from "next/server";
import { searchRealGmail } from "@/lib/adapters/gmail";
import { searchRealGmailImap } from "@/lib/adapters/imap";
import { searchMockEmails } from "@/lib/adapters/mock";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const date = req.nextUrl.searchParams.get("date") || "";
  const mode = req.nextUrl.searchParams.get("mode") || process.env.DEMO_MODE || "mock";

  // Check 1: IMAP App Password (Fastest & direct)
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (gmailUser && gmailAppPassword && mode !== "mock") {
    try {
      const imapResult = await searchRealGmailImap({
        user: gmailUser,
        pass: gmailAppPassword,
        query: q,
        targetDate: date,
        limit: 15,
      });

      return NextResponse.json({
        ...imapResult,
        source: "real_gmail",
        account: gmailUser,
        method: "imap_ssl",
      });
    } catch (err: any) {
      console.warn("Real Gmail IMAP search failed, falling back to mock:", err.message);
      const mockResult = searchMockEmails(q, date);
      return NextResponse.json({
        ...mockResult,
        source: "mock_fallback",
        warning: `Could not fetch real Gmail via IMAP (${err.message}). Showing seeded recruiter emails. Check your Gmail App Password.`,
      });
    }
  }

  // Check 2: Google OAuth 2.0 Credentials
  const hasGoogleOAuth = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  );

  if ((mode === "real" || hasGoogleOAuth) && mode !== "mock") {
    try {
      const realResult = await searchRealGmail(q, date);
      return NextResponse.json({
        ...realResult,
        source: "real_gmail",
        method: "oauth2",
      });
    } catch (err: any) {
      console.warn("Real Gmail API search failed, falling back to mock:", err.message);
      const mockResult = searchMockEmails(q, date);
      return NextResponse.json({
        ...mockResult,
        source: "mock_fallback",
        warning: `Could not fetch real Gmail (${err.message}). Showing seeded recruiter emails.`,
      });
    }
  }

  // Default Mock Mode
  const mockResult = searchMockEmails(q, date);
  return NextResponse.json({
    ...mockResult,
    source: "mock",
  });
}
