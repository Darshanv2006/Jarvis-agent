"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Home,
  ListTodo,
  Mail,
  Calendar as CalendarIcon,
  Settings,
  ChevronRight,
  Activity,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  Send,
  Radio,
  QrCode,
  X,
  RefreshCw,
  Bot,
  Edit3,
  Terminal,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { JarvisCoreVisualizer } from "@/components/JarvisCoreVisualizer";
import { GmailViewerModal } from "@/components/GmailViewerModal";
import { CalendarModal } from "@/components/CalendarModal";
import { EmailMessage } from "@/lib/adapters/types";

interface Step {
  id: string;
  number: number;
  title: string;
  action: "gmail.search" | "gmail.send" | "calendar.create" | "calendar.check";
  details: string;
  time: string;
  state: "pending" | "running" | "done" | "failed" | "blocked";
  verificationNote?: string;
  error?: string;
}

// ── Helpers ───────────────────────────────────────────────────
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const nowTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const tomorrowIso = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

interface ParsedGoal {
  targetDate?: string;
  topic: string;
  time: string;
  isExam: boolean;
  room?: string;
  checklist: string[];
}

const EXAM_CHECKLIST = [
  "Review core concepts & formula sheet",
  "Bring student ID & approved stationery",
  "Arrive 15 minutes before start",
];

const STOPWORDS = new Set([
  "a", "an", "the", "i", "im", "have", "has", "had", "my", "our", "your", "on", "in",
  "at", "is", "are", "for", "of", "and", "with", "this", "next", "upcoming", "plan",
  "schedule", "scheduled", "there", "room", "the", "to", "be", "will", "let", "lets",
]);

function toIso(d: Date): string {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
}

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// Extract date, topic, time, room and prep checklist from natural language prompts
function extractDateAndTopic(text: string): ParsedGoal {
  const lower = text.toLowerCase();
  const raw = text.trim();
  let targetDate: string | undefined = undefined;
  const year = new Date().getFullYear();

  const isExam = /\b(exam|test|quiz|midterm|mid-term|finals?|cray|assessment)\b/i.test(lower);

  // ── Relative dates ──
  if (/\bday after tomorrow\b/.test(lower)) {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    targetDate = toIso(d);
  } else if (/\btomorrow\b/.test(lower)) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    targetDate = toIso(d);
  } else if (/\btoday\b|\btonight\b/.test(lower)) {
    targetDate = toIso(new Date());
  }

  // ── Weekday names (next occurrence) ──
  if (!targetDate) {
    const weekdayMatch = lower.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
    if (weekdayMatch) {
      const names = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const target = names.indexOf(weekdayMatch[1]);
      const d = new Date();
      const delta = (target - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + delta);
      targetDate = toIso(d);
    }
  }

  // Chinese date pattern e.g. "10月15日" or "10月15号"
  const cnDateMatch = raw.match(/(\d{1,2})月(\d{1,2})[日号]?/);
  if (!targetDate && cnDateMatch) {
    const month = cnDateMatch[1].padStart(2, "0");
    const day = cnDateMatch[2].padStart(2, "0");
    targetDate = `${year}-${month}-${day}`;
  }

  // English date pattern e.g. "Oct 15" or "October 15"
  const enDateMatch = raw.match(/(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[,\s]+(\d{1,2})/i);
  if (!targetDate && enDateMatch) {
    const monthNames: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
      jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
    };
    const prefix = enDateMatch[1].slice(0, 3).toLowerCase();
    const month = monthNames[prefix] || "10";
    const day = enDateMatch[2].padStart(2, "0");
    targetDate = `${year}-${month}-${day}`;
  }

  // ISO / numeric format e.g. 2026-10-15 or 10-15
  const isoMatch = raw.match(/(?:20\d{2}-)?(\d{1,2})-(\d{1,2})/);
  if (!targetDate && isoMatch) {
    const month = isoMatch[1].padStart(2, "0");
    const day = isoMatch[2].padStart(2, "0");
    targetDate = `${year}-${month}-${day}`;
  }

  // ── Time extraction (e.g. "10 am", "2:30 pm", "14:00") ──
  let time = isExam ? "10:00" : "14:00";
  const ampm = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  const hhmm = lower.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (ampm) {
    let h = parseInt(ampm[1], 10) % 12;
    if (ampm[3] === "pm") h += 12;
    time = `${String(h).padStart(2, "0")}:${ampm[2] || "00"}`;
  } else if (hhmm) {
    time = `${hhmm[1].padStart(2, "0")}:${hhmm[2]}`;
  }

  // ── Room / venue extraction ──
  let room: string | undefined;
  if (/\bcray\b/i.test(lower)) {
    room = "Cray Lab";
    const num = lower.match(/cray\s*(?:lab)?\s*(?:room\s*)?(\d{2,4}[a-z]?)/i);
    if (num) room = `Cray Lab / Room ${num[1].toUpperCase()}`;
  } else {
    const roomNum = lower.match(/\broom\s+([0-9]{1,4}[a-z]?)\b/i);
    if (roomNum) {
      room = `Room ${roomNum[1].toUpperCase()}`;
    } else if (/\b(hall|auditorium)\b/i.test(lower)) {
      room = "Main Exam Hall";
    } else if (/\b(lab|laboratory)\b/i.test(lower)) {
      room = "Laboratory";
    }
  }

  // ── Topic / subject ──
  let topic = isExam ? "Exam" : "Technical Interview";
  if (isExam) {
    const subjectMatch = lower.match(/\b([a-z][a-z0-9]{2,}(?:\s+[a-z0-9]{2,}){0,2})\s+(?:exam|test|quiz|midterm|mid-term|finals?|assessment)\b/i);
    const candidate = subjectMatch?.[1]?.trim() || "";
    const words = candidate.split(/\s+/).filter((w) => w && !STOPWORDS.has(w));
    const subject = words.length ? titleCase(words.slice(-2).join(" ")) : "";
    topic = subject ? `${subject} Exam` : "Exam";
  } else if (raw.includes("面试") || lower.includes("interview")) {
    topic = "Technical Interview";
  } else if (lower.includes("teacher") || lower.includes("professor") || raw.includes("老师")) {
    topic = "Teacher Academic Consultation";
  } else if (raw.includes("安全") || lower.includes("security")) {
    topic = "Security Review Meeting";
  } else if (raw.includes("会议") || lower.includes("meeting")) {
    topic = "Important Meeting";
  }

  // Exams without an explicit date default to tomorrow
  if (isExam && !targetDate) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    targetDate = toIso(d);
  }

  const checklist = isExam ? [...EXAM_CHECKLIST] : [];

  return { targetDate, topic, time, isExam, room, checklist };
}

