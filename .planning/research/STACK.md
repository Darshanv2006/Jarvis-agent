# Stack Research

**Domain:** Autonomous Productivity & Mission Control (Email & Calendar Agent)
**Researched:** 2026-10-15
**Confidence:** HIGH

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

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=
DEMO_MODE=real # or "mock"
```
