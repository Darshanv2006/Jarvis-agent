# Deadline Wrangler (Jarvis)

## What This Is

A mission-control web app for university students juggling internship and interview deadlines across email and calendar. A student inputs one goal in plain English, and an autonomous agent plans and executes it across Gmail and Google Calendar, verifies every step actually happened, and surfaces transparent failure recovery via a "Needs you" card instead of failing silently.

## Core Value

Reliable, verified goal execution across Gmail & Google Calendar with guaranteed failure visibility — when a step fails, the agent notices, retries with an LLM-suggested fix, and surfaces human intervention rather than failing silently.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **UI-01**: Mission Control UI with goal prompt, live step execution timeline, and step status indicators (`pending`, `running`, `done`, `failed`, `blocked`)
- [ ] **UI-02**: "Needs you" intervention card allowing users to retry, edit parameters, or skip failed steps
- [ ] **UI-03**: Mobile-responsive view accessible via QR code for dual-screen demo presentation
- [ ] **PLAN-01**: Schema-constrained planner (`POST /api/plan`) generating validated step sequences from natural language goals using a fixed action enum
- [ ] **EXEC-01**: Step execution loop (`lib/executor.ts`) with sequential step execution, state polling (`GET /api/task/:id`), and error interception
- [ ] **VERIF-01**: Verification engine (`lib/verifier.ts`) performing deterministic verification checks for every action type
- [ ] **RECOV-01**: Failure recovery engine suggesting LLM fixes, executing 1 auto-retry, and halting to blocked state on secondary failure (`POST /api/task/:id/resolve`)
- [ ] **ADAPT-01**: Google API adapters for Gmail (`gmail.search`, `gmail.send`) and Calendar (`calendar.create`, `calendar.check`) with OAuth 2.0
- [ ] **MOCK-01**: Mock adapter (`DEMO_MODE=mock`) with 10 pre-seeded recruiter emails, simulated calendar state, and on-demand `FAIL_NEXT` failure toggle
- [ ] **TOOL-01**: Setup and seeding scripts (`scripts/oauth-setup.mjs`, `scripts/seed.mjs`) for rapid team bootstrapping

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
