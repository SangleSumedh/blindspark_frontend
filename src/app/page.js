"use client";

import { useState, useEffect, useRef } from "react";
import useWebRTC from "@/hooks/WebRTC";
import useVideoModeration from "@/hooks/useVideoModeration";
import useAudioModeration from "@/hooks/useAudioModeration";
import VideoTile from "@/components/videoTile";
import ModerationOverlay from "@/components/ModerationOverlay";
import AudioModerationOverlay from "@/components/AudioModerationOverlay";
import { useAuth } from "@/context/AuthContext";
import LoginPage from "@/components/LoginPage";
import ReportModal from "@/components/ReportModal";
import ProfileSetup from "@/components/ProfileSetup";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Draggable from "@/components/ui/Draggable";
import { 
  ShieldAlert, 
  Sparkles, 
  LogOut, 
  SkipForward, 
  FlaskConical, 
  Zap,
  UserMinus,
  AlertCircle,
  MessageSquareWarning,
  SendHorizonal
} from "lucide-react";

const MODERATION_DEBUG = process.env.NEXT_PUBLIC_MODERATION_DEBUG === "true";

export default function Home() {
  const { user, userProfile, loading: authLoading, logout, refreshProfile } = useAuth();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const {
    localVideoRef,
    remoteVideoRef,
    findMatch,
    skipToNext,
    reportPeer,
    emitModerationViolation,
    role,
    connected,
    status,
    isMuted,
    isVideoOff,
    peerDisconnected,
    peerModerationAlert,
    personalModerationAlert,
    karmaUpdate,
    clearPeerModerationAlert,
    clearPersonalModerationAlert,
    clearKarmaUpdate,
    matchData,
    toggleMute,
    toggleVideo,
  } = useWebRTC();

  const {
    moderationState,
    moderationMessage,
    nsfwScore,
    faceDetected,
    modelsLoaded,
    resetModeration,
    simulateNsfwViolation,
  } = useVideoModeration(remoteVideoRef, connected);

  const {
    audioModerationState,
    audioModerationMessage,
    abuseScore,
    isListening,
    modelsLoaded: audioModelsLoaded,
    resetAudioModeration,
    simulateAbuseViolation,
    injectText,
  } = useAudioModeration(null, connected);

  const [debugTextInput, setDebugTextInput] = useState("");

  // Emit violation at EVERY escalation step (not just terminate)
  const lastVideoSeverity = useRef(null);
  useEffect(() => {
    const severityMap = { warning: "warning", blurred: "blur", terminated: "terminate" };
    const severity = severityMap[moderationState];
    if (severity && severity !== lastVideoSeverity.current) {
      lastVideoSeverity.current = severity;
      const violationType = severity === "terminate" ? "nsfw_auto_terminate" : `nsfw_${severity}`;
      emitModerationViolation(violationType, nsfwScore, severity);
      if (severity === "terminate") reportPeer();
    }
    if (moderationState === "clean") {
      lastVideoSeverity.current = null;
    }
  }, [moderationState, nsfwScore, emitModerationViolation, reportPeer]);

  // Emit violation at EVERY audio escalation step
  const lastAudioSeverity = useRef(null);
  useEffect(() => {
    const severityMap = { warning: "warning", muted: "mute", terminated: "terminate" };
    const severity = severityMap[audioModerationState];
    if (severity && severity !== lastAudioSeverity.current) {
      lastAudioSeverity.current = severity;
      const violationType = severity === "terminate" ? "audio_abuse_auto_terminate" : `audio_${severity}`;
      emitModerationViolation(violationType, abuseScore, severity);
      if (severity === "terminate") reportPeer();
    }
    if (audioModerationState === "clean") {
      lastAudioSeverity.current = null;
    }
  }, [audioModerationState, abuseScore, emitModerationViolation, reportPeer]);

  // Auto-mute local audio when audio moderation mutes the user
  useEffect(() => {
    if (audioModerationState === "muted" && !isMuted) {
      toggleMute();
    }
  }, [audioModerationState]);

  // Refresh profile when karma is updated by the server
  useEffect(() => {
    if (karmaUpdate) {
      refreshProfile();
      clearKarmaUpdate();
    }
  }, [karmaUpdate, refreshProfile, clearKarmaUpdate]);

  const handleSkipWithReset = (profile) => {
    resetModeration();
    resetAudioModeration();
    skipToNext(profile);
  };

  // Debug: submit typed text to audio moderation pipeline
  const handleDebugTextSubmit = (e) => {
    e.preventDefault();
    if (!debugTextInput.trim()) return;
    injectText(debugTextInput);
    setDebugTextInput("");
  };

  const handleStart = async () => {
    await findMatch(userProfile);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) return <LoginPage />;
  if (!userProfile) return <ProfileSetup onComplete={refreshProfile} />;

  // Ban check
  if (userProfile.isBanned) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-8 text-center">
        <ShieldAlert className="w-20 h-20 text-orange-500 mb-4" />
        <h2 className="text-3xl font-bold text-orange-500 mb-2">Account Suspended</h2>
        <p className="text-zinc-400 max-w-md">
          Your account has been flagged for violating our community guidelines.
        </p>
        <Button onClick={logout} variant="secondary" className="mt-8">Sign Out</Button>
      </div>
    );
  }

  return (
    <main className="relative flex flex-col items-center min-h-screen bg-zinc-950 text-white overflow-hidden selection:bg-orange-500/30">
      
      {/* Dynamic Background Mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-orange-900/10 blur-[120px] transition-all duration-1000 ${status === 'matched' ? 'bg-orange-600/20' : ''}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-red-900/10 blur-[120px] transition-all duration-1000 ${status === 'matched' ? 'bg-red-600/20' : ''}`} />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto p-4 md:p-6 flex flex-col h-screen">
        
        {/* Header (Glass Pill) */}
        <header className="flex justify-between items-center mb-6 glass rounded-full px-6 py-3 mx-4 md:mx-0">
          <div className="flex items-center gap-3">
            <img src="/Logo2.png" alt="BlindSpark Logo" className="h-8 w-auto" />
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight hidden sm:inline">BlindSpark</span>
              <div 
                className={`h-2.5 w-2.5 rounded-full transition-all duration-500 shadow-sm ${
                  peerDisconnected ? "bg-red-500 shadow-[0_0_8px_#ef4444]" :
                  status === 'matched' ? "bg-green-500 shadow-[0_0_8px_#22c55e]" :
                  (status === 'searching' || status === 'connecting') ? "bg-yellow-500 shadow-[0_0_8px_#eab308] animate-pulse" :
                  "bg-yellow-500/50 shadow-[0_0_4px_#eab30855]" // Standby
                }`}
                title={peerDisconnected ? "Peer Disconnected" : status === 'matched' ? "Live" : status === 'searching' ? "Searching..." : status === 'connecting' ? "Connecting..." : "Standby"}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-orange-400">{userProfile.displayName}</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest">{userProfile.karma} Karma</span>
            </div>
            <button onClick={logout} className="text-zinc-400 hover:text-white transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col justify-center items-center w-full relative">
          
          {/* Status Badge */}
          {/* Match Info Popup (Corner) */}
          {connected && matchData && (
            <div className="fixed top-28 left-6 md:left-12 z-40 glass-panel px-4 py-2.5 rounded-2xl flex flex-col md:flex-row items-center gap-3 animate-fade-in-up border-orange-500/20 shadow-xl overflow-hidden">
               <div className="flex flex-col items-center md:items-start leading-tight">
                 <div className="text-[9px] text-zinc-500 uppercase font-black tracking-[0.2em]">Connected</div>
                 <div className="text-sm font-bold text-orange-400">{matchData.peerProfile?.displayName || "Anonymous"}</div>
               </div>
               
               <div className="h-6 w-[1px] bg-white/10 hidden md:block" />

               <div className="flex items-center gap-3">
                 {/* Match Score */}
                 {matchData.score != null && (
                   <div className={`text-[10px] font-black px-2 py-1 rounded-lg ${
                     matchData.score >= 70 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' :
                     matchData.score >= 40 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' :
                     'bg-red-500/20 text-red-400 border border-red-500/20'
                   }`}>
                     {matchData.score}%
                   </div>
                 )}

                 {matchData.commonInterests?.length > 0 && (
                   <div className="flex gap-1.5 font-bold">
                     {matchData.commonInterests.slice(0, 2).map(i => (
                       <div key={i} className="bg-white/5 border border-white/10 px-2 py-1 rounded-lg text-[9px] text-zinc-300 uppercase tracking-widest whitespace-nowrap">
                         {i}
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            </div>
          )}

          {status === "idle" ? (
            <Card className="max-w-md w-full text-center py-8 md:py-12 px-6 md:px-8 border-zinc-800 bg-zinc-900/50">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-orange-500/20">
                <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-orange-500" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-2">Find your sparq</h2>
              <p className="text-sm md:text-base text-zinc-400 mb-8">Connect with people who share your vibe. Safe, anonymous, and powered by smart matching.</p>
              <Button onClick={handleStart} size="lg" className="w-full text-lg shadow-orange-900/50">Start Matching</Button>
            </Card>
          ) : (
            <div className="w-full h-full max-h-[85vh] md:max-h-[70vh] flex flex-col md:flex-row gap-4 relative">
              
              {/* Local Video (Floating & Draggable) */}
               <Draggable 
                className="top-4 right-4 md:top-auto md:right-auto md:left-4 md:bottom-24"
                initialPos={{ x: 0, y: 0 }}
               >
                  <div className="w-24 h-32 md:w-48 md:h-36 rounded-xl md:rounded-2xl overflow-hidden border-2 border-zinc-800 bg-zinc-900 shadow-2xl relative group cursor-grab active:cursor-grabbing">
                    <VideoTile videoRef={localVideoRef} muted />
                    <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-[8px] font-bold text-zinc-300 pointer-events-none">YOU</div>
                    {/* Hover Hint */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="text-white text-xs font-bold drop-shadow-md">✋ Drag me</span>
                    </div>
                  </div>
               </Draggable>

              {/* Remote Video (Main) */}
              <div className="flex-1 rounded-3xl overflow-hidden border border-zinc-800 bg-black relative shadow-2xl group">
                <div className={`w-full h-full transition-all duration-500 ${moderationState === 'blurred' || (peerModerationAlert && (peerModerationAlert.severity === 'blur' || peerModerationAlert.severity === 'mute' || peerModerationAlert.severity === 'terminate')) ? 'blur-[30px] scale-105' : ''}`}>
                  <VideoTile videoRef={remoteVideoRef} />
                </div>
                
                {/* Video Moderation Overlay */}
                <ModerationOverlay 
                  moderationState={moderationState} 
                  moderationMessage={moderationMessage}
                  onSkip={() => handleSkipWithReset(userProfile)}
                  peerModerationAlert={peerModerationAlert}
                  onDismissAlert={clearPeerModerationAlert}
                  personalModerationAlert={personalModerationAlert}
                  onDismissPersonalAlert={clearPersonalModerationAlert}
                />

                {/* Audio Moderation Overlay */}
                <AudioModerationOverlay
                  audioModerationState={audioModerationState}
                  audioModerationMessage={audioModerationMessage}
                  abuseScore={abuseScore}
                  onSkip={() => handleSkipWithReset(userProfile)}
                />

                {/* Overlays */}
                {!connected && !peerDisconnected && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/80 backdrop-blur-sm z-10">
                      <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-4"/>
                      <p className="text-zinc-300 font-medium animate-pulse">Scanning frequencies...</p>
                   </div>
                )}

                {peerDisconnected && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 backdrop-blur-md z-20">
                      <UserMinus className="w-12 h-12 text-orange-500 mb-2" />
                      <p className="text-white font-bold text-xl">Peer Disconnected</p>
                      <Button onClick={() => handleSkipWithReset(userProfile)} className="mt-6">Find Next Match</Button>
                   </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Controls Dock (Glass) */}
        {status !== "idle" && (
           <div className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 glass-dock px-4 py-3 md:px-6 md:py-4 rounded-2xl md:rounded-3xl flex items-center gap-2 md:gap-4 z-50 w-[95%] md:w-auto justify-between md:justify-center max-w-sm md:max-w-none">
              <button 
                onClick={toggleMute}
                disabled={audioModerationState === "muted" || audioModerationState === "terminated"}
                title={audioModerationState === "muted" ? "Muted by moderation system" : undefined}
                className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-200 ${
                  (audioModerationState === "muted" || audioModerationState === "terminated")
                    ? 'bg-red-500/20 text-red-500 opacity-50 cursor-not-allowed'
                    : isMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
                    : 'bg-white/5 hover:bg-white/10 text-white'
                }`}
              >
                {isMuted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                )}
              </button>

              <button 
                onClick={toggleVideo}
                className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-200 ${isVideoOff ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/5 hover:bg-white/10 text-white'}`}
              >
                {isVideoOff ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                )}
              </button>

              <div className="h-6 md:h-8 w-[1px] bg-white/10 mx-1 md:mx-2"></div>

              <Button 
                onClick={() => handleSkipWithReset(userProfile)} 
                className="rounded-xl md:rounded-2xl px-4 md:px-8 shadow-orange-500/20 text-sm md:text-lg flex-1"
              >
                Next <SkipForward className="ml-2 w-4 h-4 md:w-5 md:h-5" />
              </Button>

              <div className="flex gap-2">
                {/* Debug: Simulate NSFW button */}
                {MODERATION_DEBUG && (
                  <button
                    onClick={simulateNsfwViolation}
                    className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-purple-500/10 hover:bg-purple-500/30 text-purple-400 hover:text-purple-300 transition-all border border-transparent hover:border-purple-500/30"
                    title="🧪 Simulate NSFW (Debug)"
                  >
                    <FlaskConical size={20} />
                  </button>
                )}

                {/* Debug: Simulate Audio Abuse button */}
                {MODERATION_DEBUG && (
                  <button
                    onClick={simulateAbuseViolation}
                    className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/30 text-cyan-400 hover:text-cyan-300 transition-all border border-transparent hover:border-cyan-500/30"
                    title="🧪 Simulate Audio Abuse (Debug)"
                  >
                    <MessageSquareWarning size={20} />
                  </button>
                )}

                <button 
                  onClick={() => setIsReportOpen(true)}
                  className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-500 transition-all border border-transparent hover:border-red-500/30"
                  title="Report User"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                </button>

                <button 
                  onClick={() => window.location.reload()}
                  className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all"
                  title="Disconnect"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                </button>
              </div>
           </div>
        )}

        {/* Debug: Text Input Bar for Audio Moderation Testing */}
        {MODERATION_DEBUG && status !== "idle" && (
          <form 
            onSubmit={handleDebugTextSubmit}
            className="fixed bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-lg"
          >
            <div className="glass-panel rounded-2xl flex items-center gap-2 px-4 py-2.5 border border-cyan-500/20 shadow-lg shadow-cyan-500/5">
              <MessageSquareWarning size={16} className="text-cyan-400 flex-shrink-0" />
              <input
                type="text"
                value={debugTextInput}
                onChange={(e) => setDebugTextInput(e.target.value)}
                placeholder="Type text to test audio moderation..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none"
              />
              <div className="flex items-center gap-2 flex-shrink-0">
                {audioModerationState !== "clean" && (
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${
                    audioModerationState === "terminated" ? "bg-red-500/20 text-red-400 border border-red-500/20" :
                    audioModerationState === "muted" ? "bg-red-500/20 text-red-400 border border-red-500/20" :
                    "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20"
                  }`}>
                    {audioModerationState.toUpperCase()}
                  </span>
                )}
                {abuseScore > 0 && (
                  <span className="text-[10px] font-mono text-zinc-500">
                    score:{abuseScore}
                  </span>
                )}
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/30 text-cyan-400 hover:text-cyan-300 transition-all"
                >
                  <SendHorizonal size={16} />
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ReportModal */}
        <ReportModal 
          isOpen={isReportOpen} 
          onClose={() => setIsReportOpen(false)}
          remoteVideoRef={remoteVideoRef}
          reportedUserId={matchData?.peerProfile?.id}
          onReportSubmitted={() => {
            reportPeer();
            handleSkipWithReset(userProfile);
          }}
        />
      </div>
    </main>
  );
}
