"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Configuration ──────────────────────────────────────────────
const PROCESS_INTERVAL_MS = 4000; // 4 s between transcript processing cycles
const COOLDOWN_MS = 30000;        // 30 s clean to reset strikes
const SCORE_THRESHOLD = 3;        // Cumulative abuse score to trigger a strike
const REGEX_SCORE = 2;            // Score weight for regex-matched abuse
const AI_TOXICITY_SCORE = 2;      // Score weight for AI-detected toxicity
const AI_TOXICITY_THRESHOLD = 0.8; // Confidence threshold for toxicity model
const STRIKE_WARNING = 1;
const STRIKE_MUTE = 2;
const STRIKE_TERMINATE = 3;
const DEBUG = process.env.NEXT_PUBLIC_MODERATION_DEBUG === "true";

// ─── Obfuscation Normalization Map ──────────────────────────────
// Handles common letter substitutions used to bypass filters
const LEET_MAP = {
  "@": "a", "4": "a", "^": "a",
  "8": "b",
  "(": "c", "<": "c",
  "3": "e",
  "1": "i", "!": "i", "|": "i",
  "0": "o",
  "5": "s", "$": "s",
  "7": "t", "+": "t",
  "v": "u",
  "ph": "f",
};

// ─── Abusive Word Patterns ──────────────────────────────────────
// English + Hinglish patterns with common phonetic variants
const ABUSE_PATTERNS = [
  // English
  /\bf+u+c+k+/i,
  /\bs+h+i+t+/i,
  /\bb+i+t+c+h+/i,
  /\ba+s+s+h+o+l+e+/i,
  /\bd+i+c+k+/i,
  /\bc+u+n+t+/i,
  /\bf+a+g+g?o?t?/i,
  /\bn+i+g+g+(e|a)+r?/i,
  /\bw+h+o+r+e+/i,
  /\bs+l+u+t+/i,
  /\bp+u+s+s+y+/i,
  /\bd+a+m+n+/i,
  /\bb+a+s+t+a+r+d+/i,
  /\bp+r+i+c+k+/i,
  /\bc+o+c+k+s*u*c*k*/i,

  // Threats / self-harm
  /\bk+y+s+\b/i,                   // "kys"
  /\bk+i+l+l+\s*y+o+u+r+s+e+l+f+/i,
  /\bg+o+\s*d+i+e+/i,
  /\bi.*will.*kill.*you/i,
  /\brape/i,

  // Hinglish + Phonetic mis-transcriptions (English STT often mishears these)
  /\bm+a+d+a+r+c+h+o+d+/i,
  /\bb+h+o+s+(a|d)+[di]*k*e*/i,    // bhosdike / bhosadi
  /\bc+h+u+t+i+y+a*/i,             // chutiya
  /\bg+a+a+n+d+/i,                 // gaand
  /\bl+a+w+d+[aei]*/i,             // lawda / lawde
  /\br+a+n+d+i+/i,                 // randi
  /\bh+a+r+a+m+i+/i,              // harami
  /\bb+h+e+n+c+h+o+d+/i,          // bhenchod
  /\bs+a+l+[aei]+/i,               // sala / sale (needs word boundary)
  /\bk+u+t+t+[aei]+/i,            // kutta / kutte / kutti
  /\bc+h+a+m+a+r+/i,              // casteist slur
  /\bj+h+a+a+n+t+/i,              // jhaant

  // Phonetic approximations for common English STT mis-hearings of Hinglish
  /\bbenth? ?(ch?|k)o[ad]/i,       // bhenchod -> "benth code", "ben cho"
  /\bben(ch|d) ?(old|cold|code)/i,  // bhenchod -> "bench old", "bench cold", "bench code"
  /\bch?oo?t+(ia|y+a)/i,           // chutiya -> "chootea"
  /\bchoose? ?the? ?area/i,        // chutiya -> "choose the area"
  /\blove? ?day+/i,                // lawda -> "love day"
  /\bloud ?ah+/i,                  // lawda -> "loud ah"
  /\bg?u+nd+a/i,                   // gaand -> "gunda" (sometimes misheard)
  /\bmother ?ch?o+d/i,             // madarchod -> "mother chod"
];

/**
 * Normalize text for abuse detection:
 * - lowercase
 * - strip symbols (except spaces)
 * - collapse spaced-out letters ("f u c k" → "fuck")
 * - apply leet-speak substitutions ("ph" → "f", "@" → "a", etc.)
 */
