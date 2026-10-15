import { CalendarEvent } from "./types";
import fs from "fs";
import path from "path";

const CALENDAR_FILE = path.join(process.cwd(), ".planning", "calendar_events.json");

let inMemoryEvents: CalendarEvent[] = [
  {
    id: "evt-1",
    title: "Google SWE Round 1 Technical Interview",
    startTime: "2025-10-24T14:00:00Z",
    endTime: "2025-10-24T14:45:00Z",
    description: "Data Structures & Algorithms screen via Google Meet.",
    location: "Google Meet",
  },
  {
    id: "evt-2",
    title: "Bloomberg Technical Phone Screen",
    startTime: "2025-10-24T10:00:00Z",
    endTime: "2025-10-24T11:00:00Z",
    description: "Alex Chen (Software Infrastructure).",
    location: "Phone Call",
  },
  {
    id: "evt-3",
    title: "Meta SWE Screening Call",
    startTime: "2025-10-28T11:00:00Z",
    endTime: "2025-10-28T11:30:00Z",
    description: "Introductory phone screen with Sarah Jenkins.",
    location: "Phone Call",
  },
];

function loadEvents(): CalendarEvent[] {
  try {
    if (fs.existsSync(CALENDAR_FILE)) {
      const data = fs.readFileSync(CALENDAR_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to read calendar file, using memory:", err);
  }
  return inMemoryEvents;
}

function saveEvents(events: CalendarEvent[]) {
  inMemoryEvents = events;
  try {
    const dir = path.dirname(CALENDAR_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CALENDAR_FILE, JSON.stringify(events, null, 2), "utf-8");
  } catch (err) {
    console.warn("Failed to persist calendar file:", err);
  }
}

export function getCalendarEvents(): CalendarEvent[] {
  return loadEvents().sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
}

export function checkCalendarSlot(
  startTime: string,
  endTime: string,
  excludeId?: string
): {
  isFree: boolean;
  conflictingEvent?: CalendarEvent;
} {
  const events = getCalendarEvents();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  for (const evt of events) {
    if (excludeId && evt.id === excludeId) continue;
    const eStart = new Date(evt.startTime).getTime();
    const eEnd = new Date(evt.endTime).getTime();

    // Check overlap: start < eEnd && end > eStart
    if (start < eEnd && end > eStart) {
      return { isFree: false, conflictingEvent: evt };
    }
  }

  return { isFree: true };
}

export function createCalendarEvent(eventData: {
  title: string;
  startTime: string;
  endTime?: string;
  description?: string;
  location?: string;
}): {
  success: boolean;
  event: CalendarEvent;
  conflict?: CalendarEvent;
  message: string;
} {
  const events = loadEvents();
  const id = `evt-${Date.now()}`;

  let endTime = eventData.endTime;
  if (!endTime) {
    const s = new Date(eventData.startTime);
    s.setHours(s.getHours() + 1);
    endTime = s.toISOString();
  }

  // Prune any previous duplicate events for the same title and day so repeated demo runs don't conflict with themselves
  const filteredEvents = events.filter((e) => {
    const isSameSlot = e.startTime === eventData.startTime && e.endTime === endTime;
    const isSameTitle =
      e.title.toLowerCase() === eventData.title.toLowerCase() &&
      e.startTime.slice(0, 10) === eventData.startTime.slice(0, 10);
    return !(isSameSlot || isSameTitle);
  });

  const slotCheck = checkCalendarSlot(eventData.startTime, endTime);

  const newEvent: CalendarEvent = {
    id,
    title: eventData.title,
    startTime: eventData.startTime,
    endTime,
    description: eventData.description,
    location: eventData.location || "Google Meet",
  };

  filteredEvents.push(newEvent);
  saveEvents(filteredEvents);

  return {
    success: true,
    event: newEvent,
    conflict: slotCheck.isFree ? undefined : slotCheck.conflictingEvent,
    message: slotCheck.isFree
      ? `Event '${newEvent.title}' scheduled and verified conflict-free.`
      : `Event scheduled with warning: overlaps with existing event '${slotCheck.conflictingEvent?.title}'.`,
  };
}

export function deleteCalendarEvent(id: string): boolean {
  const events = loadEvents();
  const filtered = events.filter((e) => e.id !== id);
  if (filtered.length !== events.length) {
    saveEvents(filtered);
    return true;
  }
  return false;
}
