"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { 
  AlertTriangle, 
  MicOff, 
  Ban, 
  X, 
  Volume2, 
  MessageSquareWarning,
  ShieldAlert 
} from "lucide-react";

/**
 * AudioModerationOverlay
 * 
 * Renders contextual warnings / actions for audio moderation state.
 * Mirrors the visual language of ModerationOverlay but with audio-specific
 * iconography and positioned at the bottom-left to avoid collision with
 * the video moderation overlay (top-center).
 */
export default function AudioModerationOverlay({
  audioModerationState,
  audioModerationMessage,
  abuseScore,
  onSkip,
}) {
  const [dismissed, setDismissed] = useState(false);

  // Auto-dismiss warning after 6 seconds
  useEffect(() => {
    if (audioModerationState === "warning") {
      setDismissed(false);
      const timer = setTimeout(() => setDismissed(true), 6000);
      return () => clearTimeout(timer);
    }
    setDismissed(false);
  }, [audioModerationState, audioModerationMessage]);

  if (audioModerationState === "clean") return null;

  // ─── Warning Toast ──────────────────────────────────────────
  if (audioModerationState === "warning" && !dismissed) {
    return (
      <div className="absolute bottom-4 left-4 z-30 animate-fade-in-up">
        <div className="glass-panel px-5 py-3.5 rounded-2xl flex items-center gap-3 border border-yellow-500/30 shadow-lg shadow-yellow-500/10 max-w-sm">
          <div className="w-9 h-9 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20 flex-shrink-0">
            <MessageSquareWarning className="text-yellow-500 w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-yellow-400">Language Warning</p>
            <p className="text-xs text-zinc-400 mt-0.5 truncate">{audioModerationMessage}</p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-zinc-500 hover:text-white transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ─── Muted State ──────────────────────────────────────────
  if (audioModerationState === "muted") {
    return (
      <div className="absolute bottom-4 left-4 z-30 animate-fade-in-up">
        <div className="glass-panel px-6 py-5 rounded-2xl flex flex-col items-center gap-3 border border-red-500/20 shadow-xl max-w-xs text-center">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
            <MicOff className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <p className="text-base font-bold text-red-400">Audio Muted</p>
            <p className="text-xs text-zinc-400 mt-1">{audioModerationMessage}</p>
            <p className="text-[10px] text-zinc-600 mt-1">Your microphone has been disabled due to policy violations.</p>
          </div>
          <Button onClick={onSkip} className="mt-1 w-full text-sm">Skip to Next</Button>
        </div>
      </div>
    );
  }

  // ─── Terminated State ─────────────────────────────────────
  if (audioModerationState === "terminated") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-md z-30">
        <div className="glass-panel px-8 py-8 rounded-3xl flex flex-col items-center gap-4 border border-red-500/30 shadow-2xl max-w-xs text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 text-red-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <p className="text-xl font-bold text-red-500">Session Terminated</p>
          <p className="text-sm text-zinc-400">{audioModerationMessage}</p>
          <p className="text-xs text-zinc-600">Repeated abusive language resulted in automatic termination. A report has been submitted.</p>
          <Button onClick={onSkip} className="mt-2 w-full">Find Next Match</Button>
        </div>
      </div>
    );
  }

  return null;
}
