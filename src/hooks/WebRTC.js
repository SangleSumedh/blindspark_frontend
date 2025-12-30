"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const BACKEND_URL = "https://vx3vbn0n-5000.inc1.devtunnels.ms/";

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
  const [status, setStatus] = useState("idle");

  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  };

  useEffect(() => {
    socketRef.current = io(BACKEND_URL, { transports: ["websocket"] });

    // 1. Initial Match - Setup PC immediately
    socketRef.current.on("matched", async ({ roomId }) => {
      currentRoomId.current = roomId;
      setStatus("matched");
      console.log("Matched in room:", roomId);

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
      setConnected(pc.connectionState === "connected");
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

  const findMatch = async () => {
    setStatus("searching");
    try {
      await initMedia();
      if (socketRef.current) {
        socketRef.current.emit("join-queue");
      }
    } catch (error) {
      setStatus("idle");
      alert("Please enable camera access to continue.");
    }
  };

  return {
    localVideoRef,
    remoteVideoRef,
    findMatch,
    role,
    connected,
    status,
  };
}
