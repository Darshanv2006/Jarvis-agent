<!-- GSD:project-start source:PROJECT.md -->
## Project

**Deadline Wrangler (Jarvis)**

A mission-control web app for university students juggling internship and interview deadlines across email and calendar. A student inputs one goal in plain English, and an autonomous agent plans and executes it across Gmail and Google Calendar, verifies every step actually happened, and surfaces transparent failure recovery via a "Needs you" card instead of failing silently.

**Core Value:** Reliable, verified goal execution across Gmail & Google Calendar with guaranteed failure visibility — when a step fails, the agent notices, retries with an LLM-suggested fix, and surfaces human intervention rather than failing silently.

### Constraints

- **Architecture**: Next.js App Router (single repo for frontend UI and API Route Handlers).
- **Planner Constraint**: Strict enum of 4 actions (`gmail.search`, `gmail.send`, `calendar.create`, `calendar.check`) with Zod schema validation.
- **Verification Guarantee**: Every step must pass active verification before transitioning to `done`.
- **Google OAuth**: Restricted to minimal scopes (`gmail.readonly`, `gmail.send`, `calendar.events`).
- **Reliability Guarantee**: Swappable mock mode via `DEMO_MODE=mock` to withstand network loss or API rate limits.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15+ / 16 (App Router) | Unified Fullstack Web App | Single repo, zero-config API route handlers, React Server Components + Client interactive dashboard |
| TypeScript | 5+ | Static typing & Contracts | Critical for strict schema validation across planner, executor, and adapters |
| Tailwind CSS / Vanilla CSS | Latest | Modern Mission-Control UI | Rich dark mode, cyberpunk/sleek glassmorphism, micro-animations |
| Zod | 3.23+ | Schema Validation | Enforces rigid output parsing on LLM plans and adapter parameters |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| googleapis | Latest | Official Google SDK | Gmail API & Google Calendar API interactions |
| openai / ai | Latest | LLM API Client | Structured JSON completions for planner and error recovery |
| lucide-react | Latest | UI Icons | Status icons (check, alert, loader, warning, calendar, mail) |
| qrcode.react | Latest | Presentation QR Code | Dual-screen presentation (mobile phone handoff) |
### Development Tools & Adapters
| Tool | Purpose | Notes |
|------|---------|-------|
| Mock Adapter (`lib/adapters/mock.ts`) | Offline & deterministic test harness | Has 10 pre-seeded recruiter emails, simulated calendar, `FAIL_NEXT` toggle |
| OAuth Script (`scripts/oauth-setup.mjs`) | One-time token generation | Generates Google OAuth refresh token for Desktop App client |
| Seed Script (`scripts/seed.mjs`) | Inbox seeding | Sends 10 realistic recruiter messages to real inbox |
## Environment Configuration
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
