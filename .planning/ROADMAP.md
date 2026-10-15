# Roadmap: Deadline Wrangler (Jarvis)

## Overview

This roadmap delivers an autonomous, verifiable student deadline agent across five structured phases aligned with hackathon timeline gates. Starting from a mock-driven Mission Control dashboard (H+1.5 gate), through constrained LLM planning and rigorous verification on real Google APIs (H+3 gate), to the critical failure recovery engine with "Needs you" cards (H+5 gate), and concluding with mobile presentation polish and test matrix verification (H+6 gate).

## Phases

- [ ] **Phase 1: Foundation & Mock Mission Control** - Next.js scaffolding, core TypeScript contracts, in-memory mock adapter with 10 seeded recruiter emails, and live Mission Control dashboard playing fake-data walkthrough end-to-end (H+1.5 Gate).
- [ ] **Phase 2: Constrained Planner & Step Execution Engine** - Zod-enforced 4-action planner (`gmail.search`, `gmail.send`, `calendar.create`, `calendar.check`), template fallback, and in-memory execution loop with 1s state polling.
- [ ] **Phase 3: Verification Engine & Real Google Adapters** - Verification checks per action (Sent box, event query, clash check), Google OAuth bootstrap script, seed script, and real Gmail/Calendar API adapters (H+3 Gate).
- [ ] **Phase 4: Failure Engine & "Needs You" Intervention** - LLM fix suggestions, 1-retry policy, blocked state transitions, and interactive UI "Needs you" resolution card (`POST /api/task/:id/resolve`) (H+5 Gate).
- [ ] **Phase 5: Mobile QR Handoff, Test Matrix & Demo Hardening** - Responsive mobile view with QR code, top-10 test matrix validation, demo rehearsal with deterministic `FAIL_NEXT`, and clean clone validation (H+6 Gate).

## Phase Details

### Phase 1: Foundation & Mock Mission Control
**Goal**: Establish Next.js repo, freeze API/adapter contracts, implement mock adapter with seeded emails, and provide a sleek Mission Control UI that plays a fake-data timeline end-to-end.
**Depends on**: Nothing (first phase)
**Requirements**: ADAPT-01, ADAPT-03, ADAPT-04, UI-01, UI-02, UI-04
**Success Criteria** (what must be TRUE):
  1. Next.js app boots cleanly with zero configuration errors and dark mission-control styling.
  2. Core TypeScript interfaces for adapters and tasks are frozen in `lib/adapters/types.ts`.
  3. Mock adapter serves 10 realistic recruiter emails and tracks calendar events in memory.
  4. User can enter a goal and observe the visual timeline cycle through `pending`, `running`, and `done` with verified badges.
  5. User can toggle `DEMO_MODE` and test `FAIL_NEXT` state directly from the UI.
**Plans**: 3 plans

Plans:
- [ ] 01-01: Next.js project setup, dependencies, CSS design tokens, and core TypeScript contract definitions (`lib/adapters/types.ts`).
- [ ] 01-02: In-memory mock adapter (`lib/adapters/mock.ts`) with 10 seeded recruiter emails, fake event store, and `FAIL_NEXT` flag.
- [ ] 01-03: Mission Control dashboard (`app/page.tsx`) with goal input, live execution timeline, status badges, and demo drawer.

### Phase 2: Constrained Planner & Step Execution Engine
**Goal**: Build the constrained LLM planner that parses natural language goals into a strict 4-action enum and executes steps sequentially in an in-memory runner.
**Depends on**: Phase 1
**Requirements**: PLAN-01, PLAN-02, PLAN-03, EXEC-01, EXEC-02, EXEC-03
**Success Criteria** (what must be TRUE):
  1. `POST /api/plan` takes unstructured goal text and outputs schema-validated steps conforming only to `gmail.search`, `gmail.send`, `calendar.create`, and `calendar.check`.
  2. If the LLM call fails or times out, planner reliably falls back to deterministic goal templates.
  3. `GET /api/task/:id` returns live step status, active step index, timestamps, and parameters.
  4. Step executor sequentially triggers actions through the adapter and transitions states accurately.
