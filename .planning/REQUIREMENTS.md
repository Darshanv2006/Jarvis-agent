# Requirements: Deadline Wrangler (Jarvis)

**Defined:** 2026-10-15
**Core Value:** Reliable, verified goal execution across Gmail & Google Calendar with guaranteed failure visibility — when a step fails, the agent notices, retries with an LLM-suggested fix, and surfaces human intervention rather than failing silently.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Planning Engine
- [ ] **PLAN-01**: User can submit a natural language goal via `POST /api/plan` and receive a structured task ID with validated steps.
- [ ] **PLAN-02**: Planner strictly outputs actions conforming to the 4-action enum (`gmail.search`, `gmail.send`, `calendar.create`, `calendar.check`) validated via Zod schema.
- [ ] **PLAN-03**: Planner includes deterministic template fallback when LLM API is unavailable or returns malformed output.

### Execution & State Management
- [ ] **EXEC-01**: Step runner sequentially executes planned steps, managing states: `pending`, `running`, `done`, `failed`, `blocked`.
- [ ] **EXEC-02**: In-memory task state store maintains full task lifecycle and provides updates via `GET /api/task/:id`.
- [ ] **EXEC-03**: Task runner updates execution outputs, timestamps, and active step index in real time.

### Verification Engine
- [ ] **VERIF-01**: `gmail.search` verification confirms at least one result was found and an actionable deadline date/time was extracted.
- [ ] **VERIF-02**: `gmail.send` verification actively confirms the sent message exists in the user's `SENT` box.
- [ ] **VERIF-03**: `calendar.create` verification actively queries the created event ID and verifies no scheduling conflict occurred.
- [ ] **VERIF-04**: `calendar.check` verification confirms free/busy status was successfully retrieved for the target window.

### Failure Recovery & Human-in-the-Loop
- [ ] **RECOV-01**: On verification failure, system queries LLM for a recommended fix and executes exactly one automatic retry.
- [ ] **RECOV-02**: If retry fails, system halts execution, marks task as `blocked`, and highlights the failed step.
- [ ] **RECOV-03**: User can resolve a blocked step via `POST /api/task/:id/resolve` with actions `retry`, `edit`, or `skip`.

### Adapters & Mock Mode
- [ ] **ADAPT-01**: Uniform adapter interface implemented for both real Google APIs and mock testing provider.
- [ ] **ADAPT-02**: Real adapter connects to Gmail API (`gmail.readonly`, `gmail.send`) and Calendar API (`calendar.events`) with OAuth 2.0.
- [ ] **ADAPT-03**: Mock adapter simulates 10 seeded recruiter emails and calendar events with a toggleable `FAIL_NEXT` mode.
- [ ] **ADAPT-04**: Environment variable `DEMO_MODE` dynamically switches between `real` and `mock` adapters.

### Mission Control UI
- [ ] **UI-01**: Single-page Mission Control dashboard with goal input bar and example goal quick-fills.
- [ ] **UI-02**: Live execution timeline polling `GET /api/task/:id` every 1s, displaying step icons, titles, and real-time state badges.
- [ ] **UI-03**: Interactive "Needs you" resolution card displaying error details, parameter editor, and action buttons (`Retry`, `Edit`, `Skip`).
- [ ] **UI-04**: Demo control drawer with switches for `DEMO_MODE` (Real/Mock) and `FAIL_NEXT` simulation trigger.
- [ ] **UI-05**: Responsive mobile layout with dual-screen presentation QR code for live demo.

### Tooling & Setup
- [ ] **TOOL-01**: OAuth bootstrap script (`scripts/oauth-setup.mjs`) for generating Google OAuth refresh tokens.
- [ ] **TOOL-02**: Seed script (`scripts/seed.mjs`) to populate user's test inbox with 10 realistic recruiter emails.

### QA
- [ ] **QA-01**: Demo robustness — top-10 test matrix passes (incl. forced bounce → retry → Needs-you, calendar conflict caught, restart mid-task shows interrupted), clean clone runs from README alone, no secrets in git history.

## v2 Requirements

Deferred to future releases after the hackathon:
- **AUTH-01**: Multi-user login and session authentication.
- **PERSIST-01**: PostgreSQL / Supabase storage for long-term task history.
- **INT-01**: Additional service integrations (Slack, Notion, Google Sheets).
- **VOICE-01**: Voice goal input and conversational voice feedback.

## Out of Scope

| Feature | Reason |
|---------|--------|
| User Auth / Login | Single-user local setup removes friction and setup delays for 8-hour hackathon |
| External Databases | In-memory task state provides faster execution and zero deployment barriers |
| Main Chat Interface | Mission Control dashboard timeline provides superior visibility and control over chat |
| Native Mobile App | Responsive web app accessible via local IP / QR code satisfies presentation needs |
| CI/CD & Cloud Hosting | Local execution ensures 100% demo stability and zero cloud latency |

## Traceability

Which phases cover which requirements. (Updated during roadmap creation)

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAN-01 | Phase 2 | Pending |
| PLAN-02 | Phase 2 | Pending |
| PLAN-03 | Phase 2 | Pending |
| EXEC-01 | Phase 2 | Pending |
| EXEC-02 | Phase 2 | Pending |
| EXEC-03 | Phase 2 | Pending |
| VERIF-01 | Phase 3 | Pending |
| VERIF-02 | Phase 3 | Pending |
| VERIF-03 | Phase 3 | Pending |
| VERIF-04 | Phase 3 | Pending |
| RECOV-01 | Phase 4 | Pending |
| RECOV-02 | Phase 4 | Pending |
| RECOV-03 | Phase 4 | Pending |
| ADAPT-01 | Phase 1 | Pending |
| ADAPT-02 | Phase 3 | Pending |
| ADAPT-03 | Phase 1 | Pending |
| ADAPT-04 | Phase 1 | Pending |
| UI-01 | Phase 1 | Pending |
| UI-02 | Phase 1 | Pending |
| UI-03 | Phase 4 | Pending |
| UI-04 | Phase 1 | Pending |
| UI-05 | Phase 5 | Pending |
| TOOL-01 | Phase 3 | Pending |
| TOOL-02 | Phase 3 | Pending |
| QA-01 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0 ✓

---
*Requirements defined: 2026-10-15*
*Last updated: 2026-10-15 after roadmap creation*
