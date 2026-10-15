import { NextRequest, NextResponse } from "next/server";
import { searchMockEmails } from "@/lib/adapters/mock";
import { getCalendarEvents } from "@/lib/adapters/calendar";

// Fast local answers computed from the real adapters (no external calls).
async function localAnswer(question: string): Promise<string | null> {
  const q = question.toLowerCase();

  if (/(hello|hi|hey|jarvis|you there)/.test(q) && q.length < 25) {
    return "Hello. JARVIS online. Ask me to find a deadline, check your inbox, or schedule something.";
  }

  if (/(what|list|show|read|check|my|any)?.*(deadline|due|assessment|challenge|offer)/.test(q)) {
    const { matches } = searchMockEmails("");
    const withDeadlines = matches.filter((m) => m.hasDeadline);
    if (withDeadlines.length === 0) {
      return "I don't see any deadlines in your inbox right now.";
    }
    const top = withDeadlines.slice(0, 3).map((m) => `${m.deadlineDate} ${m.subject}`.slice(0, 80));
    return `I found ${withDeadlines.length} deadline${withDeadlines.length === 1 ? "" : "s"}. ${top.join("; ")}.`;
  }

  if (/(interview|screen|call)/.test(q)) {
    const { matches } = searchMockEmails("interview");
    if (matches.length === 0) return "No interviews found in your inbox.";
    const titles = matches.slice(0, 3).map((m) => `${m.sender} on ${m.deadlineDate}`);
    return `You have ${matches.length} interview email${matches.length === 1 ? "" : "s"}: ${titles.join("; ")}.`;
  }

  if (/(calendar|schedule|event|book|synced)/.test(q)) {
    const events = getCalendarEvents();
    if (events.length === 0) return "Your calendar is currently clear.";
    const next = events.slice(0, 3).map((e) => `${e.title} on ${new Date(e.startTime).toLocaleDateString()}`);
    return `You have ${events.length} event${events.length === 1 ? "" : "s"} on the calendar: ${next.join("; ")}.`;
  }

  if (/(status|progress|doing|going|ready|online)/.test(q)) {
    const events = getCalendarEvents();
    return `All systems nominal. Gmail and Calendar are connected, with ${events.length} events tracked. Ready for your next goal.`;
  }

  if (/(thank|thanks|cheers)/.test(q)) {
    return "Anytime. I am always listening.";
  }

  return null;
}

// Optional LLM path when a provider key is configured.
async function llmAnswer(question: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are JARVIS, an autonomous deadline-wrangling assistant for university students. Answer in under 2 short sentences. Be confident and direct.",
          },
          { role: "user", content: question },
        ],
        max_tokens: 120,
        temperature: 0.4,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  let question = "";
  try {
    const body = await req.json();
    question = String(body.question || body.goal || "").trim();
  } catch {
    /* ignore */
  }

  if (!question) {
    return NextResponse.json({ error: "Missing question" }, { status: 400 });
  }

  const local = await localAnswer(question);
  if (local) {
    return NextResponse.json({ reply: local, source: "local" });
  }

  const llm = await llmAnswer(question);
  if (llm) {
    return NextResponse.json({ reply: llm, source: "llm" });
  }

  return NextResponse.json({
    reply: `I heard "${question}", but I'm not sure how to answer that yet. Try asking about your deadlines, interviews, or calendar.`,
    source: "fallback",
  });
}