"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { CalendarEvent } from "@/lib/adapters/types";

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: (event: CalendarEvent) => void;
  targetDate?: string;
  highlightTitle?: string;
}

export function CalendarModal({
  isOpen,
  onClose,
  onEventCreated,
  targetDate,
  highlightTitle,
}: CalendarModalProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [filter, setFilter] = useState<"all" | "upcoming">("all");

  // Form states
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("14:00");
  const [location, setLocation] = useState("Google Meet");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calendar");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error("Failed to fetch calendar events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
      if (targetDate) {
        setDate(targetDate);
        if (highlightTitle) setTitle(highlightTitle);
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDate(tomorrow.toISOString().split("T")[0]);
      }
    }
  }, [isOpen, targetDate, highlightTitle]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          date,
          time,
          location,
          description,
        }),
      });

      const data = await res.json();
      if (data.event) {
        setEvents((prev) => [...prev, data.event].sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        ));
        setToastMessage(`Event '${data.event.title}' scheduled!`);
        setTimeout(() => setToastMessage(null), 3500);
        setShowAddForm(false);
        setTitle("");
        setDescription("");
        if (onEventCreated) onEventCreated(data.event);
      }
    } catch (err) {
      console.error("Failed to create calendar event:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/calendar?id=${id}`, { method: "DELETE" });
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setToastMessage("Event removed from schedule.");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  };

  const formatEventDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoStr;
    }
  };

  const formatEventTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    } catch {
      return "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div className="relative w-full max-w-4xl h-[640px] max-h-[92vh] hud-panel p-5 rounded-2xl border-2 border-purple-500/50 shadow-[0_0_45px_rgba(168,85,247,0.4)] flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-500/25 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">Jarvis Mission Calendar</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                  ● SYNC ACTIVE
                </span>
                <span className="text-[10px] font-mono text-purple-400">
                  {events.length} Events Booked
                </span>
              </div>
              <p className="text-xs text-purple-300/80 font-mono">
                Autonomous schedule verification & conflict detection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_12px_rgba(168,85,247,0.4)] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? "View Schedule" : "New Event"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-purple-950/60 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast alert */}
        {toastMessage && (
          <div className="my-2 p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* AI Autonomous Navigation Indicator */}
        {targetDate && (
          <div className="my-2 p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-400/60 text-xs font-mono text-cyan-200 flex items-center justify-between shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-pulse">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>
                AI OPERATOR: Date <strong className="text-white underline">{targetDate}</strong> Selected &middot; Marked as <strong className="text-emerald-300">&quot;{highlightTitle || "Technical Interview"}&quot;</strong>
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              ● CO-PILOT ACTIVE
            </span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto my-3 pr-1">
          {showAddForm ? (
            /* Add Event Form */
            <form onSubmit={handleCreate} className="hud-panel p-5 rounded-xl border border-purple-500/30 space-y-4 max-w-2xl mx-auto">
              <div className="flex items-center gap-2 border-b border-purple-500/20 pb-2">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin-cw" />
                <h4 className="text-sm font-bold text-white">Schedule New Deadline or Interview</h4>
              </div>

              <div>
                <label className="text-xs font-mono text-purple-300 block mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Google Round 1 Technical Interview"
                  className="w-full px-3 py-2 rounded-lg bg-purple-950/60 border border-purple-500/30 text-white placeholder-purple-400/50 text-xs font-mono focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-purple-300 block mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-purple-950/60 border border-purple-500/30 text-white text-xs font-mono focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-purple-300 block mb-1">Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-purple-950/60 border border-purple-500/30 text-white text-xs font-mono focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-purple-300 block mb-1">Location / Format</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Google Meet / Zoom / Phone"
                    className="w-full px-3 py-2 rounded-lg bg-purple-950/60 border border-purple-500/30 text-white text-xs font-mono focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-purple-300 block mb-1">Description / Notes</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Focus: DSA / Coding Challenge"
                    className="w-full px-3 py-2 rounded-lg bg-purple-950/60 border border-purple-500/30 text-white text-xs font-mono focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-lg text-xs font-mono text-purple-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_12px_#a855f7] cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save to Calendar</span>
                </button>
              </div>
            </form>
          ) : (
            /* Events Timeline View */
            <div className="space-y-3">
              {loading ? (
                <div className="h-64 flex items-center justify-center text-purple-400 font-mono text-xs">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span>Loading mission calendar schedule...</span>
                </div>
              ) : events.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-purple-500/20 rounded-xl bg-purple-950/20">
                  <CalendarIcon className="w-10 h-10 text-purple-400/50 mb-2" />
                  <p className="text-sm font-bold text-white">Your Calendar is Clear</p>
                  <p className="text-xs text-purple-300/70 font-mono mt-1">
                    No deadlines or meetings booked. Click &quot;New Event&quot; or sync from an email in the Gmail Scanner.
                  </p>
                </div>
              ) : (
                events.map((evt) => {
                  const isTarget = Boolean(
                    (targetDate && evt.startTime.includes(targetDate)) ||
                    (highlightTitle && evt.title.toLowerCase().includes(highlightTitle.toLowerCase()))
                  );
                  return (
                    <div
                      key={evt.id}
                      className={`p-3.5 rounded-xl transition-all flex items-center justify-between group ${
                        isTarget
                          ? "bg-cyan-950/50 border-2 border-cyan-400 shadow-[0_0_24px_rgba(6,182,212,0.45)] ring-1 ring-cyan-300/40"
                          : "bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/25 hover:border-purple-400/50"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className={`w-10 h-10 rounded-xl border flex flex-col items-center justify-center flex-shrink-0 ${
                          isTarget
                            ? "bg-gradient-to-br from-cyan-600/30 to-blue-600/30 border-cyan-400 text-cyan-200"
                            : "bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-400/30"
                        }`}>
                          <span className="text-[10px] font-bold font-mono leading-none">
                            {new Date(evt.startTime).getDate() || "--"}
                          </span>
                          <span className="text-[8px] uppercase font-mono text-purple-300 leading-none mt-0.5">
                            {new Date(evt.startTime).toLocaleString("default", { month: "short" }) || "--"}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white">{evt.title}</h4>
                            {isTarget ? (
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/70 text-cyan-200 font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)] animate-pulse">
                                ★ MARKED AS INTERVIEW
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                                Verified Slot
                              </span>
                            )}
                          </div>

                        <div className="flex items-center gap-3 mt-1 text-xs font-mono text-purple-300/80">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-purple-400" />
                            <span>
                              {formatEventTime(evt.startTime)}
                              {evt.endTime ? ` - ${formatEventTime(evt.endTime)}` : ""}
                            </span>
                          </div>
                          {evt.location && (
                            <div className="flex items-center gap-1 text-cyan-300">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{evt.location}</span>
                            </div>
                          )}
                        </div>

                        {evt.description && (
                          <p className="text-[11px] text-purple-300/60 mt-1 font-sans">
                            {evt.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(evt.id)}
                      className="p-2 rounded-lg text-purple-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer opacity-80 group-hover:opacity-100"
                      title="Delete event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-purple-500/20 flex items-center justify-between text-[11px] font-mono text-purple-400/80">
          <span>Synced with local schedule & Gmail deadline parser</span>
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
