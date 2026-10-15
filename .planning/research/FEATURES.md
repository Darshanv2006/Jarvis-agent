# Features Research

**Domain:** Autonomous Productivity & Mission Control (Email & Calendar Agent)
**Researched:** 2026-10-15
**Confidence:** HIGH

## Feature Taxonomy

### Table Stakes (Must Have for Hackathon v1)

- **Natural Language Goal Input**: Text input accepting unstructured student intent ("Prep for my Google interview next Tuesday and put it on my calendar").
- **Fixed Action Enum Planning**: LLM plans decomposed solely into four verified actions (`gmail.search`, `gmail.send`, `calendar.create`, `calendar.check`).
- **Real-Time Step Timeline**: Visual execution board showing step progress, current state (`pending`, `running`, `done`, `failed`, `blocked`), and verification results.
- **Active Post-Execution Verification**: Verifier independently checks reality (e.g. confirms message is in Sent folder, checks event ID and free/busy clash).
- **Graceful Failure & "Needs you" Card**: Single retry attempt with LLM-suggested fix; if failure persists, block execution and present a card with options to Retry, Edit params, or Skip.
- **Offline / Mock Mode**: Toggleable demo mode with 10 seeded recruiter emails and deterministic `FAIL_NEXT` trigger.
- **Mobile QR Handoff**: Quick responsive view on mobile phone for dual-device live demo.

### Differentiators (Competitive Edge)

- **Failure Visibility (The Anti-Hallucination Agent)**: Unlike agents that pretend to succeed or fail silently, this agent proves its work and alerts the user transparently with context.
- **Deterministic Demo Switch**: One-click simulation of an email bounce or calendar conflict to showcase the recovery loop live during judging.
- **Minimal OAuth Scope Footprint**: Strict least-privilege scopes (`gmail.readonly`, `gmail.send`, `calendar.events`).

### Anti-Features (Explicitly NOT Building)

- **Open-Ended Tool Discovery**: No arbitrary bash commands, browsing, or unbound tool creation that hallucinate mid-demo.
- **Multi-Tenant User Login & Database**: No unnecessary database infrastructure or OAuth token database storage. Single user local session.
- **Chat Interface**: Not a chat bot. A mission-control cockpit with clear step progression.
- **Voice / Native Mobile**: No mobile native builds or speech interfaces that introduce latency and hardware flakiness.
