"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Configuration ──────────────────────────────────────────────
const SCAN_INTERVAL_MS = 5000; // 5 s between ticks
const NSFW_THRESHOLD = 0.85;   // Porn + Hentai combined probability
const NSFW_SINGLE_CLASS_MIN = 0.50; // At least one class must exceed this individually
const NO_FACE_TIMEOUT_MS = 10000; // 10 s continuous absence
const COOLDOWN_MS = 30000;     // 30 s clean frames to reset strikes
const STRIKE_WARNING = 1;
const STRIKE_BLUR = 2;
const STRIKE_TERMINATE = 3;
const DEBUG = process.env.NEXT_PUBLIC_MODERATION_DEBUG === "true";

export default function useVideoModeration(remoteVideoRef, connected) {
  // ─── State ──────────────────────────────────────────────────
  const [moderationState, setModerationState] = useState("clean"); // clean | warning | blurred | terminated
  const [moderationMessage, setModerationMessage] = useState("");
  const [nsfwScore, setNsfwScore] = useState(0);
  const [faceDetected, setFaceDetected] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // ─── Refs (mutable across renders, no re-render cost) ──────
  const nsfwModelRef = useRef(null);
  const blazefaceModelRef = useRef(null);
  const canvasRef = useRef(null);
  const tickCountRef = useRef(0);
  const strikeCountRef = useRef(0);
  const noFaceSinceRef = useRef(null); // timestamp when face first disappeared
  const lastCleanRef = useRef(null);   // timestamp of last clean frame
  const intervalRef = useRef(null);

  // ─── Load Models (once) ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      try {
        // Dynamic imports to avoid SSR issues with TF.js
        const tf = await import("@tensorflow/tfjs");
        await tf.ready();

        const nsfwjs = await import("nsfwjs");
        const blazeface = await import("@tensorflow-models/blazeface");

        const [nsfwModel, faceModel] = await Promise.all([
          nsfwjs.load(),
          blazeface.load(),
        ]);

        if (cancelled) return;

        nsfwModelRef.current = nsfwModel;
        blazefaceModelRef.current = faceModel;
        setModelsLoaded(true);

        if (DEBUG) console.log("[Moderation] [OK] Models loaded");
      } catch (err) {
        console.error("[Moderation] Failed to load models:", err);
      }
    }

    loadModels();

    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Hidden Canvas (for frame capture) ─────────────────────
  useEffect(() => {
    const c = document.createElement("canvas");
    c.width = 224;  // MobileNet input size
    c.height = 224;
    canvasRef.current = c;
  }, []);

  // ─── Frame Capture Helper ─────────────────────────────────
  const captureFrame = useCallback(() => {
    const video = remoteVideoRef?.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
  }, [remoteVideoRef]);

  // ─── Escalation Logic ─────────────────────────────────────
  const applyEscalation = useCallback((strikes, reason) => {
    if (strikes >= STRIKE_TERMINATE) {
      setModerationState("terminated");
      setModerationMessage(reason || "Session terminated for policy violation.");
    } else if (strikes >= STRIKE_BLUR) {
      setModerationState("blurred");
      setModerationMessage(reason || "Inappropriate content detected. Video hidden.");
    } else if (strikes >= STRIKE_WARNING) {
      setModerationState("warning");
      setModerationMessage(reason || "Potentially inappropriate content detected.");
    }
  }, []);

  // ─── NSFW Scan ────────────────────────────────────────────
  const runNsfwScan = useCallback(async () => {
    const canvas = captureFrame();
    if (!canvas || !nsfwModelRef.current) return;

    try {
      const predictions = await nsfwModelRef.current.classify(canvas);
      const scores = {};
      predictions.forEach(p => { scores[p.className] = p.probability; });

      const pornScore = scores["Porn"] || 0;
      const hentaiScore = scores["Hentai"] || 0;
      const combined = pornScore + hentaiScore;
      setNsfwScore(combined);

      if (DEBUG) {
        console.log("[Moderation] NSFW scores:", predictions.map(p => `${p.className}: ${(p.probability * 100).toFixed(1)}%`).join(", "));
      }

      // Dual-gate: combined must exceed threshold AND at least one class must be dominant
      const isDominant = pornScore > NSFW_SINGLE_CLASS_MIN || hentaiScore > NSFW_SINGLE_CLASS_MIN;
      if (combined > NSFW_THRESHOLD && isDominant) {
        strikeCountRef.current += 1;
        lastCleanRef.current = null;
        if (DEBUG) console.log(`[Moderation] [VIOLATION] Strike ${strikeCountRef.current} (Porn: ${(pornScore * 100).toFixed(0)}%, Hentai: ${(hentaiScore * 100).toFixed(0)}%)`);
        applyEscalation(strikeCountRef.current, `NSFW content detected (score: ${(combined * 100).toFixed(0)}%)`);
      } else {
        // Clean frame — check cooldown
        if (!lastCleanRef.current) {
          lastCleanRef.current = Date.now();
        } else if (Date.now() - lastCleanRef.current > COOLDOWN_MS && strikeCountRef.current > 0) {
          if (DEBUG) console.log("[Moderation] [CLEAN] Cooldown passed, resetting strikes");
          strikeCountRef.current = 0;
          setModerationState("clean");
          setModerationMessage("");
        }
      }
    } catch (err) {
      console.error("[Moderation] NSFW scan error:", err);
    }
  }, [captureFrame, applyEscalation]);

  // ─── Face Detection Scan ──────────────────────────────────
  const runFaceScan = useCallback(async () => {
    const canvas = captureFrame();
    if (!canvas || !blazefaceModelRef.current) return;

    try {
      const faces = await blazefaceModelRef.current.estimateFaces(canvas, false);
      const hasFace = faces.length > 0;
      setFaceDetected(hasFace);

      if (DEBUG) {
        console.log(`[Moderation] Faces detected: ${faces.length}`);
      }

      if (!hasFace) {
        if (!noFaceSinceRef.current) {
          noFaceSinceRef.current = Date.now();
        } else if (Date.now() - noFaceSinceRef.current > NO_FACE_TIMEOUT_MS) {
          // Only show no-face warning if we're not already in a worse state
          if (moderationState === "clean") {
            setModerationState("warning");
            setModerationMessage("No face detected. Please ensure your face is visible.");
          }
        }
      } else {
        noFaceSinceRef.current = null;
        // Clear no-face warning if that's the only reason we're in warning state
        if (moderationState === "warning" && strikeCountRef.current === 0) {
          setModerationState("clean");
          setModerationMessage("");
        }
      }
    } catch (err) {
      console.error("[Moderation] Face scan error:", err);
    }
  }, [captureFrame, moderationState]);

  // ─── Main Scan Loop (alternating cycles) ──────────────────
  useEffect(() => {
    if (!connected || !modelsLoaded || moderationState === "terminated") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    tickCountRef.current = 0;

    intervalRef.current = setInterval(() => {
      tickCountRef.current += 1;

      if (tickCountRef.current % 2 === 1) {
        // Odd tick → NSFW scan
        runNsfwScan();
      } else {
        // Even tick → Face scan
        runFaceScan();
      }
    }, SCAN_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [connected, modelsLoaded, moderationState, runNsfwScan, runFaceScan]);

  // ─── Reset (between matches) ──────────────────────────────
  const resetModeration = useCallback(() => {
    strikeCountRef.current = 0;
    noFaceSinceRef.current = null;
    lastCleanRef.current = null;
    tickCountRef.current = 0;
    setModerationState("clean");
    setModerationMessage("");
    setNsfwScore(0);
    setFaceDetected(true);
    if (DEBUG) console.log("[Moderation] [RESET] State cleared");
  }, []);

  // ─── Simulate NSFW Violation (debug only) ─────────────────
  const simulateNsfwViolation = useCallback(() => {
    if (!DEBUG) return;
    strikeCountRef.current += 1;
    const strike = strikeCountRef.current;
    if (DEBUG) console.log(`[Moderation] [DEBUG] SIMULATED Strike ${strike}`);
    setNsfwScore(0.95);
    applyEscalation(strike, `[Simulated NSFW violation] (strike ${strike})`);
  }, [applyEscalation]);

  return {
    moderationState,
    moderationMessage,
    nsfwScore,
    faceDetected,
    modelsLoaded,
    resetModeration,
    simulateNsfwViolation,
  };
}
