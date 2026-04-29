"use client";

import { Sparkles } from "lucide-react";

export default function EmptyChat() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-zinc-950/30">
      <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mb-4 border border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.1)]">
        <Sparkles className="w-8 h-8 text-orange-500" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Your Connections</h3>
      <p className="text-sm text-zinc-500 max-w-xs">
        Select a connection from the sidebar to continue your conversation where you left off.
      </p>
    </div>
  );
}