**Plans**: 2 plans

Plans:
- [ ] 02-01: Zod action schemas, OpenAI-compatible prompt template, and fallback template engine in `lib/planner.ts` with `POST /api/plan`.
- [ ] 02-02: In-memory task state store and step execution runner in `lib/executor.ts` with `GET /api/task/:id`.

### Phase 3: Verification Engine & Real Google Adapters
**Goal**: Deliver the project's depth spike by adding real post-execution verification checks and integrating real Gmail and Google Calendar APIs via OAuth 2.0.
**Depends on**: Phase 2
**Requirements**: VERIF-01, VERIF-02, VERIF-03, VERIF-04, ADAPT-02, TOOL-01, TOOL-02
**Success Criteria** (what must be TRUE):
  1. Verifier independently confirms sent emails exist in the user's `SENT` box.
  2. Verifier confirms created calendar events exist and checks for schedule collisions.
  3. `scripts/oauth-setup.mjs` generates refresh token with minimal scopes (`gmail.readonly`, `gmail.send`, `calendar.events`).
  4. Real adapters in `lib/adapters/gmail.ts` and `lib/adapters/gcal.ts` execute live operations when `DEMO_MODE=real`.
  5. Seeding script (`scripts/seed.mjs`) injects 10 realistic recruiter emails into the user's inbox for testing.
**Plans**: 3 plans

Plans:
- [ ] 03-01: Implementation of verification rules in `lib/verifier.ts` for all 4 action types.
- [ ] 03-02: OAuth setup script (`scripts/oauth-setup.mjs`) and inbox seeder (`scripts/seed.mjs`).
- [ ] 03-03: Real Google API adapters (`lib/adapters/gmail.ts`, `lib/adapters/gcal.ts`) connecting to Gmail and Calendar.

### Phase 4: Failure Engine & "Needs You" Intervention
**Goal**: Implement the signature demo moment — automatic LLM fix suggestions, 1-retry policy, and halting on persistent failure with an interactive "Needs you" card.
**Depends on**: Phase 3
**Requirements**: RECOV-01, RECOV-02, RECOV-03, UI-03
**Success Criteria** (what must be TRUE):
  1. When a step fails verification, the LLM generates a suggested fix (e.g. corrected email address or alternative time slot) and auto-retries once.
  2. If the retry fails, execution halts cleanly, marking the step and task as `blocked`.
  3. The Mission Control UI surfaces a prominent "Needs you" card with failure explanation and action buttons (`Retry`, `Edit`, `Skip`).
  4. `POST /api/task/:id/resolve` accepts user choice, applies overrides, and resumes execution seamlessly.
**Plans**: 2 plans

Plans:
- [ ] 04-01: Recovery logic in `lib/executor.ts` handling LLM fix suggestions, 1-retry limitation, and blocked state transitions.
- [ ] 04-02: UI "Needs you" card in `app/page.tsx` and resolution endpoint `POST /api/task/:id/resolve`.

### Phase 5: Mobile QR Handoff, Test Matrix & Demo Hardening
**Goal**: Ensure mobile dual-screen handoff, validate against the top-10 test matrix, document instructions for a clean clone, and freeze for demo.
**Depends on**: Phase 4
**Requirements**: UI-05, QA-01
**Success Criteria** (what must be TRUE):
  1. Mission Control is fully responsive and displays a QR code allowing a judge or teammate to monitor or trigger tasks from a smartphone.
  2. All top-10 test cases pass (Happy path, Empty goal, No matching email, Wrong address bounce, Calendar conflict, etc.).
  3. Clean clone test succeeds with zero secrets in git and simple `npm run dev` startup.
  4. 2:30 demo walkthrough is practiced and verified against the deterministic `FAIL_NEXT` toggle.
**Plans**: 2 plans

Plans:
- [ ] 05-01: Mobile layout optimization and QR code modal/drawer for phone access over local network.
- [ ] 05-02: Test matrix execution, documentation (`README.md`, `.env.example`), security audit (no secrets in git), and demo rehearsal script.
