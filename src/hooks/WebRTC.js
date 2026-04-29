"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/context/SocketContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const DEBUG = process.env.NEXT_PUBLIC_MODERATION_DEBUG === "true";

export default function useWebRTC() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socket = useSocket();
  const socketRef = useRef(socket);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const roleRef = useRef(null);

  const currentRoomId = useRef(null);
  const pendingCandidatesRef = useRef([]);

  const [role, setRole] = useState(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | searching | connecting | matched
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [peerDisconnected, setPeerDisconnected] = useState(false);
  const [matchData, setMatchData] = useState(null); // { commonInterests, score, peerProfile }
  const [peerModerationAlert, setPeerModerationAlert] = useState(null); // { type, severity, message }
  const [personalModerationAlert, setPersonalModerationAlert] = useState(null); // { type, severity, message }
  const [karmaUpdate, setKarmaUpdate] = useState(null); // { karma, isBanned }
  
  // Session states
  const [sessionEndingSoon, setSessionEndingSoon] = useState(false);
  const [consentSent, setConsentSent] = useState(false);
  const [connectionSaved, setConnectionSaved] = useState(false);
  const [sessionTimedOut, setSessionTimedOut] = useState(false);

  const matchedPeerOdId = useRef(null); // track peer's odId for reporting

  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      // TURN servers for NAT traversal
      {
        urls: process.env.NEXT_PUBLIC_TURN_URL,
        username: process.env.NEXT_PUBLIC_TURN_USERNAME,
        credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
      },
      {
        urls: process.env.NEXT_PUBLIC_TURN_URL_443,
        username: process.env.NEXT_PUBLIC_TURN_USERNAME,
        credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
      },
    ].filter(server => server.urls), // Filter out undefined entries if env vars not set
  };

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  useEffect(() => {
    if (!socketRef.current) return;

    // 1. Initial Match - Setup PC immediately
    socketRef.current.on("matched", async ({ roomId, commonInterests, score, peerProfile }) => {
      currentRoomId.current = roomId;
      matchedPeerOdId.current = peerProfile?.id || null;
      setMatchData({ commonInterests, score, peerProfile });
      setStatus("connecting"); // Show connecting state during handshake
      setPeerDisconnected(false);
      console.log("Matched in room:", roomId, "Score:", score + "%", "Common:", commonInterests);

      // Crucial: Initialize PC as soon as we know a match exists
      await ensureMediaAndPC();
    });

    socketRef.current.on("waiting", (msg) => {
      setStatus("searching");
      console.log(msg);
    });

    socketRef.current.on("role", (assignedRole) => {
      roleRef.current = assignedRole;
      setRole(assignedRole);
    });

    // 2. Offer/Answer Handshake
    socketRef.current.on("ready", async () => {
      if (roleRef.current !== "caller") return;

      console.log("Caller: Creating Offer");
      const pc = pcRef.current;
      if (!pc) return;

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current.emit("offer", {
          roomId: currentRoomId.current,
          offer,
        });
      } catch (err) {
        console.error("Failed to create offer:", err);
      }
    });

    socketRef.current.on("offer", async (offer) => {
      if (roleRef.current === "caller") return;

      console.log("Callee: Received Offer");
      await ensureMediaAndPC();
      const pc = pcRef.current;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketRef.current.emit("answer", {
          roomId: currentRoomId.current,
          answer,
        });
        flushPendingCandidates();
      } catch (err) {
        console.error("Failed to handle offer:", err);
      }
    });

    socketRef.current.on("answer", async (answer) => {
      console.log("Received Answer");
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        flushPendingCandidates();
      }
    });

    // 3. ICE Candidates
    socketRef.current.on("ice-candidate", async (candidate) => {
      if (pcRef.current?.remoteDescription) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    });

    // 4. Handle peer disconnection
    socketRef.current.on("peer-disconnected", () => {
      console.log("Peer disconnected");
      setPeerDisconnected(true);
      setConnected(false);
      setPeerModerationAlert(null);
      cleanupPC();
    });

    // 5. Handle victim-side moderation alerts from server
    socketRef.current.on("peer-moderation-alert", (alert) => {
      console.log("[Moderation] Peer alert received:", alert);
      setPeerModerationAlert(alert);
    });

    // 6. Handle violator-side system warnings from server
    socketRef.current.on("system-warning-alert", (alert) => {
      console.log("[Moderation] System warning received:", alert);
      setPersonalModerationAlert(alert);
    });

    // 7. Handle karma update notifications
    socketRef.current.on("karma-updated", (data) => {
      console.log("[Moderation] Karma updated:", data);
      setKarmaUpdate(data);
    });

    // 8. Session timer events
    socketRef.current.on("session-ending-soon", ({ timeLeftMs }) => {
      console.log(`[Session] Ending soon — ${timeLeftMs / 1000}s left`);
      setSessionEndingSoon(true);
    });

    socketRef.current.on("session-timeout", () => {
      console.log("[Session] Timed out");
      setSessionTimedOut(true);
      setConnected(false);
      setSessionEndingSoon(false);
      cleanupPC();
    });

    // 9. Consent events
    socketRef.current.on("consent-ack", ({ waitingForPeer }) => {
      console.log("[Consent] Acknowledged, waiting for peer:", waitingForPeer);
      // consentSent is already true from emitConsent()
    });

    socketRef.current.on("connection-saved", ({ connectionId }) => {
      console.log("[Consent] Connection saved:", connectionId);
      setConnectionSaved(true);
    });

    return () => {
      socketRef.current?.off("matched");
      socketRef.current?.off("waiting");
      socketRef.current?.off("role");
      socketRef.current?.off("ready");
      socketRef.current?.off("offer");
      socketRef.current?.off("answer");
      socketRef.current?.off("ice-candidate");
      socketRef.current?.off("peer-disconnected");
      socketRef.current?.off("peer-moderation-alert");
      socketRef.current?.off("system-warning-alert");
      socketRef.current?.off("karma-updated");
      socketRef.current?.off("session-ending-soon");
      socketRef.current?.off("session-timeout");
      socketRef.current?.off("consent-ack");
      socketRef.current?.off("connection-saved");
      cleanupPC();
    };
  }, [socketRef.current]);

  /* --- Helper Functions --- */

  const cleanupPC = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  };

  async function initMedia() {
    if (localStreamRef.current) return localStreamRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error("Media Error:", err);
      
      // In debug mode, we can proceed with a dummy stream to allow the WebRTC handshake to complete
      if (DEBUG) {
        console.warn("[DEBUG] Creating dummy black stream to allow connection testing");
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#09090b"; // Match our zinc-950/background
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw some "Debug" text so user knows it's dummy
        ctx.font = "24px Arial";
        ctx.fillStyle = "#3f3f46";
        ctx.textAlign = "center";
        ctx.fillText("DEBUG MODE: NO CAMERA", 320, 240);
        
        const stream = canvas.captureStream(10); // 10 FPS
        
        // Add a silent audio track so negotiation still happens for audio
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const dst = audioCtx.createMediaStreamDestination();
          oscillator.connect(dst);
          // Don't start the oscillator, we just want the track
          const silentTrack = dst.stream.getAudioTracks()[0];
          if (silentTrack) stream.addTrack(silentTrack);
        } catch (e) {
          console.warn("Failed to create dummy audio track", e);
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        return stream;
      }
      
      throw err;
    }
  }

  function createPeerConnection() {
    if (pcRef.current) return pcRef.current;

    console.log("Creating new RTCPeerConnection");
    const pc = new RTCPeerConnection(iceServers);
    pcRef.current = pc;

    pc.ontrack = (event) => {
      console.log("Received Remote Track");
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && currentRoomId.current) {
        socketRef.current.emit("ice-candidate", {
          roomId: currentRoomId.current,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection State:", pc.connectionState);
      const isConnected = pc.connectionState === "connected";
      setConnected(isConnected);
      if (isConnected) {
        setStatus("matched");
      }
      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "disconnected"
      ) {
        setStatus("idle");
      }
    };

    // Add local tracks to the connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    return pc;
  }

  async function ensureMediaAndPC() {
    await initMedia();
    createPeerConnection();
  }

  function flushPendingCandidates() {
    if (!pcRef.current?.remoteDescription) return;
    pendingCandidatesRef.current.forEach((candidate) => {
      pcRef.current
        .addIceCandidate(new RTCIceCandidate(candidate))
        .catch(console.error);
    });
    pendingCandidatesRef.current = [];
  }

   const findMatch = async (userProfile) => {
    setStatus("searching");
    setPeerDisconnected(false);
    try {
      await initMedia();
      if (socketRef.current) {
        socketRef.current.emit("join-queue", { userProfile });
      }
    } catch (error) {
      console.error("Media initialization failed:", error);
      // In debug mode, we allow joining even without a camera
      if (DEBUG) {
        console.warn("[DEBUG] Proceeding without camera/audio due to DEBUG mode");
        if (socketRef.current) {
          socketRef.current.emit("join-queue", { userProfile });
        }
      } else {
        setStatus("idle");
        alert("Please enable camera access to continue.");
      }
    }
  };

  // Toggle audio mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle video on/off
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // Skip current peer and find next stranger
  const skipToNext = (userProfile) => {
    console.log("Skipping to next stranger");
    
    // Notify server about the skip (for behavior tracking)
    if (socketRef.current && currentRoomId.current) {
      socketRef.current.emit("skip-peer", { roomId: currentRoomId.current });
      socketRef.current.emit("leave-room", { roomId: currentRoomId.current });
    }
    
    // Clean up current peer connection
    cleanupPC();
    
    // Clear remote video
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    // Reset state
    currentRoomId.current = null;
    matchedPeerOdId.current = null;
    pendingCandidatesRef.current = [];
    roleRef.current = null;
    setRole(null);
    setConnected(false);
    setPeerDisconnected(false);
    setMatchData(null);
    setPeerModerationAlert(null);
    setPersonalModerationAlert(null);
    setKarmaUpdate(null);
    
    setSessionEndingSoon(false);
    setConsentSent(false);
    setConnectionSaved(false);
    setSessionTimedOut(false);
    
    // Immediately join queue again
    setStatus("searching");
    if (socketRef.current) {
      socketRef.current.emit("join-queue", { userProfile });
    }
  };

  // Report peer (emit to backend for behavior tracking)
  const reportPeer = () => {
    if (socketRef.current && matchedPeerOdId.current) {
      socketRef.current.emit("report-peer", { reportedOdId: matchedPeerOdId.current });
    }
  };

  // Emit moderation violation to backend (called by moderation system)
  const emitModerationViolation = (violationType, nsfwScore, severity = "warning") => {
    if (socketRef.current && currentRoomId.current) {
      socketRef.current.emit("moderation-violation", {
        roomId: currentRoomId.current,
        violationType,
        nsfwScore,
        severity,
      });
    }
  };

  // Emit consent to save connection
  const emitConsent = (displayName) => {
    if (socketRef.current && currentRoomId.current) {
      socketRef.current.emit("consent-to-connect", { displayName });
      setConsentSent(true);
    }
  };

  // Clear alerts (for dismissing)
  const clearPeerModerationAlert = () => setPeerModerationAlert(null);
  const clearPersonalModerationAlert = () => setPersonalModerationAlert(null);
  const clearKarmaUpdate = () => setKarmaUpdate(null);

  return {
    localVideoRef,
    remoteVideoRef,
    matchData,
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
    toggleMute,
    toggleVideo,
    sessionEndingSoon,
    consentSent,
    connectionSaved,
    sessionTimedOut,
    emitConsent,
  };
}
