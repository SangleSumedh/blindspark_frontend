"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import useWebRTC from "@/hooks/WebRTC";
import Lottie from 'lottie-react';
import fireAnimationData from '../animations/fire.json';
import useVideoModeration from "@/hooks/useVideoModeration";
import useAudioModeration from "@/hooks/useAudioModeration";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/hooks/useChat";
import VideoTile from "@/components/videoTile";
import ModerationOverlay from "@/components/ModerationOverlay";
import AudioModerationOverlay from "@/components/AudioModerationOverlay";
import LoginPage from "@/components/LoginPage";
import Navbar from "@/components/Navbar";
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
  UserMinus,
  AlertCircle,
  MessageSquareWarning,
  SendHorizonal,
  Clock,
  Zap,
  Move
} from "lucide-react";

const INTEREST_EMOJIS = {
  music: "🎵",
  gaming: "🎮",
  tech: "💻",
  art: "🎨",
  travel: "✈️",
  movies: "🎬",
  reading: "📚",
  sports: "🏆",
  food: "🍕",
  photography: "📸",
  pets: "🐾",
  memes: "😂",
  coding: "💻",
  fitness: "💪",
  fashion: "👗",
  nature: "🌿",
  crypto: "🪙"
};

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
    sessionEndingSoon,
    consentSent,
    connectionSaved,
    sessionTimedOut,
    emitConsent,
    setSessionEndingSoon
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

  // ── Session Countdown Timer ──
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const timerRef = useRef(null);

  useEffect(() => {
    if (connected && !connectionSaved) {
      // Set to 300 (or whatever initial value) only if it's the start of a new connection
      // To avoid resetting to 300 when connectionSaved changes, we only reset when connected becomes true initially
      // Actually, since we're using a ref, we can just clear the interval if connectionSaved becomes true.
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (connected && connectionSaved) {
      clearInterval(timerRef.current);
    } else {
      clearInterval(timerRef.current);
      setTimeLeft(300);
    }
    return () => clearInterval(timerRef.current);
  }, [connected, connectionSaved]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
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

      <Navbar status={status} peerDisconnected={peerDisconnected} />

      <div className="relative z-10 w-full max-w-6xl mx-auto p-6 md:p-12 flex-1 flex flex-col">


        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col w-full relative ${status === 'idle' ? 'justify-center items-center' : ''}`}>
          
          {status === "idle" ? (
            <Card className="max-w-xl w-full text-center py-8 md:py-12 px-6 md:px-8 border-zinc-800 bg-zinc-900/50">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-orange-500/20">
                <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-orange-500" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-2">Meet someone. No profiles. Just vibes.</h2>
              <p className="text-sm md:text-base text-zinc-400 mb-8">Connect with people who share your vibe. Safe, anonymous, and powered by smart matching.</p>
               <Button 
                 onClick={handleStart} 
                 variant="ghost"
                 size="lg" 
                 className="w-full text-lg border border-orange-500 text-white bg-transparent hover:bg-orange-500/10 transition-all shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2"
               >
                 Enter a Spark Session
                 <div style={{ width: 32, height: 32, marginTop: -4 }}>
                   <Lottie
                     animationData={fireAnimationData}
                     loop
                     autoplay
                     style={{ width: '100%', height: '100%' }}
                   />
                 </div>
               </Button>
            </Card>
          ) : (
            <div className="w-full flex-1 flex flex-col md:flex-row gap-4 relative min-h-0 py-4">
              
              {/* Local Video (Floating & Draggable) */}
               <Draggable 
                className="top-4 right-4 md:top-auto md:right-auto md:left-4 md:bottom-24"
                initialPos={{ x: 0, y: 0 }}
               >
                  <div className="w-24 h-32 md:w-48 md:h-36 rounded-xl md:rounded-2xl overflow-hidden border-2 border-zinc-800 bg-zinc-900 shadow-2xl relative group cursor-grab active:cursor-grabbing">
                    <VideoTile videoRef={localVideoRef} muted />
                    <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-[8px] font-bold text-zinc-300 pointer-events-none">YOU</div>
                    {/* Hover Hint */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none gap-1.5">
                      <Move size={14} className="text-white drop-shadow-md" />
                      <span className="text-white text-xs font-bold drop-shadow-md">Drag me</span>
                    </div>
                  </div>
               </Draggable>

              {/* Remote Video (Main) */}
              <div className="flex-1 rounded-3xl overflow-hidden border border-zinc-800 bg-black relative shadow-2xl group aspect-video self-center max-h-full">
                <div className={`w-full h-full transition-all duration-500 ${moderationState === 'blurred' || (peerModerationAlert && (peerModerationAlert.severity === 'blur' || peerModerationAlert.severity === 'mute' || peerModerationAlert.severity === 'terminate')) ? 'blur-[30px] scale-105' : ''}`}>
                  <VideoTile videoRef={remoteVideoRef} />
                </div>
                
                {/* HUD Elements (Inside Video Container) */}
                {connected && matchData && (
                  <>
                    {/* Top Left: User Info & Shared Vibes */}
                    <div className="absolute top-4 left-4 z-40 flex flex-col gap-2 animate-fade-in">
                      <div className="glass-panel px-4 py-2.5 rounded-2xl border border-orange-500/20 shadow-xl overflow-hidden flex items-center gap-3">
                         <div className="flex flex-col leading-tight">
                           <div className="text-[9px] text-zinc-500 uppercase font-black tracking-[0.2em]">Connected</div>
                           <div className="text-sm font-bold text-orange-400">{matchData.peerProfile?.displayName || "Anonymous"}</div>
                         </div>
                      </div>
                      
                      {/* Interest Emojis & Match Score */}
                      <div className="flex items-center gap-2 px-1">
                        {matchData.score != null && (
                          <div className="text-[10px] font-black text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded-lg border border-orange-500/20">
                            {matchData.score}%
                          </div>
                        )}
                        <div className="flex items-center -space-x-1">
                          {matchData.commonInterests?.map(i => (
                            <span key={i} title={i} className="text-lg drop-shadow-sm filter grayscale-[0.2] hover:grayscale-0 transition-all cursor-help">
                              {INTEREST_EMOJIS[i.toLowerCase()] || "✨"}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Top Right: Session Timer */}
                    <div className="absolute top-4 right-4 z-40 animate-fade-in">
                      <div className={`glass-panel px-4 py-2.5 rounded-2xl font-mono font-black tabular-nums border shadow-xl flex items-center gap-2 ${
                        connectionSaved 
                          ? "bg-green-500/20 text-green-400 border-green-500/20"
                          : timeLeft <= 30
                            ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse"
                            : "bg-black/40 text-zinc-300 border-white/10"
                      }`}>
                        <Clock size={14} className={timeLeft <= 30 ? "animate-pulse" : ""} />
                        {connectionSaved ? "∞" : formatTime(timeLeft)}
                      </div>
                    </div>
                  </>
                )}
                
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

                {/* Session Ending — Consent Prompt */}
                {sessionEndingSoon && !connectionSaved && !sessionTimedOut && !peerDisconnected && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/80 backdrop-blur-md z-30 animate-fade-in-up">
                    <div className="glass-panel rounded-3xl p-8 max-w-sm text-center border border-orange-500/20 shadow-2xl">
                      <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
                        <Sparkles className="w-8 h-8 text-orange-500" />
                      </div>

                      <h3 className="text-xl font-bold mb-2">Enjoying the conversation?</h3>
                      <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                        Session ends in <span className={`font-mono font-bold ${timeLeft <= 10 ? "text-red-400" : "text-orange-400"}`}>{formatTime(timeLeft)}</span>.
                        <br/><br/>
                        Stay connected to continue this video call and unlock text messaging with them later!
                      </p>

                      {consentSent ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                          <p className="text-sm text-zinc-400">Waiting for your partner...</p>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <Button
                            onClick={() => emitConsent(userProfile.displayName)}
                            className="flex-1 shadow-orange-500/20"
                          >
                            Yes, stay!
                          </Button>
                          <Button
                            onClick={() => setSessionEndingSoon(false)}
                            variant="secondary"
                            className="flex-1"
                          >
                            No thanks
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Connection Saved Toast */}
                {connectionSaved && !peerDisconnected && (
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 glass-panel px-6 py-3 rounded-2xl flex items-center gap-3 animate-fade-in-up border border-green-500/20 shadow-xl">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Zap className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-green-400">Connection Saved!</p>
                      <p className="text-[10px] text-zinc-400">Session extended.</p>
                    </div>
                  </div>
                )}

                {/* Session Timed Out Overlay */}
                {sessionTimedOut && !peerDisconnected && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 backdrop-blur-md z-20">
                    <AlertCircle className="w-12 h-12 text-orange-500 mb-2" />
                    <p className="text-white font-bold text-xl">Session Ended</p>
                    <p className="text-sm text-zinc-400 mt-1 mb-6">Your 5-minute session has expired.</p>
                    <Button onClick={() => {
                      handleSkipWithReset(userProfile);
                    }}>Find Next Match</Button>
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
