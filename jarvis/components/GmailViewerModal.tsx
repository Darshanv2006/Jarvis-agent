"use client";

import React, { useState, useEffect } from "react";
import { Mail, Search, Clock, X, ArrowRight, AlertCircle, Loader2, Link2, CheckCircle2, Inbox, Calendar, User, Sparkles } from "lucide-react";
import { EmailMessage } from "@/lib/adapters/types";

// Deterministic avatar color from sender name
function getAvatarColor(name: string): { bg: string; text: string } {
  const colors = [
    { bg: "bg-red-500/20", text: "text-red-400" },
    { bg: "bg-blue-500/20", text: "text-blue-400" },
    { bg: "bg-emerald-500/20", text: "text-emerald-400" },
    { bg: "bg-amber-500/20", text: "text-amber-400" },
    { bg: "bg-purple-500/20", text: "text-purple-400" },
    { bg: "bg-cyan-500/20", text: "text-cyan-400" },
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

function getInitials(sender: string): string {
  return sender
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatRelativeDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff}d ago`;
    return dateStr;
  } catch {
    return dateStr;
  }
}

interface GmailViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduleDeadline?: (email: EmailMessage) => void;
  isAiNavigating?: boolean;
  targetQuery?: string;
  targetDate?: string;
}

export function GmailViewerModal({
  isOpen,
  onClose,
  onScheduleDeadline,
  isAiNavigating,
  targetQuery,
  targetDate,
}: GmailViewerModalProps) {
  const [searchDate, setSearchDate] = useState<string>("");
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [source, setSource] = useState<string>("mock");
  const [warning, setWarning] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;

    const fetchEmails = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        const activeDate = searchDate || targetDate;
        if (activeDate) params.set("date", activeDate);
        if (targetQuery) params.set("q", targetQuery);
        const res = await fetch(`/api/gmail/search?${params.toString()}`);
        const data = await res.json();
        setEmails(data.matches || []);
        setSource(data.source || "mock");
        setWarning(data.warning || "");
        if (data.matches && data.matches.length > 0) {
          setSelectedEmail(data.matches[0]);
        } else {
          setSelectedEmail(null);
        }
      } catch (err) {
        console.error("Failed to search emails:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, [isOpen, searchDate, targetDate, targetQuery]);

  if (!isOpen) return null;

  const handleQuickDate = (dateStr: string) => {
    setSearchDate(dateStr);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Gmail inbox scanner"
        className="relative w-full max-w-4xl h-[620px] max-h-[90vh] hud-panel p-5 rounded-2xl border-2 border-purple-500/50 shadow-[0_0_45px_rgba(168,85,247,0.4)] flex flex-col justify-between animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-500/25 pb-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <Mail className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white tracking-wide font-orbitron">Gmail Inbox Scanner</h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  source === "real_gmail"
                    ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                    : "bg-purple-900/50 border-purple-500/40 text-purple-300"
                }`}>
                  {source === "real_gmail" ? "● LIVE GMAIL API" : "DEMO INBOX"}
                </span>
                <span className="text-[10px] font-mono text-purple-400">
                  {emails.length > 0 ? `${emails.length} Found` : "—"}
                </span>
              </div>
              <p className="text-[11px] text-purple-300/80 font-mono">
                {source === "real_gmail"
                  ? "Connected to shivuvijay.5601@gmail.com"
                  : "Scanning for deadlines, interviews & recruiter replies"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {source !== "real_gmail" && (
              <a
                href="/api/auth/google"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-[11px] shadow-[0_0_12px_rgba(239,68,68,0.4)] transition-all cursor-pointer btn-glow"
                title="Connect real Google account via OAuth"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Connect Gmail</span>
              </a>
            )}

            <button
              onClick={onClose}
              aria-label="Close inbox scanner"
              className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-purple-950/60 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Warning banner if real failed or notice */}
        {warning && (
          <div className="my-2 p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[11px] font-mono text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{warning}</span>
          </div>
        )}

        {/* AI Operator Autonomous Scanner Banner */}
        {(isAiNavigating || targetQuery || targetDate) && (
          <div className="my-2 p-2.5 rounded-xl bg-purple-950/70 border border-purple-400/60 text-xs font-mono text-purple-200 flex items-center justify-between shadow-[0_0_20px_rgba(168,85,247,0.3)] animate-pulse">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span>
                AI OPERATOR: Scanning Gmail inbox for <strong className="text-white">&quot;{targetQuery || "Interview Schedule"}&quot;</strong> {targetDate ? `(Target: ${targetDate})` : ""}
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              ● SCANNING INBOX
            </span>
          </div>
        )}

        {/* Date Filter Bar */}
        <div className="my-2 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
            <input
              type="text"
              aria-label="Filter inbox by date, sender, or keyword"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              placeholder="Check a date (e.g. 2025-10-24, Oct 24, interview, Google)..."
              className="w-full pl-9 pr-24 py-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-white placeholder-purple-400/50 text-xs font-mono focus:outline-none focus:border-purple-400"
            />
            {loading ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 animate-spin" />
            ) : searchDate ? (
              <button
                onClick={() => setSearchDate("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-purple-400 hover:text-white"
              >
                Clear
              </button>
            ) : null}
          </div>

          {/* Quick Date Shortcuts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono text-purple-300/90">
            <span className="text-purple-400/60 text-[10px] flex-shrink-0">Check dates:</span>
            <button
              onClick={() => handleQuickDate("10-24")}
              className="px-2 py-0.5 rounded-md bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 cursor-pointer flex-shrink-0"
            >
              📅 Oct 24 (Google & Bloomberg)
            </button>
            <button
              onClick={() => handleQuickDate("10-26")}
              className="px-2 py-0.5 rounded-md bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 cursor-pointer flex-shrink-0"
            >
              ⏳ Oct 26 (Datadog Challenge)
            </button>
            <button
              onClick={() => handleQuickDate("10-28")}
              className="px-2 py-0.5 rounded-md bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 cursor-pointer flex-shrink-0"
            >
              📞 Oct 28 (Meta Screen)
            </button>
            <button
              onClick={() => handleQuickDate("10-29")}
              className="px-2 py-0.5 rounded-md bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 cursor-pointer flex-shrink-0"
            >
              🎉 Oct 29 (Stripe Offer)
            </button>
            <button
              onClick={() => handleQuickDate("12-15")}
              className="px-2 py-0.5 rounded-md bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/20 text-purple-400 cursor-pointer flex-shrink-0"
            >
              🚫 Dec 15 (Empty)
            </button>
          </div>
        </div>

        {/* Content Body: Split list & detail */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 overflow-hidden">
          {/* Email List */}
          <div className="md:col-span-5 flex flex-col gap-2 overflow-y-auto pr-1">
            {loading ? (
              <div className="h-full flex items-center justify-center p-6 text-purple-400 font-mono text-xs">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>Searching inbox messages...</span>
              </div>
            ) : emails.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center border border-purple-500/20 rounded-xl bg-purple-950/10">
                <AlertCircle className="w-8 h-8 text-purple-400/60 mb-2" />
                <p className="text-xs font-bold text-white">No Emails on this Date</p>
                <p className="text-[11px] text-purple-300/70 font-mono mt-1">
                  Jarvis checked your inbox — zero deadlines or meetings found for &quot;{searchDate}&quot;.
                </p>
              </div>
            ) : (
              emails.map((email) => {
                const avatar = getAvatarColor(email.sender);
                return (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer step-card-enter ${
                    selectedEmail?.id === email.id
                      ? "bg-purple-900/60 border-purple-400 shadow-[0_0_14px_rgba(168,85,247,0.35)]"
                      : "bg-purple-950/30 hover:bg-purple-900/30 border-purple-500/20 hover:border-purple-400/40"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-lg ${avatar.bg} border border-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <span className={`text-[10px] font-bold ${avatar.text} font-mono`}>
                        {getInitials(email.sender)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-white truncate max-w-[160px]">{email.sender}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {email.hasDeadline && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          )}
                          <span className="text-[10px] font-mono text-purple-400">{formatRelativeDate(email.date)}</span>
                        </div>
                      </div>
                      <p className="text-[11px] font-semibold text-purple-100 truncate mt-0.5">{email.subject}</p>
                      <p className="text-[10px] text-purple-300/60 truncate font-mono mt-0.5">{email.snippet}</p>

                      {email.hasDeadline && (
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono">
                          <div className="flex items-center gap-1 text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            <span>Deadline: {email.deadlineDate || email.date}</span>
                          </div>
                          {email.deadlineTime && (
                            <span className="text-purple-400">@ {email.deadlineTime}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }))}
          </div>

          {/* Email Preview & Action */}
          <div className="md:col-span-7 hud-panel p-4 rounded-xl border border-purple-500/30 flex flex-col justify-between overflow-y-auto">
            {selectedEmail ? (
              <div className="space-y-3 animate-fade-in">
                {/* Sender header */}
                <div className="flex items-start gap-3 pb-3 border-b border-purple-500/20">
                  {(() => {
                    const avatar = getAvatarColor(selectedEmail.sender);
                    return (
                    <div className={`w-10 h-10 rounded-xl ${avatar.bg} border border-purple-500/25 flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-xs font-bold ${avatar.text} font-mono`}>
                        {getInitials(selectedEmail.sender)}
                      </span>
                    </div>
                  )})()}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{selectedEmail.sender}</span>
                      {selectedEmail.hasDeadline && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-amber-950/50 border border-amber-500/40 text-amber-300 uppercase tracking-wider">
                          Deadline
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-purple-400">{selectedEmail.senderEmail}</span>
                    <div className="text-[10px] font-mono text-purple-400/60 mt-0.5">{selectedEmail.date}</div>
                  </div>
                </div>

                {/* Subject */}
                <h4 className="text-sm font-bold text-white leading-snug">{selectedEmail.subject}</h4>

                {selectedEmail.hasDeadline && (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/40 to-amber-900/20 border border-amber-500/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-mono text-amber-400/80 uppercase tracking-wider">Extracted Deadline</p>
                        <p className="text-sm font-bold text-white font-mono">
                          {selectedEmail.deadlineDate || selectedEmail.date}
                          {selectedEmail.deadlineTime ? ` @ ${selectedEmail.deadlineTime}` : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (onScheduleDeadline) onScheduleDeadline(selectedEmail);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-[11px] shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-all cursor-pointer btn-glow flex-shrink-0"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Sync</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Email body */}
                <div className="pt-2 text-xs text-purple-200 font-mono whitespace-pre-wrap leading-relaxed opacity-80">
                  {selectedEmail.body}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-purple-400/50 font-mono text-xs animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-purple-950/30 border border-purple-500/20 flex items-center justify-center mb-4">
                  <Inbox className="w-7 h-7 text-purple-400/40" />
                </div>
                <p className="text-white/60 font-semibold text-sm mb-1">No email selected</p>
                <span className="leading-snug">Click on an email from the list to preview its content and any extracted schedule dates.</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-purple-500/20 flex items-center justify-between text-[11px] font-mono text-purple-400/80">
          <span>Source: {source === "real_gmail" ? "Authenticated Google Account" : "Seeded Test Mailbox"}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-purple-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
