import { google } from "googleapis";
import { EmailMessage } from "./types";

export function getGoogleOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env.local");
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  if (refreshToken) {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
  }

  return oauth2Client;
}

export async function searchRealGmail(query: string, targetDate?: string): Promise<{
  matches: EmailMessage[];
  found: boolean;
  message: string;
}> {
  const auth = getGoogleOAuthClient();
  const gmail = google.gmail({ version: "v1", auth });

  // Build query string
  let q = query || "";
  if (targetDate) {
    // If target date provided (e.g. 2025-10-24)
    try {
      const d = new Date(targetDate);
      if (!isNaN(d.getTime())) {
        const afterDate = new Date(d);
        afterDate.setDate(d.getDate() - 1);
        const beforeDate = new Date(d);
        beforeDate.setDate(d.getDate() + 2);

        const afterStr = `${afterDate.getFullYear()}/${afterDate.getMonth() + 1}/${afterDate.getDate()}`;
        const beforeStr = `${beforeDate.getFullYear()}/${beforeDate.getMonth() + 1}/${beforeDate.getDate()}`;
        q = `${q} after:${afterStr} before:${beforeStr}`.trim();
      }
    } catch {
      q = `${q} ${targetDate}`.trim();
    }
  }

  // If no query at all, search for recent inbox emails
  if (!q) {
    q = "in:inbox";
  }

  const res = await gmail.users.messages.list({
    userId: "me",
    q,
    maxResults: 15,
  });

  const messages = res.data.messages || [];
  if (messages.length === 0) {
    return {
      matches: [],
      found: false,
      message: `No emails found for query '${q}'.`,
    };
  }

  const results: EmailMessage[] = [];

  for (const m of messages) {
    if (!m.id) continue;
    try {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: m.id,
        format: "full",
      });

      const headers = detail.data.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

      const subject = getHeader("subject") || "(No Subject)";
      const from = getHeader("from") || "(Unknown Sender)";
      const date = getHeader("date") || "";

      // Parse sender email
      const emailMatch = from.match(/<([^>]+)>/);
      const senderEmail = emailMatch ? emailMatch[1] : from;
      const senderName = from.replace(/<[^>]+>/, "").trim() || senderEmail;

      // Parse snippet & body
      const snippet = detail.data.snippet || "";
      let body = "";

      const getBodyFromParts = (parts: any[]): string => {
        for (const part of parts) {
          if (part.mimeType === "text/plain" && part.body?.data) {
            return Buffer.from(part.body.data, "base64").toString("utf-8");
          }
          if (part.parts) {
            const nested = getBodyFromParts(part.parts);
            if (nested) return nested;
          }
        }
        return "";
      };

      if (detail.data.payload?.parts) {
        body = getBodyFromParts(detail.data.payload.parts);
      } else if (detail.data.payload?.body?.data) {
        body = Buffer.from(detail.data.payload.body.data, "base64").toString("utf-8");
      }

      if (!body) body = snippet;

      // Check if deadline or interview is mentioned
      const lowerText = (subject + " " + body).toLowerCase();
      const hasDeadline =
        lowerText.includes("interview") ||
        lowerText.includes("deadline") ||
        lowerText.includes("assessment") ||
        lowerText.includes("offer") ||
        lowerText.includes("scheduled for") ||
        lowerText.includes("meeting");

      let category: EmailMessage["category"] = "followup";
      if (lowerText.includes("interview")) category = "interview";
      else if (lowerText.includes("assessment") || lowerText.includes("hackerrank")) category = "assessment";
      else if (lowerText.includes("offer")) category = "offer";

      results.push({
        id: m.id,
        sender: senderName,
        senderEmail,
        subject,
        date: date ? new Date(date).toLocaleDateString() : targetDate || "Recent",
        snippet,
        body,
        hasDeadline,
        deadlineDate: targetDate || undefined,
        category,
      });
    } catch (err) {
      console.warn(`Failed to parse email ${m.id}:`, err);
    }
  }

  return {
    matches: results,
    found: results.length > 0,
    message: `Found ${results.length} real email(s) from your Gmail inbox.`,
  };
}
