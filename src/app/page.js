"use client";

import { useState } from "react";
import useWebRTC from "@/hooks/WebRTC";
import VideoTile from "@/components/videoTile";
import { useAuth } from "@/context/AuthContext";
import LoginPage from "@/components/LoginPage";
import ReportModal from "@/components/ReportModal";
import ProfileSetup from "@/components/ProfileSetup";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function Home() {
  const { user, userProfile, loading: authLoading, logout, refreshProfile } = useAuth();
  const [isReportOpen, setIsReportOpen] = useState(false);
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) return <LoginPage />;
  if (!userProfile) return <ProfileSetup onComplete={refreshProfile} />;

  // Ban check
  if (userProfile.isBanned) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-8 text-center">
        <h1 className="text-6xl mb-4">🚫</h1>
        <h2 className="text-3xl font-bold text-red-500 mb-2">Account Suspended</h2>
        <p className="text-zinc-400 max-w-md">
          Your account has been flagged for violating our community guidelines.
        </p>
        <Button onClick={logout} variant="secondary" className="mt-8">Sign Out</Button>
      </div>
    );
  }

  return (
    <main className="relative flex flex-col items-center min-h-screen bg-zinc-950 text-white overflow-hidden selection:bg-emerald-500/30">
      
      {/* Dynamic Background Mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-900/10 blur-[120px] transition-all duration-1000 ${status === 'matched' ? 'bg-emerald-600/20' : ''}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px] transition-all duration-1000 ${status === 'matched' ? 'bg-blue-600/20' : ''}`} />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto p-4 md:p-6 flex flex-col h-screen">
        
        {/* Header (Glass Pill) */}
        <header className="flex justify-between items-center mb-6 glass rounded-full px-6 py-3 mx-4 md:mx-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="font-bold tracking-tight hidden sm:inline">BlindSpark</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-emerald-400">{userProfile.displayName}</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest">{userProfile.karma} Karma</span>
            </div>
            <button onClick={logout} className="text-zinc-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col justify-center items-center w-full relative">
          
          {/* Status Badge */}
          <div className="absolute top-0 z-20 flex flex-col items-center gap-2">
             <div className="glass px-4 py-1.5 rounded-full flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-zinc-500 animate-pulse"}`}></span>
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">
                  {status === 'idle' ? 'Standby' : status === 'searching' ? 'Searching...' : status === 'connecting' ? 'Connecting...' : 'Live'}
                </span>
             </div>
             
             {/* Match Info Popup (Floating) */}
             {connected && matchData && (
                <div className="glass-panel px-6 py-3 rounded-2xl flex flex-col items-center gap-1 animate-fade-in-up mt-2">
                  <div className="text-xs text-zinc-400 uppercase tracking-wider">Connected with</div>
                  <div className="text-lg font-bold text-emerald-400">{matchData.peerProfile?.displayName || "Anonymous"}</div>
                  
                  {matchData.commonInterests?.length > 0 && (
                     <div className="flex gap-1 mt-1">
                        {matchData.commonInterests.map(i => (
                          <span key={i} className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white">{i}</span>
                        ))}
                     </div>
                  )}
                </div>
             )}
          </div>

          {status === "idle" ? (
            <Card className="max-w-md w-full text-center py-12 px-8 border-zinc-800 bg-zinc-900/50">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                <span className="text-5xl">🔭</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Find your sparq</h2>
              <p className="text-zinc-400 mb-8">Connect with people who share your vibe. Safe, anonymous, and powered by smart matching.</p>
              <Button onClick={handleStart} size="lg" className="w-full text-lg shadow-emerald-900/50">Start Matching</Button>
            </Card>
          ) : (
            <div className="w-full h-full max-h-[70vh] flex flex-col md:flex-row gap-4 relative">
              
              {/* Local Video (Floating Picture-in-Picture on Mobile, Side-by-Side on Desktop) */}
              <div className="absolute top-4 right-4 w-32 md:w-auto md:static md:flex-1 h-48 md:h-auto rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl z-30 md:z-auto">
                 <VideoTile videoRef={localVideoRef} muted />
                 <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-zinc-300">YOU</div>
              </div>

              {/* Remote Video (Main) */}
              <div className="flex-1 rounded-3xl overflow-hidden border border-zinc-800 bg-black relative shadow-2xl group">
                <VideoTile videoRef={remoteVideoRef} />
                
                {/* Overlays */}
                {!connected && !peerDisconnected && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/80 backdrop-blur-sm z-10">
                      <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"/>
                      <p className="text-zinc-300 font-medium animate-pulse">Scanning frequencies...</p>
                   </div>
                )}

                {peerDisconnected && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 backdrop-blur-md z-20">
                      <span className="text-4xl mb-2">👋</span>
                      <p className="text-white font-bold text-xl">Peer Disconnected</p>
                      <Button onClick={() => skipToNext(userProfile)} className="mt-6">Find Next Match</Button>
                   </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Controls Dock (Glass) */}
        {status !== "idle" && (
           <div className="fixed bottom-8 left-1/2 -translate-x-1/2 glass-dock px-6 py-4 rounded-3xl flex items-center gap-4 z-50">
              <button 
                onClick={toggleMute}
                className={`p-4 rounded-2xl transition-all duration-200 ${isMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/5 hover:bg-white/10 text-white'}`}
              >
                {isMuted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                )}
              </button>

              <button 
                onClick={toggleVideo}
                className={`p-4 rounded-2xl transition-all duration-200 ${isVideoOff ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/5 hover:bg-white/10 text-white'}`}
              >
                {isVideoOff ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                )}
              </button>

              <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

              <Button 
                onClick={() => skipToNext(userProfile)} 
                className="rounded-2xl px-8 shadow-emerald-500/20 text-lg"
              >
                Next ⏭️
              </Button>

              <button 
                onClick={() => setIsReportOpen(true)}
                className="p-4 rounded-2xl bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-500 transition-all border border-transparent hover:border-red-500/30"
                title="Report User"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
              </button>

              <button 
                onClick={() => window.location.reload()}
                className="p-4 rounded-2xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all ml-2"
                title="Disconnect"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
              </button>
           </div>
        )}

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
