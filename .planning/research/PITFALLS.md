# Pitfalls Research

**Domain:** Autonomous Productivity & Mission Control (Email & Calendar Agent)
**Researched:** 2026-10-15
**Confidence:** HIGH

## Common Pitfalls & Prevention Strategies

### 1. Free-form LLM Tool Hallucination
- **Pitfall**: Giving the LLM general tool-calling capabilities causes it to invent non-existent APIs, send hallucinated email bodies, or produce malformed JSON schemas.
- **Warning Signs**: Uncaught runtime errors like `Cannot read property 'undefined'`, API 400 Bad Request responses.
- **Prevention**: Enforce rigid Zod schema validation over a strict 4-action enum. If parsing fails, fall back to predefined deterministic plan templates based on goal keywords.

### 2. Silent Step Failures & False Positives
- **Pitfall**: The adapter returns `200 OK` or completes a promise, but the email was bounced or the calendar slot created an unhandled collision. The user assumes the deadline is handled.
- **Warning Signs**: Green checkmarks on steps where no actual event appears on Google Calendar.
- **Prevention**: Every step must pass active verification in `lib/verifier.ts` before status is changed to `done`. If verification fails, flag as `failed`, attempt 1 repair, then transition to `blocked` with a prominent "Needs you" card.

### 3. Google OAuth & Venue Wi-Fi Breakage
- **Pitfall**: Live demo crashes because venue Wi-Fi is congested, OAuth refresh tokens expire, or Google OAuth verification screen blocks the app.
- **Warning Signs**: Connection timeouts, OAuth 401/403 errors on stage.
- **Prevention**: Implement a 100% faithful in-memory mock adapter (`DEMO_MODE=mock`) with seeded recruiter emails. Build a visible UI toggle switch to flip between Real and Mock seamlessly.

### 4. Over-engineering Persistence & Auth
- **Pitfall**: Spending 4 out of 8 hours setting up Supabase, Prisma, NextAuth, or Docker instead of building the core agent loop.
- **Warning Signs**: Working on database schemas at hour 4 with no working agent demo.
- **Prevention**: Zero external DB, zero login screens. Keep task state in an in-memory Map structure.

### 5. Infinite Retry Loops
- **Pitfall**: The LLM tries to fix an invalid recipient email address indefinitely, running up API costs and hanging the UI.
- **Warning Signs**: Execution spinning continuously without reaching a terminal state.
- **Prevention**: Max 1 auto-retry per step. If the retry fails verification, immediately halt execution and present the "Needs you" card.
