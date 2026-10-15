---
phase: 1
slug: mission-control-ui
status: approved
shadcn_initialized: false
preset: dark-mission-control
created: 2026-10-15
---

# UI Design Contract: Deadline Wrangler Mission Control

> Visual and interaction contract for the Mission Control dashboard (`app/page.tsx`).

---

## 1. Design System & Theme

| Property | Value |
|----------|-------|
| Theme | Dark Mission Control / Glassmorphism Cockpit |
| Typography Primary | Inter / Outfit (sans-serif) |
| Typography Code/Data | JetBrains Mono / Fira Code (monospace) |
| Icon Library | Lucide React (`lucide-react`) |
| Color System | Slate/Zinc 950 base with Emerald, Violet, Rose & Amber accents |

### Color Tokens

- **Background Base**: `#090D16` (Deep space dark)
- **Card / Surface**: `rgba(18, 24, 38, 0.75)` with `backdrop-filter: blur(16px)` and border `1px solid rgba(255, 255, 255, 0.08)`
- **Accent Primary**: `#6366F1` (Indigo / Electric Violet for agent planning)
- **Success / Verified**: `#10B981` (Emerald green for "✓ verified" tag and completed steps)
- **Warning / Blocked**: `#F59E0B` (Amber gold for "Needs you" card and intervention triggers)
- **Failure**: `#EF4444` (Rose crimson for failed attempts and bounce warnings)
- **Muted Text**: `#94A3B8`
- **Headings / High Contrast**: `#F8FAFC`

---

## 2. Layout & Components Breakdown

### A. Cockpit Header Bar
- **App Title**: `DEADLINE WRANGLER` with a subtle pulsing radar / mission icon and subtitle: `"Autonomous Agent · Gmail & Calendar"`.
- **Demo Controls Drawer**:
  - `DEMO_MODE` switch: `Mock` vs `Real Google APIs` (default: `Mock`).
  - `FAIL_NEXT` toggle: `[ Simulate Failure On/Off ]` (Highlights in amber when enabled; guarantees step 3 fails for judging demo).
  - `QR Phone View` button: Opens modal with QR code pointing to current URL for dual-screen demo handoff.

### B. Goal Input Command Bar
- **Central Search / Command Capsule**:
  - Large input field with placeholder: `"e.g. Schedule Google interview deadline from my inbox and block calendar..."`
  - Action button: `"Deploy Agent"` with rocket/sparkle icon and loading spinner during planning.
- **Quick-Fill Goal Pills** (for instant 1-click testing):
  - Pill 1: `"Prep Google SWE Interview deadline"`
  - Pill 2: `"Find Stripe offer letter & verify calendar free time"`
  - Pill 3: `"Follow up on Datadog recruiter email"`

### C. Live Execution Timeline (`GET /api/task/:id` Polling)
- Displays as a vertical sequence of glowing cards connected by a status guide rail.
- **Per-step Card Structure**:
  - **Left**: Step number circle + status icon:
    - `pending`: Muted border, gray dash
    - `running`: Pulsing indigo glow + spinning loader
    - `done`: Solid emerald checkmark + bright `"✓ verified"` pill badge
    - `failed`: Rose exclamation mark
    - `blocked`: Amber warning badge + `"Action Required"` tag
  - **Middle**:
    - Step Title: Plain English intent (e.g., `"Search inbox for Google interview invitations"`)
    - Action Type badge: `gmail.search` | `gmail.send` | `calendar.create` | `calendar.check`
    - Parameter summary: Target query, dates, recipients (formatted in monospace pill tags)
  - **Right**:
    - Verification outcome chip: e.g. `"Message in Sent folder"` | `"No calendar overlap"` | `"Date extracted: Oct 24"`
    - Expandable toggle to view raw payload / logs.

### D. The "Needs You" Intervention Card (The Demo Moment)
- Triggers when any step transitions to state: `blocked`.
- **Card Design**:
  - Distinct amber/crimson glowing border with warning alert icon.
  - Header: `"⚠️ Step Failed: Action Required"`
  - Diagnostic reason: Why it broke (e.g. `"Recruiter email 'recruiter@amazn-careers.fake' bounced — domain does not exist."`)
  - Agent Suggestion: `"LLM Suggested Fix: Update recipient to 'recruiter@amazon.com' and retry."`
  - Interactive Action Buttons:
    1. **Retry with Suggestion** (Primary emerald button): Posts `{ action: 'retry' }` to `/api/task/:id/resolve`
    2. **Edit Parameters** (Secondary button): Opens an inline form to manually fix email/date params, then submits `{ action: 'edit', updatedParams }`
    3. **Skip Step** (Ghost button): Submits `{ action: 'skip' }` and continues remaining steps.

### E. Dual-Screen QR Code Modal
- Generates a scannable QR code (`qrcode.react`) with the network URL.
- Allows judging demo on mobile device simultaneously without reloading state.

---

## 3. Client State & Polling Contract

1. **Submit Goal**:
   ```typescript
   POST /api/plan
   Body: { goal: string }
   Response: { taskId: string, steps: Step[] }
   ```
2. **Poll Status** (every 1000ms while status is not `done` or `blocked`):
   ```typescript
   GET /api/task/:taskId
   Response: {
     id: string;
     status: 'pending' | 'running' | 'done' | 'failed' | 'blocked';
     activeStepIndex: number;
     needsYou?: {
       stepId: string;
       reason: string;
       suggestedFix: string;
       params: Record<string, any>;
     };
     steps: Array<{
       id: string;
       title: string;
       action: 'gmail.search' | 'gmail.send' | 'calendar.create' | 'calendar.check';
       params: Record<string, any>;
       state: 'pending' | 'running' | 'done' | 'failed' | 'blocked';
       result?: any;
       verification?: string;
       error?: string;
     }>;
   }
   ```
3. **Resolve Blocked Step**:
   ```typescript
   POST /api/task/:taskId/resolve
   Body: { stepId: string, action: 'retry' | 'edit' | 'skip', updatedParams?: any }
   ```

---

## 4. Micro-Interactions & Animation Specs
- **Status transitions**: Smooth CSS transitions (0.3s ease-out) on border colors and background glow.
- **Active Step**: Subtle CSS breathing animation (`animation: pulse 2s infinite`).
- **Verified Badge**: Emerald pop-in effect with spring easing.
- **Empty State**: Clean placeholder graphic with instruction: `"Enter your deadline goal above to watch the agent plan, execute, and verify live."`
