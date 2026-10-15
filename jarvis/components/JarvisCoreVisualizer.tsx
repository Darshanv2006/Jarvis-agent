"use client";

import React from "react";

type VoiceState = "idle" | "listening" | "thinking" | "speaking";

interface JarvisCoreVisualizerProps {
  status: "Ready" | "Planning" | "Executing" | "Blocked" | "Verified";
  voiceState?: VoiceState;
}

interface CoreTheme {
  stroke: string;
  accent: string;
  ring: string;
  eye: string;
  eyeStroke: string;
  dropShadow: string;
  label: string;
  text: string;
}

const CORE_THEMES: Record<JarvisCoreVisualizerProps["status"], CoreTheme> = {
  Ready: {
    stroke: "#c084fc",
    accent: "#e879f9",
    ring: "rgba(168, 85, 247, 0.35)",
    eye: "#ffffff",
    eyeStroke: "#e9d5ff",
    dropShadow: "0 0 28px rgba(168, 85, 247, 0.85)",
    label: "#c084fc",
    text: "text-purple-300",
  },
  Planning: {
    stroke: "#a78bfa",
    accent: "#c4b5fd",
    ring: "rgba(139, 92, 246, 0.45)",
    eye: "#eff6ff",
    eyeStroke: "#ddd6fe",
    dropShadow: "0 0 30px rgba(139, 92, 246, 0.9)",
    label: "#a78bfa",
    text: "text-violet-300",
  },
  Executing: {
    stroke: "#818cf8",
    accent: "#a5b4fc",
    ring: "rgba(99, 102, 241, 0.5)",
    eye: "#eef2ff",
    eyeStroke: "#c7d2fe",
    dropShadow: "0 0 34px rgba(99, 102, 241, 0.95)",
    label: "#818cf8",
    text: "text-indigo-300",
  },
  Verified: {
    stroke: "#34d399",
    accent: "#6ee7b7",
    ring: "rgba(16, 185, 129, 0.45)",
    eye: "#ecfdf5",
    eyeStroke: "#a7f3d0",
    dropShadow: "0 0 32px rgba(16, 185, 129, 0.9)",
    label: "#34d399",
    text: "text-emerald-300",
  },
  Blocked: {
    stroke: "#fb7185",
    accent: "#fda4af",
    ring: "rgba(239, 68, 68, 0.45)",
    eye: "#fff1f2",
    eyeStroke: "#fecdd3",
    dropShadow: "0 0 32px rgba(239, 68, 68, 0.9)",
    label: "#fb7185",
    text: "text-rose-300",
  },
};

