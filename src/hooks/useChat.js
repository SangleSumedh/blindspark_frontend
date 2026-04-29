"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  limit, 
  startAfter,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const MESSAGES_LIMIT = 50;

export function useChat(userId) {
  const [connections, setConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  
  const [activeConnectionId, setActiveConnection] = useState(null);
  
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const lastDocRef = useRef(null);

  // 1. Fetch Connections (real-time)
  useEffect(() => {
    if (!userId) {
      setConnections([]);
      setLoadingConnections(false);
      return;
    }

    const q = query(
      collection(db, "connections"),
      where("participants", "array-contains", userId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setConnections(conns);
      setLoadingConnections(false);
    }, (error) => {
      console.error("Error fetching connections:", error);
      setLoadingConnections(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // 2. Fetch Messages for active connection (real-time)
  useEffect(() => {
    if (!activeConnectionId) {
      setMessages([]);
      setHasMore(true);
      lastDocRef.current = null;
      return;
    }

    setLoadingMessages(true);
    const messagesRef = collection(db, `connections/${activeConnectionId}/messages`);
    const q = query(messagesRef, orderBy("timestamp", "desc"), limit(MESSAGES_LIMIT));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse(); // Reverse so oldest is first
      
      setMessages(newMessages);
      
      if (snapshot.docs.length > 0) {
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1]; // The oldest document in this batch
      } else {
        lastDocRef.current = null;
      }
      
      setHasMore(snapshot.docs.length === MESSAGES_LIMIT);
      setLoadingMessages(false);
    }, (error) => {
      console.error("Error fetching messages:", error);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [activeConnectionId]);

  // 3. Load older messages (pagination)
  const loadOlderMessages = useCallback(async () => {
    if (!activeConnectionId || !hasMore || !lastDocRef.current) return;

    setLoadingMessages(true);
    try {
      const messagesRef = collection(db, `connections/${activeConnectionId}/messages`);
      const q = query(
        messagesRef, 
        orderBy("timestamp", "desc"), 
        startAfter(lastDocRef.current),
        limit(MESSAGES_LIMIT)
      );

      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const olderMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).reverse();

        setMessages(prev => [...olderMessages, ...prev]);
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
        setHasMore(snapshot.docs.length === MESSAGES_LIMIT);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading older messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  }, [activeConnectionId, hasMore]);

  // 4. Send Message
  const sendMessage = useCallback(async (text, senderName) => {
    if (!activeConnectionId || !userId || !text.trim()) return;

    const connection = connections.find(c => c.id === activeConnectionId);
    if (!connection) return;

    const otherParticipantId = connection.participants.find(id => id !== userId);

    try {
      const messagesRef = collection(db, `connections/${activeConnectionId}/messages`);
      const newMsg = {
        senderId: userId,
        senderName: senderName || "Anonymous",
        text: text.trim(),
        timestamp: serverTimestamp(),
        readBy: [userId]
      };

      await addDoc(messagesRef, newMsg);

      // Update parent connection
      const connRef = doc(db, "connections", activeConnectionId);
      
      // Calculate new unread counts
      const currentUnread = connection.unreadCount || {};
      const newUnread = {
        ...currentUnread,
        [otherParticipantId]: (currentUnread[otherParticipantId] || 0) + 1
      };

      await updateDoc(connRef, {
        lastMessage: {
          text: text.trim(),
          senderId: userId,
          timestamp: new Date().toISOString()
        },
        unreadCount: newUnread
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }, [activeConnectionId, userId, connections]);

  // 5. Mark as read
  const markAsRead = useCallback(async () => {
    if (!activeConnectionId || !userId) return;

    const connection = connections.find(c => c.id === activeConnectionId);
    if (!connection) return;
    
    const unreadCount = connection.unreadCount?.[userId] || 0;
    
    if (unreadCount > 0) {
      try {
        const connRef = doc(db, "connections", activeConnectionId);
        
        const newUnread = { ...connection.unreadCount };
        newUnread[userId] = 0;

        await updateDoc(connRef, {
          unreadCount: newUnread
        });
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    }
  }, [activeConnectionId, userId, connections]);

  // Calculate total unread
  const totalUnread = connections.reduce((acc, curr) => {
    return acc + (curr.unreadCount?.[userId] || 0);
  }, 0);

  return {
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
    totalUnread
  };
}
