"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { AlertTriangle, EyeOff, Ban, X } from "lucide-react";

export default function ModerationOverlay({ moderationState, moderationMessage, onSkip }) {
  const [dismissed, setDismissed] = useState(false);

  // Auto-dismiss warning after 5 seconds
  useEffect(() => {
    if (moderationState === "warning") {
      setDismissed(false);
      const timer = setTimeout(() => setDismissed(true), 5000);
      return () => clearTimeout(timer);
    }
    setDismissed(false);
  }, [moderationState, moderationMessage]);

  if (moderationState === "clean") return null;

  // ─── Warning Popup ──────────────────────────────────────────
  if (moderationState === "warning" && !dismissed) {
    return (
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 animate-fade-in-up">
        <div className="glass-panel px-6 py-4 rounded-2xl flex items-center gap-3 border border-yellow-500/30 shadow-lg shadow-yellow-500/10 max-w-sm">
          <AlertTriangle className="text-yellow-500 w-6 h-6 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-400">Content Warning</p>
            <p className="text-xs text-zinc-400 mt-0.5">{moderationMessage}</p>
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

  // ─── Blurred State ──────────────────────────────────────────
  if (moderationState === "blurred") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/60 backdrop-blur-sm z-30">
        <div className="glass-panel px-8 py-6 rounded-3xl flex flex-col items-center gap-3 border border-red-500/20 shadow-xl max-w-xs text-center">
          <EyeOff className="w-10 h-10 text-red-400 mb-1" />
          <p className="text-lg font-bold text-red-400">Content Hidden</p>
          <p className="text-xs text-zinc-400">{moderationMessage}</p>
          <Button onClick={onSkip} className="mt-2 w-full">Skip to Next</Button>
        </div>
      </div>
    );
  }

  // ─── Terminated State ───────────────────────────────────────
  if (moderationState === "terminated") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-md z-30">
        <div className="glass-panel px-8 py-8 rounded-3xl flex flex-col items-center gap-4 border border-red-500/30 shadow-2xl max-w-xs text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 text-red-500">
            <Ban className="w-8 h-8" />
          </div>
          <p className="text-xl font-bold text-red-500">Session Terminated</p>
          <p className="text-sm text-zinc-400">{moderationMessage}</p>
          <p className="text-xs text-zinc-600">A report has been automatically submitted.</p>
          <Button onClick={onSkip} className="mt-2 w-full">Find Next Match</Button>
        </div>
      </div>
    );
  }

  return null;
}
