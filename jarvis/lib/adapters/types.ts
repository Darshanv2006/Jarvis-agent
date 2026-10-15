export interface EmailMessage {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  date: string; // ISO or readable format, e.g. "2025-10-24"
  snippet: string;
  body: string;
  hasDeadline: boolean;
  deadlineDate?: string;
  deadlineTime?: string;
  category: "interview" | "assessment" | "offer" | "rejection" | "followup";
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  location?: string;
}

export interface TaskStep {
  id: string;
  number: number;
  title: string;
  action: "gmail.search" | "gmail.send" | "calendar.create" | "calendar.check";
  params: Record<string, any>;
  state: "pending" | "running" | "done" | "failed" | "blocked";
  details?: string;
  result?: any;
  verificationNote?: string;
  error?: string;
}
