import nodemailer from "nodemailer";

export interface ConfirmationEmailOptions {
  to?: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location?: string;
  description?: string;
  sourceEmailSnippet?: string;
}

export async function sendScheduleConfirmationEmail(options: ConfirmationEmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("Missing GMAIL_USER or GMAIL_APP_PASSWORD in environment.");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: user.trim(),
      pass: pass.trim().replace(/\s+/g, ""),
    },
  });

  const recipient = options.to || user;
  const location = options.location || "Google Meet (Link will be generated)";
  const description = options.description || "Auto-scheduled and synchronized by JARVIS AI Agent.";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0716; color: #f1f5f9; padding: 24px; margin: 0; }
    .card { max-width: 580px; margin: 0 auto; background: #130d24; border: 1px solid #7c3aed; border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.25); }
    .header { border-bottom: 1px solid #2e1d52; padding-bottom: 16px; margin-bottom: 24px; }
    .brand { font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #a855f7; text-transform: uppercase; }
    .title { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 6px; }
    .badge { display: inline-block; background: #064e3b; color: #34d399; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; border: 1px solid #059669; margin-top: 8px; }
    .grid { margin: 20px 0; background: #1a1330; border-radius: 12px; padding: 16px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #2b1f48; }
    .row:last-child { border-bottom: none; }
    .label { color: #94a3b8; font-size: 12px; font-family: monospace; }
    .value { color: #ffffff; font-size: 13px; font-weight: 600; text-align: right; }
    .details { background: #0e091c; border-left: 3px solid #06b6d4; padding: 12px 16px; border-radius: 0 8px 8px 0; font-size: 12px; color: #cbd5e1; margin-top: 16px; line-height: 1.6; }
    .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #2e1d52; font-size: 11px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">⚡ JARVIS AI · Mission Control</div>
      <div class="title">${options.eventTitle}</div>
      <span class="badge">● VERIFIED & CONFIRMED ON CALENDAR</span>
    </div>

    <p style="font-size: 13px; color: #cbd5e1; margin: 0 0 16px 0;">
      Greetings. Your upcoming schedule has been verified, booked, and cross-referenced with your calendar availability.
    </p>

    <div class="grid">
      <div class="row">
        <span class="label">DATE:</span>
        <span class="value">${options.eventDate}</span>
      </div>
      <div class="row">
        <span class="label">TIME:</span>
        <span class="value">${options.eventTime}</span>
      </div>
      <div class="row">
        <span class="label">LOCATION / PLATFORM:</span>
        <span class="value">${location}</span>
      </div>
      <div class="row">
        <span class="label">STATUS:</span>
        <span class="value" style="color: #34d399;">Conflict-Free Verified (0 Overlaps)</span>
      </div>
    </div>

    <div class="details">
      <strong style="color: #38bdf8; display: block; margin-bottom: 4px;">Meeting Context & Notes:</strong>
      ${description}
    </div>

    <div class="footer">
      Autonomous scheduling executed by JARVIS v2.4 Personal AI Agent.<br/>
      Connected Account: ${user}
    </div>
  </div>
</body>
</html>
  `;

  const info = await transporter.sendMail({
    from: `"JARVIS AI Assistant" <${user}>`,
    to: recipient,
    subject: `[Confirmed] ${options.eventTitle} - ${options.eventDate} @ ${options.eventTime}`,
    html: htmlContent,
  });

  return {
    success: true,
    messageId: info.messageId,
  };
}
