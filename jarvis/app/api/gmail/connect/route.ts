import { NextRequest, NextResponse } from "next/server";
import { searchRealGmailImap } from "@/lib/adapters/imap";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, email, appPassword, clientId, clientSecret } = body;

    const envPath = path.join(process.cwd(), ".env.local");
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";

    if (type === "app_password") {
      if (!email || !appPassword) {
        return NextResponse.json(
          { success: false, error: "Both Gmail address and 16-character App Password are required." },
          { status: 400 }
        );
      }

      // Test IMAP connection immediately
      try {
        const testResult = await searchRealGmailImap({
          user: email.trim(),
          pass: appPassword.trim(),
          limit: 10,
        });

        // Connection was successful! Save to .env.local
        const updateEnvVar = (key: string, val: string) => {
          const regex = new RegExp(`^${key}=.*$`, "m");
          if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${key}=${val}`);
          } else {
            envContent += `\n${key}=${val}`;
          }
        };

        updateEnvVar("GMAIL_USER", email.trim());
        updateEnvVar("GMAIL_APP_PASSWORD", appPassword.trim().replace(/\s+/g, ""));
        updateEnvVar("DEMO_MODE", "real");

        fs.writeFileSync(envPath, envContent.trim() + "\n", "utf-8");
        process.env.GMAIL_USER = email.trim();
        process.env.GMAIL_APP_PASSWORD = appPassword.trim().replace(/\s+/g, "");
        process.env.DEMO_MODE = "real";

        return NextResponse.json({
          success: true,
          message: `Connected successfully! Found ${testResult.matches.length} real email(s).`,
          account: email.trim(),
          matches: testResult.matches,
        });
      } catch (imapErr: any) {
        return NextResponse.json(
          {
            success: false,
            error: `Connection to Gmail failed: ${imapErr.message}. Make sure 2-Step Verification is enabled on your Google account and you generated a 16-character App Password from myaccount.google.com/apppasswords.`,
          },
          { status: 400 }
        );
      }
    } else if (type === "oauth_config") {
      if (!clientId || !clientSecret) {
        return NextResponse.json(
          { success: false, error: "Both Client ID and Client Secret are required." },
          { status: 400 }
        );
      }

      const updateEnvVar = (key: string, val: string) => {
        const regex = new RegExp(`^${key}=.*$`, "m");
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, `${key}=${val}`);
        } else {
          envContent += `\n${key}=${val}`;
        }
      };

      updateEnvVar("GOOGLE_CLIENT_ID", clientId.trim());
      updateEnvVar("GOOGLE_CLIENT_SECRET", clientSecret.trim());
      updateEnvVar("DEMO_MODE", "real");

      fs.writeFileSync(envPath, envContent.trim() + "\n", "utf-8");
      process.env.GOOGLE_CLIENT_ID = clientId.trim();
      process.env.GOOGLE_CLIENT_SECRET = clientSecret.trim();
      process.env.DEMO_MODE = "real";

      return NextResponse.json({
        success: true,
        message: "Google OAuth credentials saved. Click 'Sign In With Google' to authorize.",
        authUrl: "/api/auth/google",
      });
    }

    return NextResponse.json({ success: false, error: "Invalid connection type." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process connection request." },
      { status: 500 }
    );
  }
}

export async function GET() {
  const isImapConfigured = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
  const isOAuthConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  );

  return NextResponse.json({
    connected: isImapConfigured || isOAuthConfigured,
    account: process.env.GMAIL_USER || (isOAuthConfigured ? "Google OAuth Account" : null),
    method: isImapConfigured ? "IMAP (App Password)" : isOAuthConfigured ? "Google OAuth" : "none",
  });
}
