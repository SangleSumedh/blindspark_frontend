"use client";

import { Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ChatSidebar({ 
  connections, 
  activeConnectionId, 
  setActiveConnection, 
  userId,
  onlineUsers
}) {
  return (
    <div className="w-full md:w-80 border-r border-white/5 bg-zinc-950/50 flex flex-col h-full">
      <div className="p-4 border-b border-white/5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search connections..." 
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-sm text-zinc-300 focus:outline-none focus:border-orange-500/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {connections.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm">
            No connections yet. Match with someone to start chatting!
          </div>
        ) : (
          connections.map(conn => {
            const otherParticipantId = conn.participants.find(id => id !== userId);
            const profile = conn.participantProfiles?.[otherParticipantId] || { displayName: "Anonymous" };
            const isOnline = onlineUsers.includes(otherParticipantId);
            const unreadCount = conn.unreadCount?.[userId] || 0;
            const isActive = activeConnectionId === conn.id;

            return (
              <button
                key={conn.id}
                onClick={() => setActiveConnection(conn.id)}
                className={`w-full text-left p-4 border-b border-white/5 transition-colors flex gap-3 ${
                  isActive ? "bg-orange-500/10" : "hover:bg-zinc-900/50"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-lg font-bold text-zinc-400">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </div>
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-zinc-950 rounded-full"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-semibold text-zinc-200 truncate pr-2">
                      {profile.displayName}
                    </h4>
                    {conn.lastMessage && (
                      <span className="text-[10px] text-zinc-500 flex-shrink-0">
                        {formatDistanceToNow(new Date(conn.lastMessage.timestamp), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className={`text-sm truncate pr-2 ${unreadCount > 0 ? "text-zinc-200 font-medium" : "text-zinc-500"}`}>
                      {conn.lastMessage ? conn.lastMessage.text : "Connected"}
                    </p>
                    {unreadCount > 0 && (
                      <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
