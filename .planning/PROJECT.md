# Deadline Wrangler (Jarvis)

## What This Is

A mission-control web app for university students juggling internship and interview deadlines across email and calendar. A student inputs one goal in plain English, and an autonomous agent plans and executes it across Gmail and Google Calendar, verifies every step actually happened, and surfaces transparent failure recovery via a "Needs you" card instead of failing silently.

## Core Value

Reliable, verified goal execution across Gmail & Google Calendar with guaranteed failure visibility — when a step fails, the agent notices, retries with an LLM-suggested fix, and surfaces human intervention rather than failing silently.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **PLAN-01**: User can submit a natural-language goal via `POST /api/plan` and receive a structured task ID with validated steps
- [ ] **PLAN-02**: Planner strictly outputs actions from the 4-action enum (`gmail.search`, `gmail.send`, `calendar.create`, `calendar.check`), Zod-validated
- [ ] **PLAN-03**: Planner includes a deterministic template fallback when the LLM API is unavailable or returns malformed output
- [ ] **EXEC-01**: Step runner sequentially executes planned steps, managing states `pending`, `running`, `done`, `failed`, `blocked`
- [ ] **EXEC-02**: In-memory task state store maintains the full task lifecycle and serves updates via `GET /api/task/:id`
- [ ] **EXEC-03**: Task runner updates execution outputs, timestamps, and active step index in real time
- [ ] **VERIF-01**: `gmail.search` verification confirms ≥1 result AND an actionable deadline date/time extracted
- [ ] **VERIF-02**: `gmail.send` verification confirms the sent message exists in the SENT box
- [ ] **VERIF-03**: `calendar.create` verification queries the created event ID and confirms no scheduling conflict
- [ ] **VERIF-04**: `calendar.check` verification confirms free/busy status was retrieved for the target window
- [ ] **RECOV-01**: On verification failure, the LLM suggests a fix and exactly one automatic retry runs
- [ ] **RECOV-02**: If the retry fails, execution halts, the task is marked `blocked`, and the step is highlighted
- [ ] **RECOV-03**: User resolves a blocked step via `POST /api/task/:id/resolve` with `retry` / `edit` / `skip`
- [ ] **ADAPT-01**: Uniform adapter interface implemented by both the real Google APIs and the mock provider
- [ ] **ADAPT-02**: Real adapter connects to Gmail (`gmail.readonly`, `gmail.send`) and Calendar (`calendar.events`) with OAuth 2.0
- [ ] **ADAPT-03**: Mock adapter simulates 10 seeded recruiter emails and calendar events with a toggleable `FAIL_NEXT` mode
- [ ] **ADAPT-04**: `DEMO_MODE` env switch dynamically selects `real` vs `mock` adapters
- [ ] **UI-01**: Single-page Mission Control dashboard with goal input bar and example-goal quick-fills
- [ ] **UI-02**: Live execution timeline polling `GET /api/task/:id` every 1s with step icons, titles, and real-time state badges
- [ ] **UI-03**: Interactive "Needs you" resolution card with error details, parameter editor, and `Retry` / `Edit` / `Skip` buttons
- [ ] **UI-04**: Demo control drawer with switches for `DEMO_MODE` (Real/Mock) and the `FAIL_NEXT` simulation trigger
- [ ] **UI-05**: Responsive mobile layout with QR code for dual-screen live demo
- [ ] **TOOL-01**: OAuth bootstrap script (`scripts/oauth-setup.mjs`) generating Google OAuth refresh tokens
- [ ] **TOOL-02**: Seed script (`scripts/seed.mjs`) populating the test inbox with 10 realistic recruiter emails
- [ ] **QA-01**: Demo robustness — top-10 test matrix passes, clean clone runs from README alone, no secrets in git history

### Out of Scope

- User authentication & multi-tenant auth — single-user local demo is sufficient for the hackathon scope
- External databases (PostgreSQL/MongoDB) — in-memory state object meets all requirements without connection overhead
- Additional integrations beyond Gmail and Google Calendar (Slack, Notion, Sheets deferred to v2)
- Conversational chat assistant interface — Mission Control dashboard timeline is the primary screen
- Voice input / speech-to-text / TTS
- Native iOS/Android apps — responsive web design covers mobile handoff
- Production cloud deployment & CI/CD infrastructure

## Context

- Target persona: Final-year university student applying to internships and jobs, receiving interview invitations, coding challenge deadlines, and recruiter emails across messy threads.
- Core failure pattern in existing tooling: Re-reading emails manually, copy-pasting calendar dates by hand, missing calendar clashes, and silent failures when emails bounce or event invitations fail.
- Hackathon depth spike: Constrained action space + strict outcome verification + transparent failure recovery.

## Constraints

- **Architecture**: Next.js App Router (single repo for frontend UI and API Route Handlers).
- **Planner Constraint**: Strict enum of 4 actions (`gmail.search`, `gmail.send`, `calendar.create`, `calendar.check`) with Zod schema validation.
- **Verification Guarantee**: Every step must pass active verification before transitioning to `done`.
- **Google OAuth**: Restricted to minimal scopes (`gmail.readonly`, `gmail.send`, `calendar.events`).
- **Reliability Guarantee**: Swappable mock mode via `DEMO_MODE=mock` to withstand network loss or API rate limits.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fixed Action Enum vs. Open Tools | Eliminates hallucinated API calls and ensures 100% verifiable steps | Pending |
| Verify-Every-Step Architecture | Solves silent agent failures, creating the key differentiator | Pending |
| Mock Adapter with `FAIL_NEXT` | Enables deterministic demonstration of error recovery and offline development | Pending |
| In-Memory State with 1s Polling | Zero database complexity for hackathon timeframe, instant live updates | Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-15 after initialization*
