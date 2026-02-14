"use client";

import { useState, useRef, useEffect } from "react";
import useWebRTC from "@/hooks/WebRTC";
import VideoTile from "@/components/videoTile";
import { useAuth } from "@/context/AuthContext";
import LoginPage from "@/components/LoginPage";
import ReportModal from "@/components/ReportModal";
import ProfileSetup from "@/components/ProfileSetup";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Draggable from "@/components/ui/Draggable";

export default function Home() {
  const { user, userProfile, loading: authLoading, logout, refreshProfile } = useAuth();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const chatEndRef = useRef(null);
  const {
    localVideoRef,
    remoteVideoRef,
    findMatch,
    skipToNext,
    role,
    connected,
    status,
    isMuted,
    isVideoOff,
    peerDisconnected,
    matchData,
    toggleMute,
    toggleVideo,
  } = useWebRTC();

  const handleStart = async () => {
    await findMatch(userProfile);
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { id: Date.now(), text: chatInput.trim(), sender: "you", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    ]);
    setChatInput("");
  };

  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-[#050505]" : "bg-white"} text-white transition-colors duration-300`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e0ff00]"></div>
      </div>
    );
  }

  if (!user) return <LoginPage />;
  if (!userProfile) return <ProfileSetup onComplete={refreshProfile} />;

  // Ban check
  if (userProfile.isBanned) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDarkMode ? "bg-[#050505]" : "bg-white"} text-white p-8 text-center transition-colors duration-300`}>
        <h1 className="text-6xl mb-4">🚫</h1>
        <h2 className="text-3xl font-bold text-red-500 mb-2">Account Suspended</h2>
        <p className={`${isDarkMode ? "text-zinc-400" : "text-zinc-600"} max-w-md`}>
          Your account has been flagged for violating our community guidelines.
        </p>
        <Button onClick={logout} variant="secondary" className="mt-8">Sign Out</Button>
      </div>
    );
  }

  return (
    <main className={`relative flex flex-col min-h-screen ${isDarkMode ? "bg-[#050505] text-[#EDEDED]" : "bg-[#F5F5F7] text-zinc-900"} overflow-hidden selection:bg-[#e0ff00]/20 transition-colors duration-300`}>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-6 flex flex-col h-screen">

        {/* ───── Header (Glass Pill) ───── */}
        <header className={`flex justify-between items-center my-4 rounded-full px-6 py-3 border ${isDarkMode ? "border-[#333333] bg-[#0a0a0a]/80" : "border-zinc-200 bg-white/80"} backdrop-blur-md transition-colors duration-300`}>
          <div className="flex items-center gap-2">
            <span className={`font-bold text-xl tracking-tight hidden sm:inline ${isDarkMode ? "text-[#EDEDED]" : "text-zinc-900"}`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>BlindSpark</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#e0ff00] inline-block" />
          </div>

          <div className="flex items-center gap-4">
            {/* Match info inline in header when connected */}
            {connected && matchData && (
              <div className="hidden md:flex items-center gap-3 mr-4">
                <span className="h-2 w-2 rounded-full bg-[#e0ff00] shadow-[0_0_8px_#e0ff0080]" />
                <span className={`text-sm font-semibold ${isDarkMode ? "text-[#EDEDED]" : "text-zinc-900"}`}>{matchData.peerProfile?.displayName || "Anonymous"}</span>
                {matchData.commonInterests?.length > 0 && (
                  <div className="flex gap-1">
                    {matchData.commonInterests.slice(0, 3).map((i) => (
                      <span key={i} className={`text-[10px] ${isDarkMode ? "bg-[#1A1A1A] border-[#333333] text-[#A1A1A1]" : "bg-zinc-100 border-zinc-200 text-zinc-500"} border px-2 py-0.5 rounded-full transition-colors duration-300`}>{i}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-[#e0ff00]">{userProfile.displayName}</span>
              <span className={`text-[10px] ${isDarkMode ? "text-[#A1A1A1]" : "text-zinc-500"} uppercase tracking-widest`}>{userProfile.karma} Karma</span>
            </div>
            
            {/* Theme Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className={`p-2 rounded-full transition-colors ${isDarkMode ? "bg-[#1A1A1A] text-[#EDEDED] hover:bg-[#333333]" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>

            <button onClick={logout} className={`${isDarkMode ? "text-[#A1A1A1] hover:text-white" : "text-zinc-400 hover:text-zinc-600"} transition-colors`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            </button>
          </div>
        </header>

        {/* ───── Main Content ───── */}
        <div className="flex-1 flex flex-col justify-center items-center w-full min-h-0">

          {status === "idle" ? (
            /* ── Idle Card ── */
            <Card className={`max-w-md w-full text-center py-8 md:py-12 px-6 md:px-8 border ${isDarkMode ? "border-[#333333] bg-[#1A1A1A]/80 text-[#EDEDED]" : "border-zinc-200 bg-white/80 text-zinc-900"} transition-colors duration-300`}>
              <div className="w-20 h-20 md:w-24 md:h-24 bg-[#e0ff00]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#e0ff00]/20">
                <span className="text-4xl md:text-5xl">🔭</span>
              </div>
              <h2 className={`text-xl md:text-2xl font-bold mb-2 ${isDarkMode ? "text-[#EDEDED]" : "text-zinc-900"}`}>Find your sparq</h2>
              <p className={`text-sm md:text-base ${isDarkMode ? "text-[#A1A1A1]" : "text-zinc-500"} mb-8`}>Connect with people who share your vibe. Safe, anonymous, and powered by smart matching.</p>
              <Button onClick={handleStart} size="lg" className="w-full text-lg bg-[#e0ff00] text-[#000000] hover:brightness-110 shadow-[#e0ff00]/20">Start Matching</Button>
            </Card>
          ) : (
            /* ── Active Session ── */
            <div className="w-full flex-1 flex flex-col md:flex-row gap-3 min-h-0 pb-4">

              {/* Left: Video area (Controls Merged) */}
              <div className={`flex-1 rounded-2xl overflow-hidden border ${isDarkMode ? "border-[#333333] bg-black" : "border-zinc-200 bg-white"} relative min-h-0 group`}>
                <VideoTile videoRef={remoteVideoRef} />

                {/* Local Video (Floating & Draggable) */}
                <Draggable
                  className="top-3 left-3"
                  initialPos={{ x: 0, y: 0 }}
                >
                  <div className={`w-28 h-20 md:w-40 md:h-28 rounded-xl overflow-hidden border ${isDarkMode ? "border-[#333333] bg-[#1A1A1A]" : "border-zinc-200 bg-white"} shadow-2xl relative group cursor-grab active:cursor-grabbing`}>
                    <VideoTile videoRef={localVideoRef} muted />
                    <div className="absolute bottom-1 right-1.5 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-bold text-[#A1A1A1] uppercase tracking-wider pointer-events-none">You</div>
                  </div>
                </Draggable>

                {/* Controls Overlay (Merged) */}
                <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-full backdrop-blur-md border shadow-lg z-30 transition-all duration-300 ${isDarkMode ? "bg-[#1A1A1A]/90 border-[#333333]" : "bg-white/90 border-zinc-200"}`}>
                  <button
                    onClick={toggleMute}
                    className={`p-2.5 rounded-full transition-all duration-200 ${
                      isMuted 
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                        : isDarkMode ? 'bg-white/5 hover:bg-white/10 text-zinc-300' : 'bg-black/5 hover:bg-black/10 text-zinc-600'
                    }`}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                    )}
                  </button>

                  <button
                    onClick={toggleVideo}
                    className={`p-2.5 rounded-full transition-all duration-200 ${
                      isVideoOff 
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                        : isDarkMode ? 'bg-white/5 hover:bg-white/10 text-zinc-300' : 'bg-black/5 hover:bg-black/10 text-zinc-600'
                    }`}
                    title={isVideoOff ? "Turn on camera" : "Turn off camera"}
                  >
                    {isVideoOff ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                    )}
                  </button>

                  <div className={`h-6 w-px mx-1 ${isDarkMode ? "bg-[#333333]" : "bg-zinc-200"}`}></div>

                  <Button
                    onClick={() => skipToNext(userProfile)}
                    className="rounded-full px-6 text-sm font-bold bg-[#e0ff00] text-[#000000] hover:brightness-110 shadow-[0_0_15px_-3px_rgba(204,255,0,0.3)] transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
                  >
                    Next 
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </Button>

                  <div className={`h-6 w-px mx-1 ${isDarkMode ? "bg-[#333333]" : "bg-zinc-200"}`}></div>

                  <button
                    onClick={() => setIsReportOpen(true)}
                    className={`p-2.5 rounded-full transition-all ${isDarkMode ? "bg-[#1A1A1A] border border-[#333333] hover:bg-red-500/20 text-[#A1A1A1] hover:text-red-400" : "bg-zinc-100 hover:bg-red-50 text-zinc-400 hover:text-red-500"}`}
                    title="Report User"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                  </button>

                  <button
                    onClick={() => window.location.reload()}
                    className="p-2.5 rounded-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all transform hover:rotate-90 duration-300"
                    title="Disconnect"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                  </button>
                </div>

                {/* Scanning overlay */}
                {!connected && !peerDisconnected && (
                  <div className={`absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm z-10 ${isDarkMode ? "bg-[#050505]/80" : "bg-white/80"}`}>
                    <div className="w-14 h-14 border-[3px] border-[#e0ff00]/20 border-t-[#e0ff00] rounded-full animate-spin mb-4"/>
                    <p className={`${isDarkMode ? "text-[#A1A1A1]" : "text-zinc-500"} text-sm font-medium animate-pulse`}>Scanning frequencies...</p>
                  </div>
                )}

                {/* Peer disconnected overlay */}
                {peerDisconnected && (
                  <div className={`absolute inset-0 flex flex-col items-center justify-center backdrop-blur-md z-20 ${isDarkMode ? "bg-[#050505]/90" : "bg-white/90"}`}>
                    <span className="text-4xl mb-2">👋</span>
                    <p className={`${isDarkMode ? "text-white" : "text-zinc-900"} font-bold text-xl`}>Peer Disconnected</p>
                    <Button onClick={() => skipToNext(userProfile)} className="mt-6">Find Next Match</Button>
                  </div>
                )}
              </div>

              {/* Right: Chat Sidebar */}
              <div className={`w-full md:w-80 flex flex-col border rounded-2xl overflow-hidden shrink-0 transition-colors duration-300 ${isDarkMode ? "bg-[#1A1A1A]/80 border-[#333333]" : "bg-white border-zinc-200"}`}>
                {/* Chat Header */}
                <div className={`px-4 py-3 border-b flex items-center justify-between ${isDarkMode ? "border-[#333333]" : "border-zinc-200"}`}>
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#e0ff00]"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span className={`text-sm font-semibold ${isDarkMode ? "text-[#EDEDED]" : "text-zinc-900"}`}>Chat</span>
                  </div>
                  {connected && (
                    <span className="text-[10px] bg-[#e0ff00]/15 text-[#e0ff00] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider">Live</span>
                  )}
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px] md:min-h-0">
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 border ${isDarkMode ? "bg-[#050505]/60 border-[#333333]" : "bg-zinc-50 border-zinc-200"}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`${isDarkMode ? "text-[#A1A1A1]/40" : "text-zinc-400"}`}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      </div>
                      <p className={`text-xs ${isDarkMode ? "text-[#A1A1A1]/40" : "text-zinc-400"}`}>Messages will appear here</p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div key={msg.id} className={`flex flex-col ${msg.sender === "you" ? "items-end" : "items-start"}`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                          msg.sender === "you"
                            ? "bg-[#e0ff00]/15 text-[#e0ff00] rounded-br-sm"
                            : isDarkMode 
                                ? "bg-[#050505]/60 border border-[#333333] text-[#EDEDED] rounded-bl-sm"
                                : "bg-zinc-100 border border-zinc-200 text-zinc-800 rounded-bl-sm"
                        }`}>
                          {msg.text}
                        </div>
                        <span className={`text-[10px] mt-0.5 px-1 ${isDarkMode ? "text-[#A1A1A1]/40" : "text-zinc-400"}`}>{msg.time}</span>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendMessage} className={`p-3 border-t ${isDarkMode ? "border-[#333333]" : "border-zinc-200"}`}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={connected ? "Type a message..." : "Connect to chat..."}
                      disabled={!connected}
                      className={`flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#e0ff00]/40 focus:border-[#e0ff00]/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${isDarkMode ? "bg-[#050505]/60 border-[#333333] text-[#EDEDED] placeholder-[#A1A1A1]/40" : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400"}`}
                    />
                    <button
                      type="submit"
                      disabled={!connected || !chatInput.trim()}
                      className="p-2 rounded-xl bg-[#e0ff00]/15 text-[#e0ff00] hover:bg-[#e0ff00]/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* ReportModal */}
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          remoteVideoRef={remoteVideoRef}
          reportedUserId={matchData?.peerProfile?.id}
          onReportSubmitted={() => {
            skipToNext(userProfile);
          }}
        />
      </div>
    </main>
  );
}
