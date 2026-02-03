"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function useWebRTC() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
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
    socketRef.current = io(BACKEND_URL, { 
      transports: ["websocket"],
      extraHeaders: {
        "ngrok-skip-browser-warning": "true"
      }
    });

    // 1. Initial Match - Setup PC immediately
    socketRef.current.on("matched", async ({ roomId, commonInterests, score, peerProfile }) => {
      currentRoomId.current = roomId;
      setMatchData({ commonInterests, score, peerProfile });
      setStatus("connecting"); // Show connecting state during handshake
      setPeerDisconnected(false);
      console.log("Matched in room:", roomId, "Score:", score);

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
      cleanupPC();
    });

    return () => {
      socketRef.current?.disconnect();
      cleanupPC();
    };
  }, []);

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
      setStatus("idle");
      alert("Please enable camera access to continue.");
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
    
    // Notify server we're leaving the current room
    if (socketRef.current && currentRoomId.current) {
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
    pendingCandidatesRef.current = [];
    roleRef.current = null;
    setRole(null);
    setConnected(false);
    setPeerDisconnected(false);
    setMatchData(null);
    
    // Immediately join queue again
    setStatus("searching");
    if (socketRef.current) {
      socketRef.current.emit("join-queue", { userProfile });
    }
  };

  return {
    localVideoRef,
    remoteVideoRef,
    matchData,
    findMatch,
    skipToNext,
    role,
    connected,
    status,
    isMuted,
    isVideoOff,
    peerDisconnected,
    toggleMute,
    toggleVideo,
  };
}
