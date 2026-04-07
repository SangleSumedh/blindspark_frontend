"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { AlertTriangle, EyeOff, Ban, X, ShieldCheck, ShieldAlert } from "lucide-react";

export default function ModerationOverlay({ moderationState, moderationMessage, onSkip, peerModerationAlert, onDismissAlert, personalModerationAlert, onDismissPersonalAlert }) {
  const [dismissed, setDismissed] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [personalAlertDismissed, setPersonalAlertDismissed] = useState(false);

  // Auto-dismiss warning after 5 seconds
  useEffect(() => {
    if (moderationState === "warning") {
      setDismissed(false);
      const timer = setTimeout(() => setDismissed(true), 5000);
      return () => clearTimeout(timer);
    }
    setDismissed(false);
  }, [moderationState, moderationMessage]);

  // Auto-dismiss victim alert after 6 seconds (for warning severity only)
  useEffect(() => {
    if (peerModerationAlert?.severity === "warning") {
      setAlertDismissed(false);
      const timer = setTimeout(() => {
        setAlertDismissed(true);
        onDismissAlert?.();
      }, 6000);
      return () => clearTimeout(timer);
    }
    setAlertDismissed(false);
  }, [peerModerationAlert, onDismissAlert]);

  // Auto-dismiss violator network alert after 6 seconds (warning only)
  useEffect(() => {
    if (personalModerationAlert?.severity === "warning") {
      setPersonalAlertDismissed(false);
      const timer = setTimeout(() => {
        setPersonalAlertDismissed(true);
        onDismissPersonalAlert?.();
      }, 6000);
      return () => clearTimeout(timer);
    }
    setPersonalAlertDismissed(false);
  }, [personalModerationAlert, onDismissPersonalAlert]);

  // ── Victim-side overlays (peer was flagged) ─────────────────
  if (peerModerationAlert && !alertDismissed) {
    const { severity, message } = peerModerationAlert;

    // Victim: Peer terminated → full-screen overlay
    if (severity === "terminate") {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-md z-30">
          <div className="glass-panel px-8 py-8 rounded-3xl flex flex-col items-center gap-4 border border-red-500/30 shadow-2xl max-w-xs text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 text-red-500">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <p className="text-xl font-bold text-red-500">Peer Removed</p>
            <p className="text-sm text-zinc-400">{message}</p>
            <p className="text-xs text-zinc-600">The other user was automatically removed for policy violations.</p>
            <Button onClick={onSkip} className="mt-2 w-full">Find Next Match</Button>
          </div>
        </div>
      );
    }

    // Victim: Peer blurred/muted → overlay with blur backdrop
    if (severity === "blur" || severity === "mute") {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/60 backdrop-blur-sm z-30">
          <div className="glass-panel px-8 py-6 rounded-3xl flex flex-col items-center gap-3 border border-orange-500/20 shadow-xl max-w-xs text-center">
            <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-500/20">
              <ShieldCheck className="w-6 h-6 text-orange-400" />
            </div>
            <p className="text-lg font-bold text-orange-400">Content Flagged</p>
            <p className="text-xs text-zinc-400">{message}</p>
            <p className="text-[10px] text-zinc-600">Our moderation system detected an issue with the other user's content.</p>
            <Button onClick={onSkip} className="mt-2 w-full">Skip to Next</Button>
          </div>
        </div>
      );
    }

    // Victim: Peer warning → dismissible toast
    return (
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 animate-fade-in-up">
        <div className="glass-panel px-6 py-4 rounded-2xl flex items-center gap-3 border border-orange-500/30 shadow-lg shadow-orange-500/10 max-w-sm">
          <ShieldCheck className="text-orange-400 w-6 h-6 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-400">Peer Warning</p>
            <p className="text-xs text-zinc-400 mt-0.5">{message}</p>
          </div>
          <button
            onClick={() => { setAlertDismissed(true); onDismissAlert?.(); }}
            className="text-zinc-500 hover:text-white transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ── Network Violator-side overlays (peer flagged us) ─────────
  if (personalModerationAlert && !personalAlertDismissed) {
    const { severity, message } = personalModerationAlert;
    
    // We only display a toast warning here so we aren't blinding our own screen 
    // unless the server strictly wants to emphasize it
    return (
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 animate-fade-in-up">
        <div className="glass-panel px-6 py-4 rounded-2xl flex items-center gap-3 border border-yellow-500/30 shadow-lg shadow-yellow-500/10 max-w-sm">
          <AlertTriangle className="text-yellow-500 w-6 h-6 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-500">System Warning</p>
            <p className="text-xs text-zinc-400 mt-0.5">{message}</p>
          </div>
          <button
            onClick={() => { setPersonalAlertDismissed(true); onDismissPersonalAlert?.(); }}
            className="text-zinc-500 hover:text-white transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ── Violator-side overlays (own violations) ─────────────────
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
