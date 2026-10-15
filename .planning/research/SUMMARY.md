# Research Summary

**Domain:** Autonomous Productivity & Mission Control (Email & Calendar Agent)
**Synthesized:** 2026-10-15
**Confidence:** HIGH

## Executive Summary

Deadline Wrangler (Jarvis) solves the chronic problem faced by university students who manually track recruiter emails and internship deadlines across email and calendar. Rather than an open-ended chatbot that risks hallucination, Deadline Wrangler enforces a tightly constrained 4-action planner with mandatory post-execution verification and transparent human-in-the-loop failure recovery.

## Key Recommendations

### Stack
- **Framework:** Next.js App Router with TypeScript.
- **Planner Validation:** Zod with OpenAI-compatible chat completions (and keyword-based deterministic template fallback).
- **Google Integrations:** `googleapis` with limited scopes (`gmail.readonly`, `gmail.send`, `calendar.events`).
- **Resilience:** In-memory mock adapter (`DEMO_MODE=mock`) with 10 pre-seeded recruiter emails and a deterministic failure toggle (`FAIL_NEXT`).
- **State Store:** In-memory state polled at 1-second intervals via `GET /api/task/:id`.

### Core Flow
1. **Goal Input:** Student enters natural language objective.
2. **Planning:** `POST /api/plan` decomposes goal into strict action steps (`gmail.search`, `gmail.send`, `calendar.create`, `calendar.check`).
3. **Execution & Verification:** Step executes → `lib/verifier.ts` checks ground truth (SENT folder, event query, free/busy check).
4. **Resilience & Recovery:** If verification passes → `done`. If verification fails → LLM suggests fix, retries once → if still failing, marks `blocked` and pops a "Needs you" card for student resolution (`Retry`, `Edit`, `Skip`).

### Critical Pitfalls to Avoid
- **Never allow unverified success**: Every step must pass verification before marking `done`.
- **Never rely exclusively on venue internet**: Mock mode with seeded data guarantees a smooth 2.5-minute demo on stage.
- **Never build unnecessary databases or auth**: In-memory state meets all hackathon requirements.
