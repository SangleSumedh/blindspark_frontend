"use client";

import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

export default function ChatWindow({ 
  messages, 
  userId, 
  peerIsTyping,
  hasMore,
  loadOlderMessages,
  loadingMessages
}) {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, peerIsTyping]);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4 relative" ref={scrollRef}>
      {hasMore && (
        <div className="text-center pb-4">
          <button 
            onClick={loadOlderMessages}
            disabled={loadingMessages}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-4 py-1.5 rounded-full transition-colors"
          >
            {loadingMessages ? "Loading..." : "Load older messages"}
          </button>
        </div>
      )}

      {messages.map((msg, idx) => {
        // Grouping by date could go here
        return (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            isOwn={msg.senderId === userId} 
          />
        );
      })}

      {peerIsTyping && (
        <div className="mt-2">
          <TypingIndicator />
        </div>
      )}
    </div>
  );
}