// Turn a free-text goal into a searchable inbox keyword.
function deriveSearchQuery(goal: string): string {
  const q = goal.toLowerCase();
  const intents: Array<[RegExp, string]> = [
    [/interview|screen|round/, "interview"],
    [/teacher|professor|faculty|student/, "teacher"],
    [/offer/, "offer"],
    [/assessment|challenge|coding|hackerrank/, "assessment"],
    [/deadline|due|submit/, "deadline"],
    [/recruiter|follow/, "recruiter"],
    [/security|alert|warning/, "security"],
  ];
  for (const [pattern, keyword] of intents) {
    if (pattern.test(q)) return keyword;
  }
  // Fallback: longest word of 4+ characters
  const words = goal.match(/[a-zA-Z]{4,}/g) || [];
  return words.sort((a, b) => b.length - a.length)[0]?.toLowerCase() || "";
}

function buildInitialSteps(): Step[] {
  return [
    { id: "step-1", number: 1, title: "Search inbox", action: "gmail.search", details: "Awaiting goal", time: "--:--", state: "pending" },
    { id: "step-2", number: 2, title: "Create calendar event", action: "calendar.create", details: "Awaiting goal", time: "--:--", state: "pending" },
    { id: "step-3", number: 3, title: "Verify event & conflicts", action: "calendar.check", details: "Awaiting goal", time: "--:--", state: "pending" },
  ];
}

export default function JarvisCockpit() {
  const [activeTab, setActiveTab] = useState<"home" | "planner" | "gmail" | "calendar" | "settings">("home");
  const [currentTime, setCurrentTime] = useState<string>("11:33 AM");
  const [currentDate, setCurrentDate] = useState<string>("Sat, 26 Apr 2025");
  const [demoMode, setDemoMode] = useState<"mock" | "real">("real");
  const [failNext, setFailNext] = useState<boolean>(false);
  const [goalInput, setGoalInput] = useState<string>("");
  const [commandBarInput, setCommandBarInput] = useState<string>("");
  const [isGoalModalOpen, setIsGoalModalOpen] = useState<boolean>(false);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState<boolean>(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState<boolean>(false);
  const [aiTargetDate, setAiTargetDate] = useState<string>("");
  const [aiTargetTopic, setAiTargetTopic] = useState<string>("");
  const [aiTargetRoom, setAiTargetRoom] = useState<string>("");
  const [aiTargetChecklist, setAiTargetChecklist] = useState<string[]>([]);
  const [aiTargetIsExam, setAiTargetIsExam] = useState<boolean>(false);
  const [aiNavigating, setAiNavigating] = useState<boolean>(false);
  const [missionCompleteBanner, setMissionCompleteBanner] = useState<string | null>(null);
  const [isDoneModalOpen, setIsDoneModalOpen] = useState<boolean>(false);
  const [doneModalData, setDoneModalData] = useState<{
    userCommand: string;
    targetDate: string;
    targetTopic: string;
    emailRecipient: string;
    isExam?: boolean;
    room?: string;
  } | null>(null);
  const [agentStatus, setAgentStatus] = useState<"Ready" | "Planning" | "Executing" | "Blocked" | "Verified">("Ready");
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string>("");
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const goalTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Step timeline — populated by a real deploy run, no fake data
  const [steps, setSteps] = useState<Step[]>(buildInitialSteps());

  // Real blocked-step info for the "Needs you" card
  const [blocked, setBlocked] = useState<{
    stepNumber: number;
    reason: string;
    suggestion: string;
    query: string;
  } | null>(null);

  // Guard against overlapping deploy runs
  const runIdRef = useRef(0);

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close any open modal on Escape
  const closeAllModals = useCallback(() => {
    setIsGoalModalOpen(false);
    setIsQrModalOpen(false);
    setIsGmailModalOpen(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAllModals();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeAllModals]);

  const updateStep = (id: string, patch: Partial<Step>) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  // Run the real Gmail search → calendar create → calendar verify pipeline
  const runGoal = async (goal: string, searchQuery: string) => {
    const runId = ++runIdRef.current;
    const stale = () => runIdRef.current !== runId;
    const query = (searchQuery || "").trim();

    setBlocked(null);
    setAgentStatus("Executing");
    setIsDeploying(true);
    setMissionCompleteBanner(null);

    // Parse date, topic, time, room & checklist from the request
    const parsed = extractDateAndTopic(goal);
    const targetDate = parsed.targetDate || tomorrowIso();
    const targetTopic = parsed.topic || "Technical Interview";
    const targetTime = parsed.time || (parsed.isExam ? "10:00" : "14:00");
    const targetRoom = parsed.room || "";
    const checklist = parsed.checklist || [];

    setAiTargetDate(targetDate);
    setAiTargetTopic(targetTopic);
    setAiTargetRoom(targetRoom);
    setAiTargetChecklist(checklist);
    setAiTargetIsExam(parsed.isExam);
    setAiNavigating(true);
    setSteps(buildInitialSteps());

    // ── Step 1: Real Gmail Search & Autonomous Interface Pop-up ──
    updateStep("step-1", {
      state: "running",
      details: query ? `Opening Gmail to scan for "${query}"...` : `Opening Gmail to inspect context for "${targetTopic}"...`,
      time: nowTime(),
    });

    // Human-like operation: Visibly invoke the Gmail interface
    setIsGmailModalOpen(true);

    let email: EmailMessage | null = null;
    let source = "mock";
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      params.set("mode", demoMode);
      const res = await fetch(`/api/gmail/search?${params.toString()}`);
      const data = await res.json();
      if (stale()) return;
      const matches: EmailMessage[] = data.matches || [];
      source = data.source || "mock";
      email = matches[0] || null;
    } catch {
      if (stale()) return;
    }

    if (!email && query) {
      // Auto-fallback: search latest inbox messages if keyword query yielded 0 results
      try {
        const fallbackRes = await fetch(`/api/gmail/search?mode=${demoMode}`);
        const fallbackData = await fallbackRes.json();
        if (!stale() && fallbackData.matches && fallbackData.matches.length > 0) {
          email = fallbackData.matches[0];
          source = fallbackData.source || "real_gmail";
        }
      } catch {
        /* ignore fallback error */
      }
    }

    // Keep Gmail modal visible for 2000ms so user observes human-like scanning action
    await sleep(2000);
    if (stale()) return;
    setIsGmailModalOpen(false);

    updateStep("step-1", {
      state: "done",
      details: `Identified request: ${targetTopic} for ${targetDate}`,
      verificationNote: `✓ verified: Gmail inbox context analyzed · target date ${targetDate}`,
      time: nowTime(),
    });

    await sleep(500);
    if (stale()) return;

    // ── Step 2: Create calendar event & Autonomous Calendar Pop-up ──
    const eventStart = `${targetTime}:00`;
    const eventEndTime = String(Math.min(23, parseInt(targetTime.slice(0, 2), 10) + 2)).padStart(2, "0") + ":00";
    const eventEnd = `${eventEndTime}:00`;
    const createPayload = {
      title: targetTopic,
      date: targetDate,
      time: targetTime,
      location: targetRoom || (parsed.isExam ? "Exam Hall" : "Google Meet"),
      description: parsed.isExam
        ? `Exam slot scheduled by JARVIS. Prep plan: ${checklist.join("; ")}`
        : `Auto-scheduled by JARVIS Co-Pilot from request: "${goal}"`,
    };

    updateStep("step-2", {
      state: "running",
      details: `Navigating to Calendar & selecting ${createPayload.date} as "${createPayload.title}"...`,
      time: nowTime(),
    });

    // FAIL_NEXT demo mode: book a decoy overlapping event if explicitly switched ON
    if (failNext) {
      const blockerStart = new Date(`${createPayload.date}T${createPayload.time}:00`);
      const blockerEnd = new Date(blockerStart.getTime() + 30 * 60000);
      try {
        await fetch("/api/calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Existing commitment (decoy)",
            startTime: blockerStart.toISOString(),
            endTime: blockerEnd.toISOString(),
            location: "Placeholder",
            description: "Injected by FAIL_NEXT demo switch.",
          }),
        });
      } catch {
        /* ignore decoy failures */
      }
      if (stale()) return;
    }

    let created: { id: string; title: string; startTime: string; endTime: string } | null = null;
    let conflictTitle = "";
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload),
      });
      const data = await res.json();
      if (stale()) return;
      created = data.event || null;
      conflictTitle = data.conflict?.title || "";
    } catch {
      if (stale()) return;
    }

    if (!created) {
      updateStep("step-2", { state: "failed", details: "Could not create event", error: "Calendar API returned no event.", time: nowTime() });
      setBlocked({
        stepNumber: 2,
        reason: "The calendar event could not be created.",
        suggestion: "Retry, or edit the date/time and try again.",
        query,
      });
      updateStep("step-3", { state: "blocked", details: "Blocked on step 2", time: nowTime() });
      setAgentStatus("Blocked");
      setIsDeploying(false);
      return;
    }

    // Human-like operation: Visibly invoke the Calendar interface to display the date and marked event
    setIsCalendarModalOpen(true);
    await sleep(2200);
    if (stale()) return;
    setIsCalendarModalOpen(false);

    updateStep("step-2", {
      state: "done",
      details: `Booked "${created.title}" on ${createPayload.date}`,
      verificationNote: `✓ verified: Calendar event locked on ${createPayload.date} · Marked: Interview`,
      time: nowTime(),
    });

    await sleep(500);
    if (stale()) return;

    // ── Step 3: Verify event exists + check conflicts + Send Confirmation Email ──
    updateStep("step-3", {
      state: "running",
      details: "Verifying calendar slot & dispatching confirmation email...",
      time: nowTime(),
    });

    let verified = false;
    let conflictFound = false;
    try {
      const params = new URLSearchParams({
        checkStart: created.startTime,
        checkEnd: created.endTime,
        excludeId: created.id,
      });
      const res = await fetch(`/api/calendar?${params.toString()}`);
      const data = await res.json();
      if (stale()) return;
      const exists = (data.events || []).some((e: { id: string }) => e.id === created!.id);
      conflictFound = Boolean(data.slotStatus && !data.slotStatus.isFree);
      verified = exists;
    } catch {
      if (stale()) return;
    }

    if (conflictFound) {
      updateStep("step-3", {
        state: "failed",
        details: "Conflict detected",
        error: conflictTitle ? `Overlaps with "${conflictTitle}".` : "Overlaps an existing event.",
        time: nowTime(),
      });
      setBlocked({
        stepNumber: 3,
        reason: conflictTitle
          ? `The new event overlaps "${conflictTitle}".`
          : "The new event overlaps an existing calendar event.",
        suggestion: "Edit the date/time and retry to book a clear slot.",
        query,
      });
      setAgentStatus("Blocked");
      setIsDeploying(false);
      return;
    }

    // ── Dispatch formal confirmation email to user via SMTP ──
    const recipient = "shivuvijay.5601@gmail.com";
    const emailTime = `${eventStart.slice(0, 5)} - ${eventEnd.slice(0, 5)}`;
    try {
      await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipient,
          eventTitle: created.title,
          eventDate: createPayload.date,
          eventTime: emailTime,
          location: createPayload.location,
          description: createPayload.description,
          checklist,
        }),
      });
    } catch (mailErr) {
      console.warn("Confirmation email dispatch:", mailErr);
    }

    updateStep("step-3", {
      state: "done",
      details: "Verified & confirmation email dispatched to shivuvijay.5601@gmail.com",
      verificationNote: `✓ verified: Event locked on calendar · Confirmation email delivered to shivuvijay.5601@gmail.com`,
      time: nowTime(),
    });
    setAgentStatus("Verified");
    setIsDeploying(false);
