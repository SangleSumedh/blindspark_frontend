"use client";

import { format } from "date-fns";

export default function MessageBubble({ message, isOwn }) {
  // message.timestamp can be a Firestore Timestamp object or string (if optimistically rendered)
  const time = message.timestamp?.toDate ? message.timestamp.toDate() : new Date(message.timestamp || Date.now());

  return (
    <div className={`flex w-full ${isOwn ? "justify-end" : "justify-start"} animate-fade-in-up`}>
      <div className={`max-w-[75%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn && (
          <span className="text-[10px] text-zinc-500 mb-1 ml-1">
            {message.senderName}
          </span>
        )}
        
        <div 
          className={`px-4 py-2.5 rounded-2xl text-sm ${
            isOwn 
              ? "bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-tr-sm shadow-orange-900/20" 
              : "bg-zinc-800 text-zinc-200 rounded-tl-sm border border-white/5 shadow-black/20"
          } shadow-lg`}
        >
          {message.text}
        </div>
        
        <span className="text-[10px] text-zinc-600 mt-1 mx-1">
          {format(time, "HH:mm")}
        </span>
      </div>
    </div>
  );
}
