# JARVIS Mission Control — Autonomous Personal AI Agent

An autonomous AI Mission Control Cockpit with an Iron Man / Cyberpunk aesthetic. Features live integration with Gmail (IMAP & SMTP), an interactive Mission Calendar with conflict detection, real-time voice streaming with LiveKit, and a visual human-like autonomous co-pilot execution sequence.

---

## Key Features

- **Cyberpunk Holographic Cockpit**: Neon HUD interface with live clock, status metrics, and reactive Arc Reactor visualizer.
- **Autonomous Human-Like Co-Pilot**:
  - Automatically pops up the **Gmail Scanner** interface to inspect inbox context.
  - Automatically pops up the **Mission Calendar** interface, selecting the date and locking the event slot.
  - Automatically dispatches real HTML confirmation receipts via **Gmail SMTP**.
  - Displays the center-screen completion modal: *"Okay, you are done with what you said!"*.
- **Real Gmail Integration**:
  - **IMAP SSL**: Connects via `imapflow` to read and parse real inbox messages and deadlines.
  - **SMTP (Nodemailer)**: Sends formatted confirmation emails over `smtp.gmail.com:465`.
- **Mission Calendar with Conflict Detection**:
  - Prevents double-booking with `checkCalendarSlot`.
  - Prunes duplicate stale test entries automatically.
- **LiveKit Voice Assistant**:
  - Real-time voice agent powered by LiveKit WebRTC and OpenAI models.
- **Dual-Screen Phone Sync**:
  - Dynamic QR code generation for controlling the cockpit from a mobile device during presentations.

---

## Tech Stack

- **Frontend**: Next.js 16+ (App Router, Turbopack), Tailwind CSS, Lucide React
- **Email Protocol**: `imapflow`, `mailparser`, `nodemailer`
- **Voice Agent**: Python 3.11+, `livekit-agents`, `silero`, `openai`
- **Language**: TypeScript (Zero error compilation)

---

## Quick Start

### 1. Web Application (`jarvis/`)

```bash
cd jarvis
npm install
cp .env.example .env.local
# Add your LiveKit and Gmail credentials in .env.local
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the cockpit.

### 2. LiveKit Voice Agent (`livekit-voice-agent/`)

```bash
cd livekit-voice-agent
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env.local
python agent.py dev
```

---

## License

MIT License. Designed and built for autonomous AI agent workflows.