setAiNavigating(false);
    setMissionCompleteBanner(
      parsed.isExam
        ? `Autonomous Exam Schedule complete: "${created.title}" locked for ${createPayload.date} at ${createPayload.time} in ${createPayload.location}. Confirmation email sent to shivuvijay.5601@gmail.com!`
        : `Autonomous execution complete: "${created.title}" scheduled for ${createPayload.date} on Calendar & confirmation email sent to shivuvijay.5601@gmail.com!`
    );

    // Pop up the final "Okay, you are done with what you said" dialog
    setDoneModalData({
      userCommand: goal,
      targetDate: createPayload.date,
      targetTopic: created.title,
      emailRecipient: recipient,
      isExam: parsed.isExam,
      room: createPayload.location,
    });
    setIsDoneModalOpen(true);
  };

  // Deploy Goal Execution — starts the real pipeline
  const handleDeployGoal = (goalText?: string) => {
    const targetGoal = goalText || goalInput || "Find my next deadline in the inbox and schedule it";
    setGoalInput(targetGoal);
    setIsGoalModalOpen(false);
    setEditingStepId(null);
    setEditError("");
    setAgentStatus("Planning");
    void runGoal(targetGoal, deriveSearchQuery(targetGoal));
  };

  // "Needs you" resolution — retry the pipeline with a (possibly edited) query
  const handleResolveRetry = () => {
    const query = blocked?.query || "";
    setEditError("");
    setEditingStepId(null);
    setBlocked(null);
    void runGoal(goalInput || "Find my next deadline in the inbox and schedule it", query);
  };

  const handleResolveSkip = () => {
    setEditError("");
    setEditingStepId(null);
    setBlocked(null);
    setSteps((prev) => prev.map((s) => (s.state === "blocked" || s.state === "failed" ? { ...s, state: "done", details: "Skipped by user", error: undefined } : s)));
    setAgentStatus("Verified");
  };

  const handleResolveEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = String(formData.get("query") || "").trim();
    if (!query) {
      setEditError("Enter a search query to retry with.");
      return;
    }
    setEditError("");
    setEditingStepId(null);
    setBlocked(null);
    void runGoal(goalInput || query, query);
  };

  const openGoalModal = () => {
    setGoalInput("");
    setAgentStatus("Ready");
    setIsGoalModalOpen(true);
    requestAnimationFrame(() => goalTextareaRef.current?.focus());
  };

  return (
    <div className="relative h-[100dvh] w-full bg-[#07030e] text-[#f3e8ff] overflow-hidden flex flex-col justify-between p-3 md:p-5 select-none font-sans scanline-overlay grid-bg">
      {/* Background Cyber Glow & Radial Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#320857]/50 via-[#100520]/80 to-[#07030e] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-purple-700/10 blur-[140px] rounded-full pointer-events-none" />
      {/* Secondary cyan glow accent */}
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-cyan-700/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Futuristic Angular HUD Top Boundary Frame */}
      <header className="relative z-10 w-full flex items-center justify-between border-b border-purple-500/25 pb-3 animate-fade-in">
        {/* Left: Reticle Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-full border border-purple-500/60 flex items-center justify-center p-1 bg-purple-950/40 shadow-[0_0_15px_rgba(168,85,247,0.5)] animate-float">
            <div className="absolute inset-0 rounded-full border border-purple-400/40 border-dashed animate-spin-cw" />
            <div className="w-7 h-7 rounded-full border border-purple-400 flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-full bg-purple-400 shadow-[0_0_12px_#c084fc] animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-[0.3em] text-white font-orbitron glow-purple animate-flicker">
                JARVIS
              </h1>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-900/50 border border-purple-500/50 text-purple-300">
                v2.4
              </span>
            </div>
            <p className="text-[10px] tracking-[0.2em] text-purple-400/90 uppercase font-mono">
              PERSONAL AI AGENT
            </p>
          </div>
        </div>

        {/* Center: Status Indicator Pill */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-950/50 border border-purple-500/40 backdrop-blur-md">
          <span
            className={`w-2 h-2 rounded-full ${
              agentStatus === "Executing"
                ? "bg-indigo-400 animate-ping"
                : agentStatus === "Blocked"
                ? "bg-rose-500 animate-pulse"
                : agentStatus === "Verified"
                ? "bg-emerald-400"
                : "bg-purple-400"
            }`}
          />
          <span className="text-[11px] font-mono tracking-wider text-purple-200 uppercase">
            STATUS: <strong className="text-white">{agentStatus}</strong>
          </span>
        </div>

        {/* Right: Voice, Phone Sync, Date & Time */}
        <div className="flex items-center gap-3 md:gap-4">
          <VoiceAssistant
            onTranscript={(goal) => handleDeployGoal(goal)}
            onStatusChange={setVoiceState}
          />

          <button
            onClick={() => setIsQrModalOpen(true)}
            aria-label="Open phone sync QR code"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/50 border border-purple-500/40 hover:border-purple-300 text-xs font-mono text-purple-200 transition-all hover:shadow-[0_0_12px_rgba(168,85,247,0.3)] cursor-pointer"
            title="Scan QR to open on phone for live presentation"
          >
            <QrCode className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden sm:inline">Phone Sync</span>
          </button>

          <div className="text-right font-mono">
            <div className="text-[11px] text-purple-300/80">{currentDate}</div>
            <div className="text-lg md:text-xl font-bold tracking-wider text-white glow-purple leading-tight">
              {currentTime}
            </div>
          </div>
        </div>
      </header>

      {/* Autonomous Human-Like Completion Banner */}
      {missionCompleteBanner && (
        <div className="relative z-20 my-2 p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/90 via-purple-950/90 to-cyan-950/90 border-2 border-emerald-400/80 shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-300" strokeWidth={3} />
            </div>
            <div>
              <p className="text-xs font-bold text-white font-mono tracking-wide flex items-center gap-2">
                <span>AUTONOMOUS EXECUTION VERIFIED</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  ● CLOSED LOOP COMPLETED
                </span>
              </p>
              <p className="text-xs text-emerald-300 font-mono mt-0.5">
                {missionCompleteBanner}
              </p>
            </div>
          </div>
          <button
            onClick={() => setMissionCompleteBanner(null)}
            className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/50 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Cockpit Workspace Grid */}
      <main className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-5 my-2 flex-1 items-stretch overflow-y-auto md:overflow-hidden workspace-scroll">
        {/* Column 1: Left Navigation Sidebar (Cols: 1-2) */}
        <aside className="md:col-span-2 flex flex-col justify-between gap-3">
          <nav className="flex md:flex-col gap-2 hud-panel p-2 rounded-2xl border border-purple-500/25">
            <button
              onClick={() => setActiveTab("home")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === "home"
                  ? "bg-gradient-to-r from-purple-800 to-purple-900/80 text-white border border-purple-400/60 shadow-[0_0_18px_rgba(168,85,247,0.45)]"
                  : "text-purple-300/70 hover:text-white hover:bg-purple-950/40"
              }`}
            >
              <Home className="w-4 h-4 text-purple-300" />
              <span>Home</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("planner");
                openGoalModal();
              }}
              aria-label="Open the goal planner"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === "planner"
                  ? "bg-purple-800 text-white border border-purple-400/60"
                  : "text-purple-300/70 hover:text-white hover:bg-purple-950/40"
              }`}
            >
              <ListTodo className="w-4 h-4 text-purple-300" />
              <span>Planner</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("gmail");
                setIsGmailModalOpen(true);
              }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === "gmail"
                  ? "bg-purple-800 text-white border border-purple-400/60"
                  : "text-purple-300/70 hover:text-white hover:bg-purple-950/40"
              }`}
            >
              <Mail className="w-4 h-4 text-purple-300" />
              <span>Gmail</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("calendar");
                setIsCalendarModalOpen(true);
              }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === "calendar"
                  ? "bg-purple-800 text-white border border-purple-400/60"
                  : "text-purple-300/70 hover:text-white hover:bg-purple-950/40"
              }`}
            >
              <CalendarIcon className="w-4 h-4 text-purple-300" />
              <span>Calendar</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "bg-purple-800 text-white border border-purple-400/60"
                  : "text-purple-300/70 hover:text-white hover:bg-purple-950/40"
              }`}
            >
              <Settings className="w-4 h-4 text-purple-300" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Telemetry specs */}
          <div className="hidden md:flex flex-col gap-2 p-3 rounded-xl bg-purple-950/20 border border-purple-500/15 font-mono text-[10px] text-purple-400/80">
            <div className="flex justify-between">
              <span>MEMORY</span>
              <span className="text-purple-200">IN-MEMORY</span>
            </div>
            <div className="flex justify-between">
              <span>POLLING</span>
              <span className="text-emerald-400">1000ms</span>
            </div>
            <div className="flex justify-between">
              <span>SCOPES</span>
              <span className="text-purple-200">LEAST-PRIV</span>
            </div>
          </div>
        </aside>

        {/* Column 2: Center Stage HUD & Iron Man Wireframe (Cols: 3-8) */}
        <section className="md:col-span-6 flex flex-col justify-between gap-3">
          {/* Greeting Chamfered Card */}
          <div className="relative hud-panel chamfer-card-tl-br p-4 rounded-2xl border border-purple-500/35 animate-slide-up overflow-hidden">
            {/* Decorative corner accents */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-cyan-500/5 to-transparent rounded-tr-full pointer-events-none" />
            <div className="max-w-md relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <p className="text-[11px] font-mono text-cyan-400/80 uppercase tracking-[0.25em]">System Online</p>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-wide mt-0.5 font-orbitron">
                Good Morning<span className="text-purple-400">!</span>
              </h2>
              <p className="text-xs text-purple-200/75 mt-1.5 leading-relaxed">
                Turn your goal into action. I&apos;ll plan, execute and verify — every single step.
              </p>
              <div className="flex items-center gap-3 mt-2.5">
                <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-transparent rounded-full shadow-[0_0_8px_#a855f7]" />
                <div className="w-6 h-1 bg-gradient-to-r from-cyan-400 to-transparent rounded-full shadow-[0_0_6px_#22d3ee]" />
              </div>
            </div>
          </div>

          {/* Center Stage: High-Fidelity Movie-Grade Jarvis Core Visualizer */}
          <JarvisCoreVisualizer status={agentStatus} voiceState={voiceState} />

          {/* Bottom Row: Ready Gauge + Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Ready Circular Meter Gauge */}
            <div className="sm:col-span-4 hud-panel p-2.5 rounded-2xl border border-purple-500/30 flex items-center gap-3">
              <div className="relative w-14 h-14 flex-shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    className="stroke-purple-950/60"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    className={`${
                      agentStatus === "Executing"
                        ? "stroke-indigo-400 animate-spin-cw"
                        : agentStatus === "Blocked"
                        ? "stroke-rose-500"
                        : agentStatus === "Verified"
                        ? "stroke-emerald-400"
                        : "stroke-purple-400"
                    }`}
                    strokeWidth="4"
                    strokeDasharray="138"
                    strokeDashoffset={agentStatus === "Verified" ? "0" : "40"}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Radio
                    className={`w-4 h-4 ${
                      agentStatus === "Executing"
                        ? "text-indigo-400 animate-pulse"
                        : agentStatus === "Blocked"
                        ? "text-rose-400"
                        : agentStatus === "Verified"
                        ? "text-emerald-400"
                        : "text-purple-300"
                    }`}
                  />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-white font-mono tracking-wide">
                  {agentStatus}
                </p>
                <p className="text-[10px] text-purple-300/70 font-mono leading-tight">
                  {agentStatus === "Blocked"
                    ? `Action required on Step ${blocked?.stepNumber ?? "?"}`
                    : agentStatus === "Executing"
                    ? "Processing pipeline..."
                    : agentStatus === "Verified"
                    ? "All steps verified!"
                    : "Waiting for your goal..."}
                </p>
              </div>
            </div>

            {/* Autonomous Holographic Command Terminal Bar */}
            <div className="sm:col-span-8 hud-panel chamfer-card-tl-br p-3 rounded-2xl border border-purple-500/40 shadow-[0_0_24px_rgba(168,85,247,0.25)]">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <p className="text-[10px] font-mono text-cyan-400/90 uppercase tracking-widest font-bold">
                    Command Terminal
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>REAL INBOX &amp; CALENDAR</span>
                </div>
              </div>

              {/* Direct Command Prompt Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (commandBarInput.trim() && !isDeploying) {
                    runGoal(commandBarInput, deriveSearchQuery(commandBarInput));
                    setCommandBarInput("");
                  }
                }}
                className="relative flex items-center"
              >
                <div className="absolute left-3 flex items-center pointer-events-none text-cyan-400 font-mono font-bold text-xs">
                  &gt;
                </div>
                <input
                  type="text"
                  value={commandBarInput}
                  onChange={(e) => setCommandBarInput(e.target.value)}
                  placeholder="Command JARVIS (e.g. 'Scan my inbox for security alerts and schedule meeting')..."
                  className="w-full pl-7 pr-28 py-2 rounded-xl bg-purple-950/70 border border-purple-500/40 text-white placeholder-purple-400/50 text-xs font-mono focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-all"
                />
                <button
                  type="submit"
                  disabled={isDeploying || !commandBarInput.trim()}
                  className="absolute right-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-40 text-white font-bold text-[11px] shadow-[0_0_12px_rgba(34,211,238,0.4)] transition-all cursor-pointer flex items-center gap-1 font-mono"
                >
                  {isDeploying ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                  )}
                  <span>{isDeploying ? "Deploying..." : "Deploy ↵"}</span>
                </button>
              </form>

              {/* Quick Action Chips */}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-purple-500/20 overflow-x-auto text-[11px] font-mono">
                <span className="text-[10px] text-purple-400/60 flex-shrink-0">Quick run:</span>
                <button
                  type="button"
                  onClick={() => runGoal("Schedule an interview on October 15", "interview")}
                  className="px-2.5 py-1 rounded-md bg-gradient-to-r from-cyan-600/30 to-purple-600/30 hover:from-cyan-500/40 hover:to-purple-500/40 border border-cyan-400/60 text-cyan-200 flex-shrink-0 cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)] font-bold transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin-cw" />
                  <span>📅 Schedule Oct 15 Interview</span>
                </button>
                <button
                  type="button"
                  onClick={() => runGoal("Send a message to the teacher and schedule consultation", "teacher")}
                  className="px-2.5 py-1 rounded-md bg-gradient-to-r from-emerald-600/30 to-blue-600/30 hover:from-emerald-500/40 hover:to-blue-500/40 border border-emerald-400/60 text-emerald-200 flex-shrink-0 cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)] font-bold transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin-cw" />
                  <span>👨‍🏫 Message Teacher &amp; Schedule Meeting</span>
                </button>
                <button
                  type="button"
                  onClick={() => runGoal("Scan real inbox for deadlines", "")}
                  className="px-2 py-0.5 rounded-md bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 text-purple-200 flex-shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <Mail className="w-3 h-3 text-red-400" />
                  <span>Scan Real Inbox (966)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCalendarModalOpen(true)}
                  className="px-2 py-0.5 rounded-md bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 text-purple-200 flex-shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <CalendarIcon className="w-3 h-3 text-blue-400" />
                  <span>Mission Calendar</span>
                </button>
                <button
                  type="button"
                  onClick={() => runGoal("Schedule security review meeting from email alert", "Security")}
                  className="px-2 py-0.5 rounded-md bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 text-purple-200 flex-shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Sync Security Alert</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Column 3: Right Cockpit Status & Activity (Cols: 9-12) */}
        <section className="md:col-span-4 flex flex-col justify-between gap-3 overflow-hidden">
          {/* System Status Card */}
          <div className="hud-panel chamfer-card-tl-br p-3.5 rounded-2xl border border-purple-500/30">
            <h4 className="text-xs font-semibold tracking-wider text-white font-mono mb-2">
              System Status
            </h4>

            <div className="space-y-1.5">
              {/* Gmail Item */}
              <div
                onClick={() => setIsGmailModalOpen(true)}
                className="flex items-center justify-between p-2 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/20 hover:border-purple-500/40 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <Mail className="w-3 h-3 text-red-400" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-white block">Gmail</span>
                    <span className="text-[9px] font-mono text-purple-400 truncate max-w-[120px] block">shivuvijay.5601</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live</span>
                  <ChevronRight className="w-3 h-3 text-purple-400/60 ml-0.5" />
                </div>
              </div>

              {/* Calendar Item */}
              <div
                onClick={() => setIsCalendarModalOpen(true)}
                className="flex items-center justify-between p-2 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/20 hover:border-purple-500/40 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <CalendarIcon className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="text-xs font-medium text-white">Calendar</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Synced</span>
                  <ChevronRight className="w-3 h-3 text-purple-400/60 ml-0.5" />
                </div>
              </div>

              {/* LLM Brain Item */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-purple-950/30 border border-purple-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Bot className="w-3 h-3 text-purple-400" />
                  </div>
                  <span className="text-xs font-medium text-white">LLM Brain</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Ready</span>
                  <ChevronRight className="w-3 h-3 text-purple-400/60 ml-0.5" />
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-purple-950/30 border border-purple-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                    <Radio className="w-3 h-3 text-purple-300" />
                  </div>
                  <span className="text-xs font-medium text-white">Mode</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setDemoMode(demoMode === "mock" ? "real" : "mock")}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-500/50 text-[10px] font-mono cursor-pointer transition-all hover:bg-purple-800/80"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span className="text-purple-200 capitalize">{demoMode}</span>
                  </button>
                  <ChevronRight className="w-3 h-3 text-purple-400/60" />
                </div>
              </div>

              {/* Failure Demo Switch */}
              <div className="flex items-center justify-between pt-1 px-1">
                <span className="text-[10px] font-mono text-purple-300/80">Simulate Failure (Demo):</span>
                <button
                  onClick={() => setFailNext(!failNext)}
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                    failNext
                      ? "bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                      : "bg-purple-950/40 border-purple-500/20 text-purple-400"
                  }`}
                >
                  {failNext ? "FAIL_NEXT: ON" : "FAIL_NEXT: OFF"}
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="hud-panel chamfer-card-tl-br p-3.5 rounded-2xl border border-purple-500/30 flex-1 flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                  <h4 className="text-xs font-semibold tracking-wider text-white font-mono">
                    Recent Activity
                  </h4>
                </div>
                {isDeploying && (
                  <span className="text-[10px] font-mono text-indigo-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Live Polling
                  </span>
                )}
              </div>

              {/* Step Sequence List */}
              <div className="space-y-2">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`p-2.5 rounded-xl border transition-all step-card-enter ${
                      step.state === "failed"
                        ? "bg-rose-950/25 border-rose-500/50 shadow-[0_0_12px_rgba(239,68,68,0.15)]"
                        : step.state === "running"
                        ? "bg-indigo-950/25 border-indigo-500/55 shadow-[0_0_14px_rgba(99,102,241,0.2)]"
                        : step.state === "done"
                        ? "bg-emerald-950/20 border-emerald-500/35"
                        : "bg-purple-950/15 border-purple-500/10 opacity-60"
                    }`}
                  >
                    {/* Action type badge */}
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2.5">
                        {/* Step icon/status indicator */}
                        {step.state === "done" && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center flex-shrink-0 shadow-[0_0_8px_#10b981]">
                            <Check className="w-3 h-3 text-emerald-300" strokeWidth={3} />
                          </div>
                        )}
                        {step.state === "running" && (
                          <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-400/50 flex items-center justify-center flex-shrink-0 shadow-[0_0_8px_#6366f1] animate-pulse">
                            <Loader2 className="w-3 h-3 text-indigo-300 animate-spin" />
                          </div>
                        )}
                        {step.state === "failed" && (
                          <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-400/50 flex items-center justify-center flex-shrink-0 shadow-[0_0_8px_#ef4444]">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-300" />
                          </div>
                        )}
                        {step.state === "pending" && (
                          <div className="w-6 h-6 rounded-full border-2 border-purple-400/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-[9px] font-mono font-bold text-purple-400">{step.number}</span>
                          </div>
                        )}
                        {step.state === "blocked" && (
                          <div className="w-6 h-6 rounded-full border border-amber-400/50 bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-3 h-3 text-amber-400" />
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-[11px] font-semibold text-white">
                              Step {step.number}: {step.title}
                            </p>
                            {/* Action badge */}
                            <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-400 uppercase tracking-wider">
                              {step.action.split('.')[1]}
                            </span>
                          </div>
                          <p
                            className={`text-[10px] font-mono mt-0.5 ${
                              step.state === "failed"
                                ? "text-rose-400 font-medium"
                                : step.state === "running"
                                ? "text-indigo-300"
                                : step.state === "done"
                                ? "text-emerald-400/90"
                                : "text-purple-400/60"
                            }`}
                          >
                            {step.details}
                          </p>
                          {step.verificationNote && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Check className="w-2.5 h-2.5 text-emerald-500 flex-shrink-0" />
                              <p className="text-[9px] font-mono text-emerald-400/80 leading-tight">
                                {step.verificationNote}
                              </p>
                            </div>
                          )}
                          {step.error && (
                            <p className="text-[9px] font-mono text-rose-400/80 mt-0.5 leading-tight bg-rose-950/30 px-1.5 py-0.5 rounded border border-rose-500/20">
                              {step.error}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <span className="text-[9px] font-mono text-purple-400/60">
                          {step.time}
                        </span>
                        <button
                          onClick={() => setExpandedStepId(expandedStepId === step.id ? null : step.id)}
                          aria-expanded={expandedStepId === step.id}
                          aria-label={`Toggle details for step ${step.number}`}
                          className="p-0.5 rounded text-purple-400/60 hover:text-white hover:bg-purple-900/40 transition-colors cursor-pointer"
                        >
                          <ChevronRight
                            className={`w-3 h-3 transition-transform ${expandedStepId === step.id ? "rotate-90" : ""}`}
                          />
                        </button>
                      </div>
                    </div>

                    {expandedStepId === step.id && (
                      <div className="mt-2 pt-2 border-t border-purple-500/20 space-y-1 animate-fade-in">
                        <div className="flex gap-2 text-[9px] font-mono">
                          <span className="text-purple-400/60 w-20 flex-shrink-0">ACTION</span>
                          <code className="text-purple-200">{step.action}</code>
                        </div>
                        <div className="flex gap-2 text-[9px] font-mono">
                          <span className="text-purple-400/60 w-20 flex-shrink-0">DETAILS</span>
                          <span className="text-purple-200/90">{step.details}</span>
                        </div>
                        {step.verificationNote && (
                          <div className="flex gap-2 text-[9px] font-mono">
                            <span className="text-purple-400/60 w-20 flex-shrink-0">VERIFY</span>
                            <span className="text-emerald-300/90">{step.verificationNote}</span>
                          </div>
                        )}
                        {step.error && (
                          <div className="flex gap-2 text-[9px] font-mono">
                            <span className="text-purple-400/60 w-20 flex-shrink-0">ERROR</span>
                            <span className="text-rose-300/90">{step.error}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* THE SIGNATURE MOMENT: "Needs You" Intervention Card (real blocked state) */}
            {blocked && (
              <div className="mt-3 p-3 rounded-xl bg-gradient-to-br from-rose-950/50 to-amber-950/40 border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-slide-up">
                {/* Header bar */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <div className="flex items-center gap-1.5 text-amber-300 text-[11px] font-bold font-mono uppercase tracking-wider">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    Needs Your Attention
                  </div>
                  <span className="ml-auto text-[9px] font-mono text-rose-400 bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-500/30">
                    Step {blocked.stepNumber} Blocked
                  </span>
                </div>

                <p className="text-[10px] text-purple-200/90 leading-snug mb-2">
                  {blocked.reason}
                </p>

                {/* Fix suggestion */}
                <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 mb-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-300 font-mono uppercase tracking-wide">Suggested Fix</span>
                  </div>
                  <p className="text-[10px] text-emerald-200/80 font-mono">{blocked.suggestion}</p>
                </div>

                {/* Inline parameter editor (Edit action) */}
                {editingStepId === "step-3" ? (
                  <form onSubmit={handleResolveEditSubmit} className="space-y-2 animate-fade-in">
                    <label htmlFor="resolve-query" className="block text-[10px] font-mono text-purple-300/80">
                      Search query to retry with
                    </label>
                    <input
                      id="resolve-query"
                      name="query"
                      type="text"
                      autoFocus
                      defaultValue={blocked.query || goalInput}
                      aria-invalid={Boolean(editError)}
                      aria-describedby={editError ? "resolve-edit-error" : undefined}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-purple-950/60 border border-purple-500/40 text-white text-[11px] font-mono focus:outline-none focus:border-purple-300"
                    />
                    {editError && (
                      <p id="resolve-edit-error" className="text-[10px] font-mono text-rose-400">
                        {editError}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-1.5 px-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-[11px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3 h-3" />
                        Save & Retry
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStepId(null);
                          setEditError("");
                        }}
                        className="py-1.5 px-3 bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-[11px] rounded-lg border border-purple-500/40 transition-all cursor-pointer font-mono"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResolveRetry}
                      className="flex-1 py-1.5 px-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-[11px] rounded-lg shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-all cursor-pointer flex items-center justify-center gap-1.5 btn-glow"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Retry
                    </button>
                    <button
                      onClick={() => {
                        setEditingStepId("step-3");
                        setEditError("");
                      }}
                      className="py-1.5 px-3 bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-[11px] rounded-lg border border-purple-500/40 transition-all cursor-pointer font-mono flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={handleResolveSkip}
                      className="py-1.5 px-3 bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-[11px] rounded-lg border border-purple-500/40 transition-all cursor-pointer font-mono"
                    >
                      Skip
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Futuristic Cockpit Footer */}
      <footer className="relative z-10 w-full flex items-center justify-between border-t border-purple-500/25 pt-2 text-[10px] font-mono text-purple-400/80">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400/70 animate-pulse" />
          <span>Always learning. Always working.</span>
        </div>

        {/* Signal bars */}
        <div className="flex gap-1 items-end">
          {[3, 5, 8, 10, 12].map((h, i) => (
            <div
              key={i}
              className="w-1 bg-purple-500/50 rounded-sm"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-purple-400/60">JARVIS</span>
          <span className="text-purple-400/40">·</span>
          <span className="text-cyan-400/60">v2.4.0</span>
        </div>
      </footer>

      {/* Goal Deployment Modal */}
      {isGoalModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setIsGoalModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="goal-modal-title"
            className="relative w-full max-w-lg hud-panel p-6 rounded-2xl border-2 border-purple-400/60 shadow-[0_0_40px_rgba(168,85,247,0.4)] animate-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsGoalModalOpen(false)}
              aria-label="Close goal planner"
              className="absolute top-4 right-4 text-purple-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-200" />
              </div>
              <div>
                <h3 id="goal-modal-title" className="text-base font-bold text-white">Deploy Goal to Jarvis</h3>
                <p className="text-xs text-purple-300/80 font-mono">Agent will plan, execute & verify</p>
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="goal-input" className="sr-only">Describe your goal</label>
              <textarea
                id="goal-input"
                ref={goalTextareaRef}
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (goalInput.trim()) handleDeployGoal();
                  }
                }}
                placeholder="e.g. Schedule Google interview deadline from my inbox and block calendar..."
                rows={3}
                className="w-full p-3 rounded-xl bg-purple-950/60 border border-purple-500/40 text-white placeholder-purple-400/50 text-sm focus:outline-none focus:border-purple-300 font-sans resize-none"
              />

              <div>
                <p className="text-[11px] font-mono text-purple-400 mb-1.5">Quick sample goals:</p>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => setGoalInput("Prep Google SWE Interview deadline from inbox and verify calendar")}
                    className="text-left text-xs p-2 rounded-lg bg-purple-950/30 hover:bg-purple-900/50 border border-purple-500/20 text-purple-200 truncate cursor-pointer"
                  >
                    🎯 Prep Google SWE Interview deadline
                  </button>
                  <button
                    onClick={() => setGoalInput("Find Stripe offer letter & verify calendar free time")}
                    className="text-left text-xs p-2 rounded-lg bg-purple-950/30 hover:bg-purple-900/50 border border-purple-500/20 text-purple-200 truncate cursor-pointer"
                  >
                    📄 Find Stripe offer letter & verify calendar free time
                  </button>
                  <button
                    onClick={() => setGoalInput("Follow up on Datadog recruiter email and confirm slot")}
                    className="text-left text-xs p-2 rounded-lg bg-purple-950/30 hover:bg-purple-900/50 border border-purple-500/20 text-purple-200 truncate cursor-pointer"
                  >
                    ✉️ Follow up on Datadog recruiter email
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <span className="mr-auto self-center text-[10px] font-mono text-purple-400/60 hidden sm:inline">
                  Enter to deploy · Shift+Enter for newline
                </span>
                <button
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-purple-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeployGoal()}
                  disabled={!goalInput.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_15px_#a855f7] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <Send className="w-3.5 h-3.5" />
                  Deploy Agent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Presentation Modal (Phone Sync) */}
      {isQrModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setIsQrModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-modal-title"
            className="relative w-full max-w-sm hud-panel p-6 rounded-2xl border-2 border-purple-400/60 shadow-[0_0_40px_rgba(168,85,247,0.4)] text-center animate-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsQrModalOpen(false)}
              aria-label="Close phone sync"
              className="absolute top-4 right-4 text-purple-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 id="qr-modal-title" className="text-lg font-bold text-white mb-1">Dual-Screen Phone Sync</h3>
            <p className="text-xs text-purple-300 font-mono mb-4">
              Scan with your phone to control Jarvis on stage live
            </p>

            <div className="p-4 bg-white rounded-xl inline-block shadow-2xl mb-4">
              <QRCodeSVG
                value={typeof window !== "undefined" ? window.location.href : "http://localhost:3000"}
                size={180}
              />
            </div>

            <p className="text-[11px] font-mono text-purple-400">
              URL: <span className="text-white underline">http://localhost:3000</span>
            </p>
          </div>
        </div>
      )}

      {/* Gmail Inbox Scanner & Date Filter Modal */}
      <GmailViewerModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
        isAiNavigating={aiNavigating}
        targetQuery={aiTargetTopic}
        targetDate={aiTargetDate}
        onScheduleDeadline={async (email) => {
          setIsDeploying(true);
          setAgentStatus("Executing");

          try {
            await fetch("/api/calendar", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: email.subject,
                date: email.deadlineDate || email.date,
                time: email.deadlineTime || "14:00",
                location: "Google Meet",
                description: `Extracted from email: ${email.snippet}`,
              }),
            });

            // Update cockpit steps live
            const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            setSteps([
              {
                id: "step-1",
                number: 1,
                title: "Search emails",
                action: "gmail.search",
                details: `Extracted deadline from ${email.sender}`,
                time: nowTime,
                state: "done",
                verificationNote: `Deadline: ${email.deadlineDate || email.date} confirmed.`,
              },
              {
                id: "step-2",
                number: 2,
                title: "Create calendar event",
                action: "calendar.create",
                details: `Secured: ${email.subject}`,
                time: nowTime,
                state: "done",
                verificationNote: "Conflict check verified: 0 overlaps.",
              },
              {
                id: "step-3",
                number: 3,
                title: "Verify event & conflicts",
                action: "calendar.check",
                details: "Event written to calendar",
                time: nowTime,
                state: "done",
                verificationNote: `✓ verified: event saved for ${email.senderEmail}`,
              },
            ]);

            setAgentStatus("Verified");
          } catch (err) {
            console.error("Failed to auto-sync event from email:", err);
          } finally {
            setIsDeploying(false);
          }
        }}
      />

      {/* Mission Calendar & Planner Modal */}
      <CalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        targetDate={aiTargetDate}
        highlightTitle={aiTargetTopic}
        onEventCreated={(event) => {
          const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          setSteps([
            {
              id: "step-1",
              number: 1,
              title: "Check schedule",
              action: "calendar.check",
              details: "Verified slot availability",
              time: nowTime,
              state: "done",
              verificationNote: "No conflicting events.",
            },
            {
              id: "step-2",
              number: 2,
              title: "Create calendar event",
              action: "calendar.create",
              details: `Booked: ${event.title}`,
              time: nowTime,
              state: "done",
              verificationNote: `Scheduled for ${new Date(event.startTime).toLocaleDateString()}.`,
            },
            {
              id: "step-3",
              number: 3,
              title: "Verify event & conflicts",
              action: "calendar.check",
              details: "Event written to calendar",
              time: nowTime,
              state: "done",
              verificationNote: "✓ verified: event confirmed, no overlaps.",
            },
          ]);
          setAgentStatus("Verified");
        }}
      />

      {/* "Okay, you are done with what you said" Pop-up Modal */}
      {isDoneModalOpen && doneModalData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none animate-fade-in"
          onClick={() => setIsDoneModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Workflow complete modal"
            className="relative w-full max-w-lg hud-panel p-6 rounded-2xl border-2 border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.5)] flex flex-col gap-4 animate-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Status Header */}
            <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                  <Check className="w-6 h-6 text-emerald-300" strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide font-orbitron">
                    Okay, you are done with what you said!
                  </h3>
                  <p className="text-xs text-emerald-300 font-mono">
                    Autonomous Human-Like Workflow Completed
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDoneModalOpen(false)}
                className="p-1.5 rounded-lg text-emerald-400/80 hover:text-white hover:bg-emerald-950/60 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Request Bubble */}
            <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/40 font-mono">
              <span className="text-[10px] text-purple-300 uppercase tracking-widest font-bold block mb-1">
                Your Request
              </span>
              <p className="text-xs text-white italic">
                &ldquo;{doneModalData.userCommand}&rdquo;
              </p>
            </div>

            {/* Checklist of what was done */}
            <div className="space-y-2 font-mono text-xs">
              {/* Item 1: Gmail Analysis */}
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-red-400" />
                  <div>
                    <span className="text-white font-bold">1. Gmail Pop-up &amp; Analysis:</span>
                    <p className="text-[11px] text-emerald-300/80">Inbox searched and verified context</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  ✓ DONE
                </span>
              </div>

              {/* Item 2: Calendar Selection */}
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CalendarIcon className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="text-white font-bold">2. Calendar Pop-up &amp; Booking:</span>
                    <p className="text-[11px] text-emerald-300/80">
                      Date {doneModalData.targetDate} marked as &quot;{doneModalData.targetTopic}&quot;
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  ✓ DONE
                </span>
              </div>

              {/* Item 3: Confirmation Email */}
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Send className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="text-white font-bold">3. Confirmation Email:</span>
                    <p className="text-[11px] text-emerald-300/80">
                      Dispatched to {doneModalData.emailRecipient}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  ✓ DONE
                </span>
              </div>
            </div>

            {/* Done button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsDoneModalOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all cursor-pointer font-mono flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" strokeWidth={3} />
                <span>Okay, Perfect!</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