export function JarvisCoreVisualizer({ status, voiceState = "idle" }: JarvisCoreVisualizerProps) {
  const isExecuting = status === "Executing";

  const theme = CORE_THEMES[status];
  const { stroke, accent, ring: ringColor, eye, eyeStroke, dropShadow, label } = theme;
  const modeTextClass = theme.text;

  const isListening = voiceState === "listening";
  const isSpeaking = voiceState === "speaking";
  const isThinking = voiceState === "thinking";
  const voiceActive = isListening || isSpeaking || isThinking;

  const reactiveClass = isSpeaking
    ? "core-reacting-speak"
    : isListening || isThinking
    ? "core-reacting-listen"
    : "";

  return (
    <div className="relative flex flex-col items-center justify-center my-auto select-none py-2">
      {/* Telemetry Corner Accents */}
      <div className="absolute -top-3 left-4 text-[9px] font-mono text-purple-400/60 tracking-wider">
        CORE: <span className={`font-bold ${modeTextClass}`}>ONLINE</span> // 100%
      </div>
      <div className="absolute -top-3 right-4 text-[9px] font-mono text-purple-400/60 tracking-wider">
        {voiceActive ? (
          <>
            VOICE: <span className={`font-bold ${modeTextClass}`}>{voiceState.toUpperCase()}</span>
          </>
        ) : (
          <>
            NEURAL: <span className={`font-bold ${modeTextClass}`}>SYNCED</span>
          </>
        )}
      </div>

      <div className="relative w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] flex items-center justify-center">
        {/* Voice-reactive aura (pulses to listening/speaking) */}
        <div
          className={`absolute inset-6 rounded-full pointer-events-none transition-opacity duration-300 ${reactiveClass}`}
          style={{
            background: `radial-gradient(circle, ${ringColor} 0%, transparent 68%)`,
            opacity: voiceActive ? 1 : 0,
          }}
        />

        {/* Layer 1: Outermost Radar Ring with Segmented Ticks */}
        <div
          className="absolute inset-0 rounded-full border border-dashed animate-spin-cw pointer-events-none transition-colors duration-500"
          style={{ borderColor: ringColor }}
        />

        {/* Layer 2: Middle Segmented Arc Ring (Rotates CCW) */}
        <div
          className="absolute inset-3 rounded-full border-2 border-transparent animate-spin-ccw pointer-events-none transition-colors duration-500"
          style={{ borderTopColor: stroke, borderBottomColor: accent }}
        />

        {/* Layer 3: Concentric Thin HUD Reticle */}
        <div
          className="absolute inset-8 rounded-full border pointer-events-none transition-colors duration-500"
          style={{ borderColor: ringColor }}
        />

        {/* Layer 3b: Fast sweep arc, only while the agent is working or speaking */}
        {(isExecuting || isSpeaking || isThinking) && (
          <div
            className="absolute inset-8 rounded-full border-2 border-transparent core-sweep pointer-events-none"
            style={{ borderTopColor: accent }}
          />
        )}

        {/* Layer 4: Orbital Ring with 4 Cyber Target Crosshairs */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 340 340">
          {/* 4 Corner Crosshairs */}
          <line x1="170" y1="10" x2="170" y2="24" stroke={ringColor} strokeWidth="2" />
          <line x1="170" y1="316" x2="170" y2="330" stroke={ringColor} strokeWidth="2" />
          <line x1="10" y1="170" x2="24" y2="170" stroke={ringColor} strokeWidth="2" />
          <line x1="316" y1="170" x2="330" y2="170" stroke={ringColor} strokeWidth="2" />

          {/* Radar Tick Arcs */}
          <circle
            cx="170"
            cy="170"
            r="150"
            stroke={ringColor}
            strokeWidth="1.5"
            strokeDasharray="4 16"
            fill="none"
          />
          <circle
            cx="170"
            cy="170"
            r="120"
            stroke={ringColor}
            strokeWidth="1"
            strokeDasharray="2 8"
            fill="none"
          />
        </svg>

        {/* Center Stage: High-Fidelity Movie-Grade Iron Man Mask Vector */}
        <div className="relative z-10 w-44 h-52 sm:w-48 sm:h-56 flex items-center justify-center animate-neon-breathing">
          <svg
            viewBox="0 0 240 280"
            className="w-full h-full transition-[filter] duration-500"
            style={{ filter: `drop-shadow(${dropShadow})` }}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Eye Intense Glow Filter */}
              <filter id="eyeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Helmet Gradient Fill */}
              <linearGradient id="helmetGrad" x1="120" y1="20" x2="120" y2="260" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
                <stop offset="100%" stopColor={accent} stopOpacity="0.04" />
              </linearGradient>

              {/* Faceplate Accent */}
              <linearGradient id="faceplateGrad" x1="120" y1="60" x2="120" y2="220" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={accent} stopOpacity="0.2" />
                <stop offset="100%" stopColor={stroke} stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* 1. Main Outer Cranium & Helmet Silhouette */}
            <path
              d="M120 18 C78 18 52 42 46 80 C40 120 44 165 52 195 L68 235 L88 255 L120 262 L152 255 L172 235 L188 195 C196 165 200 120 194 80 C188 42 162 18 120 18 Z"
              stroke={stroke}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="url(#helmetGrad)"
            />

            {/* 2. Top Forehead Crown Plates */}
            <path
              d="M86 42 L120 32 L154 42 L150 72 L120 78 L90 72 Z"
              stroke={accent}
              strokeWidth="2.5"
              fill="url(#faceplateGrad)"
            />
            <line x1="120" y1="32" x2="120" y2="78" stroke={stroke} strokeWidth="2" />

            {/* 3. Temple & Brow Ridge Lines */}
            <path
              d="M58 84 L90 72 L120 78 L150 72 L182 84"
              stroke={stroke}
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* 4. Brow to Cheekbone Structural Cuts */}
            <path
              d="M62 88 L86 112 L78 152 L54 168 L48 124 Z"
              stroke={accent}
              strokeWidth="2"
              fill="url(#helmetGrad)"
            />
            <path
              d="M178 88 L154 112 L162 152 L186 168 L192 124 Z"
              stroke={accent}
              strokeWidth="2"
              fill="url(#helmetGrad)"
            />

            {/* 5. Center Nose Bridge & Cheek Transitions */}
            <path
              d="M86 112 L120 122 L154 112 L148 160 L120 166 L92 160 Z"
              stroke={stroke}
              strokeWidth="2.2"
              fill="url(#faceplateGrad)"
            />

            {/* 6. Authentic Angular Marvel Iron Man Glowing Eyes */}
            <polygon
              points="68,114 104,120 100,132 68,124"
              fill={eye}
              stroke={eyeStroke}
              strokeWidth="1.5"
              filter="url(#eyeGlow)"
            />
            <polygon
              points="172,114 136,120 140,132 172,124"
              fill={eye}
              stroke={eyeStroke}
              strokeWidth="1.5"
              filter="url(#eyeGlow)"
            />

            {/* Horizontal Eye Lens Flare Light Streak */}
            <line
              x1="52"
              y1="120"
              x2="188"
              y2="120"
              stroke={eye}
              strokeWidth="1.2"
              strokeOpacity="0.8"
              filter="url(#eyeGlow)"
            />

            {/* 7. Center Nose Vent Lines */}
            <path d="M120 122 L120 166" stroke={accent} strokeWidth="2" strokeDasharray="3 3" />

            {/* 8. Lower Jaw & Geometric Chin Plate */}
            <path
              d="M92 166 L120 162 L148 166 L142 208 L120 224 L98 208 Z"
              stroke={stroke}
              strokeWidth="2.8"
              strokeLinejoin="round"
              fill="url(#faceplateGrad)"
            />
            <line x1="104" y1="184" x2="136" y2="184" stroke={accent} strokeWidth="2" />
            <line x1="108" y1="196" x2="132" y2="196" stroke={stroke} strokeWidth="2" />

            {/* 9. Chin Apex Bottom Cut */}
            <path
              d="M106 226 L120 248 L134 226"
              stroke={accent}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Futuristic Glowing Horizon Bar & JARVIS Typography */}
      <div className="relative mt-2 text-center">
        <h3 className="text-lg sm:text-xl font-black tracking-[0.6em] text-white font-mono pl-3" style={{ textShadow: `0 0 12px ${label}, 0 0 24px ${ringColor}` }}>
          J A R V I S
        </h3>
        <div className="relative w-36 h-1 mx-auto mt-1 flex items-center justify-center">
          <div
            className="w-full h-0.5 transition-colors duration-500"
            style={{ background: `linear-gradient(90deg, transparent, ${stroke}, transparent)`, boxShadow: `0 0 12px ${label}` }}
          />
          <div className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
        </div>
      </div>

      {/* Bottom Telemetry Accents */}
      <div className="flex items-center justify-between w-full max-w-[280px] mt-2 text-[9px] font-mono text-purple-400/60 tracking-widest">
        <span>FREQ: 142.8 MHz</span>
        <span className={`${isExecuting ? "animate-pulse" : ""} font-bold ${modeTextClass}`}>
          MODE: {status.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
