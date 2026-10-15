"use client";

import React, { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, Volume2 } from "lucide-react";

interface VoiceAssistantProps {
  onTranscript?: (text: string) => void;
  onStatusChange?: (status: "idle" | "listening" | "thinking" | "speaking") => void;
}

// Minimal Web Speech API typings (not present in the default TS DOM lib)
interface SpeechRecognitionAlternative {
  transcript: string;
}
interface SpeechRecognitionResult {
  0: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

// Question-type asks get answered only; imperative asks also trigger a deploy.
function isActionableGoal(text: string): boolean {
  const q = text.toLowerCase();
  return /(schedule|book|add|create|block|remind|set up|sync|deploy|plan|follow up|put .* on)/.test(q);
}

export function VoiceAssistant({ onTranscript, onStatusChange }: VoiceAssistantProps) {
  const [listening, setListening] = useState<boolean>(false);
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [reply, setReply] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [mounted, setMounted] = useState<boolean>(false);
  const [supported, setSupported] = useState<boolean>(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  React.useEffect(() => {
    setMounted(true);
    setSupported(Boolean(getRecognitionCtor() !== null && "speechSynthesis" in window));
  }, []);

  const isVoiceEnabled = mounted && supported;

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.02;
      utterance.pitch = 0.9;
      utterance.volume = 1;
      utterance.onstart = () => {
        setSpeaking(true);
        onStatusChange?.("speaking");
      };
      utterance.onend = () => {
        setSpeaking(false);
        onStatusChange?.("idle");
      };
      utterance.onerror = () => {
        setSpeaking(false);
        onStatusChange?.("idle");
      };
      window.speechSynthesis.speak(utterance);
    },
    [onStatusChange]
  );

  const handleResult = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean) return;
      setTranscript(clean);

      // Let JARVIS actually do the work for imperative goals.
      if (isActionableGoal(clean)) {
        onTranscript?.(clean);
      }

      let answer = "";
      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: clean }),
        });
        const data = await res.json();
        answer = data.reply || "";
      } catch {
        answer = "";
      }

      if (!answer) {
        answer = `I heard "${clean}", but I could not reach my brain just now. Try again in a moment.`;
      }

      setReply(answer);
      speak(answer);
    },
    [onTranscript, speak]
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
    onStatusChange?.("idle");
  }, [onStatusChange]);

  const startListening = useCallback(() => {
    const ctor = getRecognitionCtor();
    if (!ctor) {
      setError("Voice input is not supported in this browser.");
      return;
    }

    setError("");
    setReply("");
    setTranscript("");

    const recognition = new ctor();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interim += result[0].transcript;
      }
      if (interim) setTranscript(interim);
      if (finalText) {
        onStatusChange?.("thinking");
        void handleResult(finalText);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "aborted") {
        setError(
          event.error === "not-allowed"
            ? "Microphone access denied. Allow the mic in your browser."
            : `Speech error: ${event.error}`
        );
      }
      setListening(false);
      onStatusChange?.("idle");
    };

    recognition.onend = () => {
      setListening(false);
      if (!speaking) onStatusChange?.("idle");
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
      onStatusChange?.("listening");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start listening.");
      setListening(false);
    }
  }, [handleResult, onStatusChange, speaking]);

  const handleClick = () => {
    if (listening) stopListening();
    else startListening();
  };

  const label = listening
    ? "Listening..."
    : speaking
    ? "Speaking..."
    : "Talk to JARVIS";

  return (
    <div className="relative flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={!isVoiceEnabled}
        aria-label={listening ? "Stop listening" : "Talk to JARVIS by voice"}
        aria-pressed={listening}
        title={isVoiceEnabled ? "Ask JARVIS a question by voice" : "Voice not supported in this browser"}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
          listening
            ? "bg-rose-950/60 border-rose-500/60 text-rose-200 shadow-[0_0_14px_rgba(244,63,94,0.4)]"
            : speaking
            ? "bg-emerald-950/50 border-emerald-500/50 text-emerald-200"
            : "bg-purple-950/50 border-purple-500/40 hover:border-purple-300 text-purple-200 hover:shadow-[0_0_12px_rgba(168,85,247,0.3)]"
        }`}
      >
        {listening ? (
          <MicOff className="w-3.5 h-3.5 animate-pulse" />
        ) : speaking ? (
          <Volume2 className="w-3.5 h-3.5 animate-pulse" />
        ) : (
          <Mic className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">{label}</span>
      </button>

      {(listening || speaking) && (
        <span className="hidden lg:flex items-end gap-0.5 h-3" aria-hidden="true">
          {[6, 10, 4, 9, 5].map((h, i) => (
            <span
              key={i}
              className={`w-0.5 rounded-full ${speaking ? "bg-emerald-400" : "bg-rose-400"} animate-pulse`}
              style={{ height: `${h}px`, animationDelay: `${i * 90}ms` }}
            />
          ))}
        </span>
      )}

      {error && (
        <span className="text-[10px] font-mono text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded border border-rose-500/30">
          {error}
        </span>
      )}

      {(transcript || reply) && (
        <div className="absolute top-full right-0 mt-2 w-72 z-40 hud-panel p-3 rounded-xl border border-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.3)] animate-fade-in">
          {transcript && (
            <div className="mb-2">
              <p className="text-[9px] font-mono text-purple-400/70 uppercase tracking-wider mb-0.5">You said</p>
              <p className="text-[11px] text-purple-200">{transcript}</p>
            </div>
          )}
          {reply && (
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Volume2 className="w-3 h-3 text-emerald-400" />
                <p className="text-[9px] font-mono text-emerald-400/80 uppercase tracking-wider">JARVIS</p>
              </div>
              <p className="text-[11px] text-emerald-200/90 leading-snug">{reply}</p>
            </div>
          )}
        </div>
      )}

      {!supported && !error && (
        <span className="hidden xl:inline text-[10px] font-mono text-purple-400/60">
          Voice unsupported here
        </span>
      )}

      {listening && (
        <Loader2 className="w-3.5 h-3.5 text-rose-300 animate-spin" aria-hidden="true" />
      )}
    </div>
  );
}