function normalizeText(raw) {
  let text = raw.toLowerCase();

  // Apply leet-speak substitutions (multi-char first, then single-char)
  for (const [key, val] of Object.entries(LEET_MAP)) {
    text = text.replaceAll(key, val);
  }

  // Remove non-alphanumeric except spaces
  text = text.replace(/[^a-z0-9\s]/g, "");

  // Collapse single-letter spacing ("f u c k" -> "fuck")
  // Matches sequences of single letters separated by any amount of whitespace
  // Example: "f  u  c  k" -> "fuck"
  text = text.replace(/\b([a-z])[\s]+(?=[a-z]\b)/g, "$1");

  // Normalize multiple spaces and trim
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/**
 * Check normalized text against all regex abuse patterns.
 * Returns array of matched patterns for debugging.
 */
function detectRegexAbuse(normalizedText) {
  const matches = [];
  for (const pattern of ABUSE_PATTERNS) {
    if (pattern.test(normalizedText)) {
      matches.push(pattern.source);
    }
  }
  return matches;
}

// ═══════════════════════════════════════════════════════════════
//  useAudioModeration Hook
// ═══════════════════════════════════════════════════════════════

export default function useAudioModeration(stream, connected) {
  // ─── State (only what the UI needs to react to) ────────────
  const [audioModerationState, setAudioModerationState] = useState("clean"); // clean | warning | muted | terminated
  const [audioModerationMessage, setAudioModerationMessage] = useState("");
  const [abuseScore, setAbuseScore] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // ─── Refs (mutable, no re-render cost) ─────────────────────
  const toxicityModelRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptBufferRef = useRef("");    // Accumulated finalized transcripts
  const interimBufferRef = useRef("");       // Current non-finalized speech
  const strikeCountRef = useRef(0);
  const cumulativeScoreRef = useRef(0);      // Running score within current cycle
  const lastCleanRef = useRef(null);         // Timestamp of last clean cycle
  const intervalRef = useRef(null);
  const isListeningRef = useRef(false);      // Mirror of isListening to avoid stale closures

  // ─── Load Toxicity Model (once) ───────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadModel() {
      try {
        const tf = await import("@tensorflow/tfjs");
        await tf.ready();

        const toxicity = await import("@tensorflow-models/toxicity");
        const model = await toxicity.load(AI_TOXICITY_THRESHOLD, [
          "toxicity",
          "severe_toxicity",
          "insult",
          "threat",
          "sexual_explicit",
        ]);

        if (cancelled) return;

        toxicityModelRef.current = model;
        setModelsLoaded(true);

        if (DEBUG) console.log("[AudioMod] [OK] Toxicity model loaded");
      } catch (err) {
        console.error("[AudioMod] Failed to load toxicity model:", err);
      }
    }

    loadModel();

    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Escalation Logic ─────────────────────────────────────
  const applyEscalation = useCallback((strikes, reason) => {
    if (strikes >= STRIKE_TERMINATE) {
      setAudioModerationState("terminated");
      setAudioModerationMessage(reason || "Session terminated for abusive language.");
    } else if (strikes >= STRIKE_MUTE) {
      setAudioModerationState("muted");
      setAudioModerationMessage(reason || "Abusive language detected. Audio muted.");
    } else if (strikes >= STRIKE_WARNING) {
      setAudioModerationState("warning");
      setAudioModerationMessage(reason || "Potentially abusive language detected.");
    }
  }, []);

  // ─── Process Transcript Buffer ────────────────────────────
  const processTranscript = useCallback(async () => {
    const finalizedText = transcriptBufferRef.current.trim();
    const interimText = interimBufferRef.current.trim();
    const rawText = (finalizedText + " " + interimText).trim();
    
    if (!rawText) return;

    // Clear finalized buffer immediately
    transcriptBufferRef.current = "";
    // Note: Do NOT clear interimBuffer here, it will be updated by onresult

    const normalized = normalizeText(rawText);
    if (DEBUG) console.log("[AudioMod] Processing:", normalized);

    let cycleScore = 0;

    // ── Step 1: Fast regex scan ──
    const regexMatches = detectRegexAbuse(normalized);
    if (regexMatches.length > 0) {
      cycleScore += REGEX_SCORE * regexMatches.length;
      if (DEBUG) console.log(`[AudioMod] [REGEX] Matches: ${regexMatches.join(", ")} (+${REGEX_SCORE * regexMatches.length})`);
    }

    // ── Step 2: AI toxicity scan (only if model loaded) ──
    if (toxicityModelRef.current && normalized.length > 3) {
      try {
        const predictions = await toxicityModelRef.current.classify([normalized]);
        const toxicLabels = [];

        for (const prediction of predictions) {
          // Each prediction has .results[0].match (true/false/null)
          const result = prediction.results[0];
          if (result.match === true) {
            toxicLabels.push(prediction.label);
          }
        }

        if (toxicLabels.length > 0) {
          cycleScore += AI_TOXICITY_SCORE * toxicLabels.length;
          if (DEBUG) console.log(`[AudioMod] [AI] Toxic labels: ${toxicLabels.join(", ")} (+${AI_TOXICITY_SCORE * toxicLabels.length})`);
        }
      } catch (err) {
        console.error("[AudioMod] AI toxicity scan error:", err);
      }
    }

    // ── Step 3: Update cumulative score and check threshold ──
    cumulativeScoreRef.current += cycleScore;
    setAbuseScore(cumulativeScoreRef.current);

    if (cycleScore > 0 && cumulativeScoreRef.current >= SCORE_THRESHOLD) {
      // Threshold crossed — escalate
      strikeCountRef.current += 1;
      lastCleanRef.current = null;
      cumulativeScoreRef.current = 0; // Reset score after strike

      if (DEBUG) console.log(`[AudioMod] [STRIKE] #${strikeCountRef.current} (cycle score: ${cycleScore})`);
      applyEscalation(
        strikeCountRef.current,
        `Abusive language detected (strike ${strikeCountRef.current}/${STRIKE_TERMINATE})`
      );
    } else if (cycleScore === 0) {
      // Clean cycle — check cooldown for strike reset
      if (!lastCleanRef.current) {
        lastCleanRef.current = Date.now();
      } else if (
        Date.now() - lastCleanRef.current > COOLDOWN_MS &&
        strikeCountRef.current > 0
      ) {
        if (DEBUG) console.log("[AudioMod] [CLEAN] Cooldown passed, resetting strikes");
        strikeCountRef.current = 0;
        cumulativeScoreRef.current = 0;
        setAbuseScore(0);
        setAudioModerationState("clean");
        setAudioModerationMessage("");
      }
    }
  }, [applyEscalation]);

  // ─── Speech Recognition Setup ─────────────────────────────
  const startRecognition = useCallback(() => {
    // Guard: browser support
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      console.warn("[AudioMod] Web Speech API not supported in this browser");
      return;
    }

    // Don't double-start
    if (recognitionRef.current) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true; // Enabled for real-time reactivity
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      // 1. Process NEW finalized results from resultIndex
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript;
          transcriptBufferRef.current += " " + transcript;
        }
      }

      // 2. Recalculate the entire current interim buffer
      // In continuous mode, interim results can span multiple segments
      let fullInterim = "";
      for (let i = 0; i < event.results.length; i++) {
        if (!event.results[i].isFinal) {
          fullInterim += " " + event.results[i][0].transcript;
        }
      }
      interimBufferRef.current = fullInterim;

      if (DEBUG) {
        console.log("[AudioMod] [Live STT]:", (transcriptBufferRef.current + " " + interimBufferRef.current).trim());
      }

      if (DEBUG && (event.results[event.results.length - 1].isFinal)) {
        console.log("[AudioMod] [STT-Segment-Finalized]:", event.results[event.results.length - 1][0].transcript);
      }
    };

    recognition.onerror = (event) => {
      // "no-speech", "aborted", and "network" are transient / non-fatal
      // "network" = browser can't reach Google's STT servers (unstable connection, VPN, rate-limit)
      if (event.error === "no-speech" || event.error === "aborted") return;
      if (event.error === "network") {
        if (DEBUG) console.warn("[AudioMod] Network error (transient) — will auto-retry");
        return;
      }
      console.error("[AudioMod] Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      // Auto-restart if we're still supposed to be listening
      if (isListeningRef.current) {
        // Small delay to avoid hammering the API after transient errors
        setTimeout(() => {
          if (!isListeningRef.current) return;
          try {
            recognition.start();
          } catch {
            // Ignore — may already be starting
          }
        }, 500);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      isListeningRef.current = true;
      setIsListening(true);
      if (DEBUG) console.log("[AudioMod] [OK] Speech recognition started");
    } catch (err) {
      console.error("[AudioMod] Failed to start recognition:", err);
    }
  }, []);

  const stopRecognition = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }
  }, []);

  // ─── Main Processing Loop ─────────────────────────────────
  useEffect(() => {
    if (!connected || audioModerationState === "terminated") {
      // Stop everything when disconnected or terminated
      stopRecognition();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start listening when connected
    startRecognition();

    // Start periodic transcript processing
    intervalRef.current = setInterval(() => {
      processTranscript();
    }, PROCESS_INTERVAL_MS);

    return () => {
      stopRecognition();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [connected, audioModerationState, startRecognition, stopRecognition, processTranscript]);

  // ─── Reset (between matches) ──────────────────────────────
  const resetAudioModeration = useCallback(() => {
    strikeCountRef.current = 0;
    cumulativeScoreRef.current = 0;
    lastCleanRef.current = null;
    transcriptBufferRef.current = "";
    setAudioModerationState("clean");
    setAudioModerationMessage("");
    setAbuseScore(0);
    if (DEBUG) console.log("[AudioMod] [RESET] State cleared");
  }, []);

  // ─── Inject Text (debug — bypass mic, type to test) ───────
  const injectText = useCallback((text) => {
    if (!text?.trim()) return;
    if (DEBUG) console.log(`[AudioMod] [INJECT] "${text}"`);
    transcriptBufferRef.current += " " + text;
    // Immediately process instead of waiting for next interval
    processTranscript();
  }, [processTranscript]);

  // ─── Simulate Abuse Violation (debug only) ────────────────
  const simulateAbuseViolation = useCallback(() => {
    if (!DEBUG) return;
    strikeCountRef.current += 1;
    const strike = strikeCountRef.current;
    if (DEBUG) console.log(`[AudioMod] [DEBUG] SIMULATED Strike ${strike}`);
    setAbuseScore(SCORE_THRESHOLD);
    applyEscalation(strike, `[Simulated abuse violation] (strike ${strike})`);
  }, [applyEscalation]);

  return {
    audioModerationState,
    audioModerationMessage,
    abuseScore,
    isListening,
    modelsLoaded,
    resetAudioModeration,
    simulateAbuseViolation,
    injectText,
  };
}
