"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const BACKEND_URL = "https://vx3vbn0n-5000.inc1.devtunnels.ms";

export default function useWebRTC() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const roleRef = useRef(null);

  // CRITICAL: We use a ref for roomId because signaling listeners
  // need the latest value without triggering re-renders.
  const currentRoomId = useRef(null);
  const pendingCandidatesRef = useRef([]);

  const [role, setRole] = useState(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("idle"); // 'idle', 'searching', 'matched'

  const iceServers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  useEffect(() => {
    socketRef.current = io(BACKEND_URL, { transports: ["websocket"] });

    // Listen for the match from the server queue
    socketRef.current.on("matched", ({ roomId }) => {
      currentRoomId.current = roomId;
      setStatus("matched");
      console.log("Matched in room:", roomId);
    });

    socketRef.current.on("waiting", (msg) => {
      setStatus("searching");
      console.log(msg);
    });

    socketRef.current.on("role", (assignedRole) => {
      roleRef.current = assignedRole;
      setRole(assignedRole);
    });

    socketRef.current.on("ready", async () => {
      if (roleRef.current !== "caller") return;
      await ensureMediaAndPC();
      const pc = pcRef.current;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Use dynamic roomId
      socketRef.current.emit("offer", { roomId: currentRoomId.current, offer });
    });

    socketRef.current.on("offer", async (offer) => {
      if (roleRef.current === "caller") return;
      await ensureMediaAndPC();
      const pc = pcRef.current;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Use dynamic roomId
      socketRef.current.emit("answer", {
        roomId: currentRoomId.current,
        answer,
      });
      flushPendingCandidates();
    });

    socketRef.current.on("answer", async (answer) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        flushPendingCandidates();
      }
    });

    socketRef.current.on("ice-candidate", async (candidate) => {
      if (pcRef.current?.remoteDescription) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    });

    return () => {
      socketRef.current?.disconnect();
      pcRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (localStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [status, role]);

  /* --- Helper Functions --- */

  // Inside useWebRTC.js
  async function initMedia() {
    if (localStreamRef.current) {
      // Re-bind if stream exists but video element might have re-mounted
      if (localVideoRef.current && !localVideoRef.current.srcObject) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      return localStreamRef.current;
    }

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
    }
  }

  function createPeerConnection() {
    if (pcRef.current) return pcRef.current;
    const pc = new RTCPeerConnection(iceServers);
    pcRef.current = pc;

    pc.ontrack = (event) => {
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
      setConnected(pc.connectionState === "connected");
    };

    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current);
    });

    return pc;
  }

  async function ensureMediaAndPC() {
    await initMedia();
    createPeerConnection();
  }

  function flushPendingCandidates() {
    if (!pcRef.current?.remoteDescription) return;
    pendingCandidatesRef.current.forEach((candidate) => {
      pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    });
    pendingCandidatesRef.current = [];
  }

  // New function to trigger the server-side queue
  const findMatch = async () => {
    await initMedia(); // Good practice to have camera ready before matching
    socketRef.current.emit("join-queue");
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
