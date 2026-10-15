import { EmailMessage, CalendarEvent } from "./types";

export const SEEDED_EMAILS: EmailMessage[] = [
  {
    id: "email-1",
    sender: "Google University Recruiting",
    senderEmail: "recruiting-team@google.com",
    subject: "Google SWE Intern 2025 - Round 1 Technical Interview Invitation",
    date: "2025-10-22",
    snippet: "Your Round 1 Technical Interview is scheduled for Friday, Oct 24, 2025 at 2:00 PM EST...",
    body: `Hi,\n\nCongratulations on advancing to Round 1 of the Google Software Engineering Internship process!\n\nYour 45-minute technical interview has been reserved for:\nDate: Friday, October 24, 2025\nTime: 2:00 PM - 2:45 PM EST\nFormat: Google Meet (link attached in calendar)\nFocus: Data Structures & Algorithms\n\nPlease confirm your availability by replying to this thread.\n\nBest,\nGoogle University Programs`,
    hasDeadline: true,
    deadlineDate: "2025-10-24",
    deadlineTime: "14:00",
    category: "interview",
  },
  {
    id: "email-2",
    sender: "Bloomberg Campus Recruitment",
    senderEmail: "campusrecruiting@bloomberg.net",
    subject: "Bloomberg Technical Phone Screen Confirmation",
    date: "2025-10-22",
    snippet: "Your technical phone screen with a senior engineer is confirmed for Friday, Oct 24, 2025 at 10:00 AM...",
    body: `Hi,\n\nWe have scheduled your Bloomberg Technical Phone Screen:\nDate: Friday, October 24, 2025\nTime: 10:00 AM - 11:00 AM EST\nInterviewer: Alex Chen (Software Infrastructure)\n\nMake sure you have a quiet environment and a working microphone.\n\nBest regards,\nBloomberg Campus Recruitment`,
    hasDeadline: true,
    deadlineDate: "2025-10-24",
    deadlineTime: "10:00",
    category: "interview",
  },
  {
    id: "email-3",
    sender: "Datadog Talent Team",
    senderEmail: "talent@datadoghq.com",
    subject: "Action Required: Datadog Online Coding Assessment Deadline",
    date: "2025-10-21",
    snippet: "Your online coding assessment for the Software Engineer Intern role is due by Sunday, Oct 26, 2025...",
    body: `Hi,\n\nThank you for applying to Datadog! As the next step, please complete the 70-minute HackerRank coding challenge.\n\nDeadline to submit: Sunday, October 26, 2025 at 11:59 PM EST\n\nLink: https://hackerrank.com/datadog-swe-assessment\n\nGood luck!\nDatadog Early Career Talent`,
    hasDeadline: true,
    deadlineDate: "2025-10-26",
    deadlineTime: "23:59",
    category: "assessment",
  },
  {
    id: "email-4",
    sender: "Meta University Recruiting",
    senderEmail: "meta-careers@meta.com",
    subject: "Meta SWE Screening Call - Tuesday, Oct 28",
    date: "2025-10-21",
    snippet: "Your recruiter phone screening has been booked for Tuesday, Oct 28, 2025 at 11:00 AM...",
    body: `Hi,\n\nLooking forward to speaking with you! We've scheduled our introductory 30-minute screening call for:\nDate: Tuesday, October 28, 2025\nTime: 11:00 AM EST\n\nI will call the phone number listed on your resume.\n\nBest,\nSarah Jenkins | Meta Recruiting`,
    hasDeadline: true,
    deadlineDate: "2025-10-28",
    deadlineTime: "11:00",
    category: "interview",
  },
  {
    id: "email-5",
    sender: "Stripe Careers",
    senderEmail: "offers@stripe.com",
    subject: "Stripe 2025 Internship Offer Letter & Decision Deadline",
    date: "2025-10-20",
    snippet: "Congratulations! We are thrilled to offer you a Software Engineer Internship for Summer 2025...",
    body: `Hi,\n\nWe were incredibly impressed by your interviews and are thrilled to offer you a 2025 Software Engineering Internship at Stripe!\n\nOffer Details & Contract are attached in DocuSign.\nDecision Deadline: Wednesday, October 29, 2025 at 5:00 PM EST.\n\nPlease let us know if you have any questions.\n\nWarm regards,\nThe Stripe Team`,
    hasDeadline: true,
    deadlineDate: "2025-10-29",
    deadlineTime: "17:00",
    category: "offer",
  },
  {
    id: "email-6",
    sender: "Microsoft Careers",
    senderEmail: "university@microsoft.com",
    subject: "Microsoft Final Round Interview Confirmation",
    date: "2025-10-19",
    snippet: "Your final round virtual onsite is set for Monday, Nov 3, 2025 at 1:30 PM...",
    body: `Hi,\n\nYour final round interviews for Microsoft Redmond are confirmed for Monday, November 3, 2025 from 1:30 PM to 4:30 PM.\n\nEnsure your development environment is set up for collaborative coding.\n\nBest,\nMicrosoft Early Careers`,
    hasDeadline: true,
    deadlineDate: "2025-11-03",
    deadlineTime: "13:30",
    category: "interview",
  },
  {
    id: "email-7",
    sender: "Amazon Student Programs",
    senderEmail: "recruiter@amazn-careers.fake",
    subject: "Amazon SDE Interview Confirmation Followup",
    date: "2025-10-19",
    snippet: "Please confirm your availability for the Amazon SDE interview loop...",
    body: `Hi,\n\nPlease verify your availability for the upcoming interview loop on Oct 25, 2025. Please reply to recruiter@amazn-careers.fake.\n\nRegards,\nAmazon Recruiting`,
    hasDeadline: true,
    deadlineDate: "2025-10-25",
    deadlineTime: "15:00",
    category: "followup",
  },
];

export function searchMockEmails(query: string, targetDate?: string): {
  matches: EmailMessage[];
  found: boolean;
  message: string;
} {
  const cleanQ = (query || "").toLowerCase();
  const cleanDate = (targetDate || "").toLowerCase();

  const matches = SEEDED_EMAILS.filter((email) => {
    // If target date specified, check if email deadline matches that date
    if (cleanDate && (email.deadlineDate?.includes(cleanDate) || email.body.toLowerCase().includes(cleanDate))) {
      return true;
    }
    // Match by query
    if (cleanQ) {
      return (
        email.subject.toLowerCase().includes(cleanQ) ||
        email.sender.toLowerCase().includes(cleanQ) ||
        email.snippet.toLowerCase().includes(cleanQ) ||
        email.body.toLowerCase().includes(cleanQ) ||
        (email.deadlineDate && email.deadlineDate.includes(cleanQ))
      );
    }
    return true;
  });

  return {
    matches,
    found: matches.length > 0,
    message:
      matches.length > 0
        ? `Found ${matches.length} email(s) matching '${query || targetDate}'.`
        : `No matching emails found for '${query || targetDate}'.`,
  };
}
