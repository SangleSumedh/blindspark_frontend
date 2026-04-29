"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/context/SocketContext";

export function useChatSocket(activeConnectionId) {
  const socket = useSocket();
  const [peerIsTyping, setPeerIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket || !activeConnectionId) {
      setPeerIsTyping(false);
      setOnlineUsers([]);
      return;
    }

    socket.emit("join-chat", { connectionId: activeConnectionId });

    socket.on("chat-presence", ({ onlineUsers }) => {
      setOnlineUsers(onlineUsers);
    });

    socket.on("peer-typing", ({ connectionId }) => {
      if (connectionId === activeConnectionId) {
        setPeerIsTyping(true);
      }
    });

    socket.on("peer-stop-typing", ({ connectionId }) => {
      if (connectionId === activeConnectionId) {
        setPeerIsTyping(false);
      }
    });

    return () => {
      socket.emit("leave-chat", { connectionId: activeConnectionId });
      socket.off("chat-presence");
      socket.off("peer-typing");
      socket.off("peer-stop-typing");
      setPeerIsTyping(false);
    };
  }, [socket, activeConnectionId]);

  const emitTyping = useCallback(() => {
    if (!socket || !activeConnectionId) return;

    socket.emit("typing", { connectionId: activeConnectionId });

    // Debounce stop typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop-typing", { connectionId: activeConnectionId });
    }, 2000);
  }, [socket, activeConnectionId]);

  const emitStopTyping = useCallback(() => {
    if (!socket || !activeConnectionId) return;
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    socket.emit("stop-typing", { connectionId: activeConnectionId });
  }, [socket, activeConnectionId]);

  return {
    peerIsTyping,
    onlineUsers,
    emitTyping,
    emitStopTyping
  };
}
