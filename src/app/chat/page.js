"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/hooks/useChat";
import { useChatSocket } from "@/hooks/useChatSocket";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInput from "@/components/chat/ChatInput";
import EmptyChat from "@/components/chat/EmptyChat";

export default function ChatPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!loading && (!user || !userProfile)) {
      router.push("/");
    }
  }, [user, userProfile, loading, router]);

  const {
    connections,
    loadingConnections,
    messages,
    loadingMessages,
    activeConnectionId,
    setActiveConnection,
    sendMessage,
    loadOlderMessages,
    markAsRead,
    hasMore,
  } = useChat(user?.uid);

  const {
    peerIsTyping,
    onlineUsers,
    emitTyping,
    emitStopTyping
  } = useChatSocket(activeConnectionId);

  // Mark as read when active connection changes or new messages arrive
  useEffect(() => {
    if (activeConnectionId) {
      markAsRead();
    }
  }, [activeConnectionId, messages, markAsRead]);

  if (loading || (!user && loadingConnections)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Get active connection details
  const activeConnection = connections.find(c => c.id === activeConnectionId);
  const activePeerId = activeConnection?.participants.find(id => id !== user.uid);
  const activePeerProfile = activeConnection?.participantProfiles?.[activePeerId] || { displayName: "Chat" };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden selection:bg-orange-500/30">
      {/* Header */}
      <header className="h-16 flex-shrink-0 flex items-center px-4 border-b border-white/5 bg-zinc-950 z-10">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-semibold tracking-tight">Back to Matching</span>
        </Link>
        <div className="mx-auto font-bold text-lg tracking-tight">
          {activeConnectionId ? activePeerProfile.displayName : "Messages"}
        </div>
        <div className="w-[100px]" /> {/* Spacer for centering */}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar (hidden on mobile if a chat is active) */}
        <div className={`
          ${activeConnectionId ? "hidden md:block" : "block"} 
          w-full md:w-80 h-full flex-shrink-0
        `}>
          <ChatSidebar 
            connections={connections}
            activeConnectionId={activeConnectionId}
            setActiveConnection={setActiveConnection}
            userId={user?.uid}
            onlineUsers={onlineUsers}
          />
        </div>

        {/* Chat Area */}
        <div className={`
          ${!activeConnectionId ? "hidden md:flex" : "flex"} 
          flex-1 flex-col h-full relative bg-[#09090b]
        `}>
          {activeConnectionId ? (
            <>
              {/* Back button for mobile view */}
              <div className="md:hidden flex items-center p-3 border-b border-white/5 bg-zinc-950/80 backdrop-blur-sm z-10 absolute top-0 left-0 right-0">
                <button 
                  onClick={() => setActiveConnection(null)}
                  className="flex items-center gap-1 text-orange-500 font-medium"
                >
                  <ChevronLeft className="w-4 h-4" />
                  All Chats
                </button>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden pt-12 md:pt-0">
                <ChatWindow 
                  messages={messages}
                  userId={user?.uid}
                  peerIsTyping={peerIsTyping}
                  hasMore={hasMore}
                  loadOlderMessages={loadOlderMessages}
                  loadingMessages={loadingMessages}
                />
              </div>
              
              <ChatInput 
                onSendMessage={(text) => sendMessage(text, userProfile.displayName)}
                emitTyping={emitTyping}
                emitStopTyping={emitStopTyping}
                disabled={!activeConnectionId}
              />
            </>
          ) : (
            <EmptyChat />
          )}
        </div>
      </main>
    </div>
  );
}
