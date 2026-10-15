import { NextRequest, NextResponse } from "next/server";
import { getGoogleOAuthClient } from "@/lib/adapters/gmail";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/?auth=error&msg=" + encodeURIComponent(error || "No code received"), req.url));
  }

  try {
    const oauth2Client = getGoogleOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    if (tokens.refresh_token) {
      // Append or update GOOGLE_REFRESH_TOKEN in .env.local
      const envPath = path.join(process.cwd(), ".env.local");
      let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";

      if (content.includes("GOOGLE_REFRESH_TOKEN=")) {
        content = content.replace(/GOOGLE_REFRESH_TOKEN=.*/, `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
      } else {
        content += `\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`;
      }

      fs.writeFileSync(envPath, content, "utf-8");
      process.env.GOOGLE_REFRESH_TOKEN = tokens.refresh_token;
    }

    const response = NextResponse.redirect(new URL("/?auth=success", req.url));
    if (tokens.access_token) {
      response.cookies.set("google_access_token", tokens.access_token, { maxAge: 3600, httpOnly: true });
    }
    return response;
  } catch (err: any) {
    console.error("Failed to exchange Google OAuth code:", err);
    return NextResponse.redirect(new URL("/?auth=error&msg=" + encodeURIComponent(err.message || "Failed to exchange code"), req.url));
  }
}
