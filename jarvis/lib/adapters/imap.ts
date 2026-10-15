import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { EmailMessage } from "./types";

export interface ImapOptions {
  user: string;
  pass: string;
  query?: string;
  targetDate?: string;
  limit?: number;
}

export async function searchRealGmailImap(options: ImapOptions): Promise<{
  matches: EmailMessage[];
  found: boolean;
  message: string;
}> {
  const cleanPass = options.pass.replace(/\s+/g, "");
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: options.user.trim(),
      pass: cleanPass,
    },
    logger: false,
    tls: {
      rejectUnauthorized: true,
    },
  });

  await client.connect();

  const results: EmailMessage[] = [];

  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const maxResults = options.limit || 12;
      const totalMessages = client.mailbox && typeof client.mailbox === "object" && "exists" in client.mailbox
        ? (client.mailbox.exists as number)
        : 0;

      if (totalMessages === 0) {
        return {
          matches: [],
          found: false,
          message: "Inbox is empty.",
        };
      }

      // Fetch the last N messages by sequence range
      const startSeq = Math.max(1, totalMessages - maxResults + 1);
      const range = `${startSeq}:${totalMessages}`;

      const fetchedMessages: any[] = [];
      for await (const message of client.fetch(range, {
        envelope: true,
        internalDate: true,
        source: { maxLength: 40960 }, // Limit to 40KB per message for instant response
      })) {
        fetchedMessages.push(message);
      }

      // Process newest first
      fetchedMessages.reverse();

      for (const msg of fetchedMessages) {
        try {
          const env = msg.envelope;
          const subject = env?.subject || "(No Subject)";
          const senderName = env?.from?.[0]?.name || env?.from?.[0]?.address || "Unknown Sender";
          const senderEmail = env?.from?.[0]?.address || "unknown@gmail.com";

          let dateStr = "Recent";
          if (env?.date) {
            dateStr = new Date(env.date).toISOString().split("T")[0];
          } else if (msg.internalDate) {
            dateStr = new Date(msg.internalDate).toISOString().split("T")[0];
          }

          let body = "";
          let snippet = "";

          if (msg.source) {
            try {
              const parsed = await simpleParser(msg.source);
              body = parsed.text || (parsed.html ? parsed.html.replace(/<[^>]+>/g, " ") : "");
              snippet = (body || "").slice(0, 160).replace(/\s+/g, " ").trim();
            } catch {
              body = subject;
              snippet = subject;
            }
          } else {
            body = subject;
            snippet = subject;
          }

          const lowerText = (subject + " " + body).toLowerCase();

          // Query filter
          if (options.query) {
            const q = options.query.toLowerCase().trim();
            if (q && !lowerText.includes(q)) {
              continue;
            }
          }

          // Target date filter
          if (options.targetDate) {
            const target = options.targetDate.trim();
            const dateMatch = dateStr.includes(target) || lowerText.includes(target.toLowerCase());
            if (!dateMatch) {
              const dObj = new Date(options.targetDate);
              if (!isNaN(dObj.getTime())) {
                const isoDate = dObj.toISOString().split("T")[0];
                if (dateStr !== isoDate) {
                  continue;
                }
              }
            }
          }

          const hasDeadline =
            lowerText.includes("interview") ||
            lowerText.includes("deadline") ||
            lowerText.includes("assessment") ||
            lowerText.includes("offer") ||
            lowerText.includes("scheduled") ||
            lowerText.includes("test") ||
            lowerText.includes("meeting");

          let category: EmailMessage["category"] = "followup";
          if (lowerText.includes("interview")) category = "interview";
          else if (lowerText.includes("assessment") || lowerText.includes("hackerrank") || lowerText.includes("test")) category = "assessment";
          else if (lowerText.includes("offer")) category = "offer";

          results.push({
            id: String(msg.uid || msg.seq),
            sender: senderName,
            senderEmail,
            subject,
            date: dateStr,
            snippet: snippet || subject,
            body: (body || snippet || subject).slice(0, 3000),
            hasDeadline,
            deadlineDate: options.targetDate || (hasDeadline ? dateStr : undefined),
            category,
          });
        } catch (itemErr) {
          console.warn("Failed to parse message:", itemErr);
        }
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }

  return {
    matches: results,
    found: results.length > 0,
    message: `Fetched ${results.length} real email(s) directly from your Gmail inbox!`,
  };
}
