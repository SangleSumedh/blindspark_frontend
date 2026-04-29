"use client";

import { useState } from "react";
import { SendHorizonal } from "lucide-react";

export default function ChatInput({ 
  onSendMessage, 
  emitTyping, 
  emitStopTyping,
  disabled 
}) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    
    onSendMessage(text);
    setText("");
    emitStopTyping();
  };

  const handleChange = (e) => {
    setText(e.target.value);
    if (e.target.value.trim()) {
      emitTyping();
    } else {
      emitStopTyping();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-zinc-950/80 backdrop-blur-md">
      <div className="relative flex items-center">
        <input
          type="text"
          value={text}
          onChange={handleChange}
          disabled={disabled}
          placeholder={disabled ? "Select a connection to chat..." : "Type a message..."}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-3 pl-5 pr-14 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-orange-500 hover:bg-orange-400 text-white rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-orange-500"
        >
          <SendHorizonal className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
