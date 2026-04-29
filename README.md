# BlindSpark Frontend

A production-oriented **Next.js frontend** for a random video chat platform with built-in trust and safety controls. BlindSpark combines browser-native WebRTC communication, realtime signaling, identity/profile onboarding, machine-assisted moderation, user reporting, and admin review tooling.

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Architecture at a Glance](#architecture-at-a-glance)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [End-to-End User Flow](#end-to-end-user-flow)
- [Moderation System](#moderation-system)
- [Data Model (High Level)](#data-model-high-level)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Runbook](#runbook)
- [Deployment Notes](#deployment-notes)
- [Security Considerations](#security-considerations)
- [Testing & Quality Recommendations](#testing--quality-recommendations)
- [Known Limitations](#known-limitations)
- [Roadmap Suggestions](#roadmap-suggestions)

---

## Overview

BlindSpark is designed as a **client-heavy realtime application** where most user-facing logic executes in the browser. The frontend is responsible for:

- Authentication and profile readiness.
- Matchmaking lifecycle UX.
- WebRTC session setup and control.
- Client-side video/audio moderation loops.
- Report/evidence capture and moderation escalation.
- Admin-side report review actions.

This architecture optimizes responsiveness and interaction continuity while requiring careful backend policy enforcement (authorization, data validation, abuse prevention).

---

## Core Features

- **Authentication & onboarding**
  - Email/password + Google sign-in.
  - Profile setup with interests/language metadata and validation.
- **Random video matching**
  - Queue-based pairing and role-driven WebRTC signaling.
  - In-session controls: mute, video on/off, skip, report.
- **Safety-first moderation**
  - Visual moderation using NSFW classification + face detection.
  - Audio moderation using speech transcript analysis + toxicity scoring.
  - Escalation ladders (warning → restricted state → termination).
- **Evidence-aware reporting**
  - Remote frame snapshot capture and upload.
  - Structured report payload for admin resolution.
- **Admin operations**
  - Pending report dashboard.
  - Dismiss and user-ban workflows.

---

## Architecture at a Glance

```text
[Next.js Client]
  ├─ Auth + Profile (Firebase Auth + Firestore)
  ├─ Matchmaking UI + Socket Events (Socket.IO)
  ├─ WebRTC Media Session (RTCPeerConnection)
  ├─ Video Moderation (nsfwjs + BlazeFace)
  ├─ Audio Moderation (Web Speech API + toxicity model)
  ├─ Reporting UI + Evidence Capture
  └─ Admin Dashboard

External Services:
  • Signaling server (Socket.IO backend)
  • Firebase (Auth + Firestore)
  • Cloudinary (report evidence storage)
```

---

## Tech Stack

- **Framework:** Next.js (App Router), React
- **Realtime signaling:** Socket.IO client
- **Media transport:** WebRTC
- **Auth/Data:** Firebase Auth + Firestore
- **Image evidence storage:** Cloudinary
- **Client moderation models:**
  - `nsfwjs` + TensorFlow.js
  - BlazeFace
  - Toxicity model
- **Speech transcription:** Web Speech API

---

## Project Structure

```text
src/
  app/
    page.js                  # Landing / primary interactive screen
    chat/page.js             # Chat route
    admin/page.js            # Admin report review dashboard
    api/
      upload/route.js        # Report evidence upload endpoint
      upload-avatar/route.js # Avatar upload endpoint
  components/
    AuthForm.jsx
    LoginPage.jsx
    ProfileSetup.js
    ReportModal.js
    ModerationOverlay.js
    AudioModerationOverlay.js
    chat/
      ChatWindow.js
      ChatSidebar.js
      ChatInput.js
      MessageBubble.js
  context/
    AuthContext.js
    SocketContext.js
  hooks/
    WebRTC.js
    useChat.js
    useChatSocket.js
    useVideoModeration.js
    useAudioModeration.js
  lib/
    firebase.js
```

---

## End-to-End User Flow

1. User opens the app and passes the intro/auth entry point.
2. User signs in or signs up.
3. If profile data is incomplete, profile setup is enforced.
4. User enters matchmaking queue.
5. Match result returns peer metadata and role assignment.
6. Caller/callee perform offer/answer + ICE exchange.
7. Session enters active state and moderation engines run continuously.
8. Violations trigger local overlays and/or backend moderation events.
9. User may skip peer or file a report (with optional evidence image).
10. Admin reviews report and resolves (dismiss or ban).

---

## Moderation System

### Video Moderation

- Alternating checks reduce compute load:
  - NSFW content scoring.
  - Face presence validation.
- Strike progression:
  1. Warning
  2. Blur/visibility restriction
  3. Session termination
- Cooldown behavior can lower strike history after clean windows.

### Audio Moderation

- Continuous speech capture via browser Speech API.
- Transcript normalization (including obfuscation handling).
- Hybrid abuse scoring:
  - Pattern/rule-based detections.
  - Toxicity model confidence signals.
- Strike progression:
  1. Warning
  2. Forced mute/restriction
  3. Session termination

### UX Semantics

- Distinguishes messaging for:
  - local violator,
  - affected peer,
  - server-issued warnings.
- Uses transient toasts for low severity and blocking overlays for severe actions.

---

## Data Model (High Level)

### `users` collection (representative)

- `uid`
- `email`
- `displayName`
- `photoURL`
- `interests[]`
- `language`
- `createdAt`
- `isBanned`
- `reportCount`
- `karma`

### `reports` collection (representative)

- `reporterId`
- `reporterEmail`
- `reportedUserId`
- `reason`
- `description`
- `evidenceUrl`
- `timestamp`
- `status`
- `resolvedAt` (optional)

---

## Environment Variables

Create a `.env.local` in project root.

> **Note:** Variable names below reflect integration intent; align exact keys with your backend and `src/lib/firebase.js` / API routes.

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Signaling / socket backend
NEXT_PUBLIC_SOCKET_URL=

# Optional TURN configuration for WebRTC reliability
NEXT_PUBLIC_TURN_URL=
NEXT_PUBLIC_TURN_USERNAME=
NEXT_PUBLIC_TURN_CREDENTIAL=

# Cloudinary (server-side API route usage)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Admin allowlist control (if implemented via env)
ADMIN_EMAILS=
```

---

## Getting Started

### Prerequisites

- Node.js 18+ (recommended LTS)
- npm 9+
- Firebase project configured for Auth + Firestore
- Running Socket.IO signaling backend
- Cloudinary account for report evidence

### Install & Run

```bash
npm install
npm run dev
```

Open: `http://localhost:3000`

### Production Build

```bash
npm run build
npm run start
```

---

## Runbook

### Common Development Tasks

- Lint:

```bash
npm run lint
```

- Debug areas:
  - Authentication/profile hydration: `src/context/AuthContext.js`
  - Match + signaling state: `src/hooks/useChat.js`, `src/hooks/useChatSocket.js`
  - WebRTC controls: `src/hooks/WebRTC.js`
  - Moderation loops: `src/hooks/useVideoModeration.js`, `src/hooks/useAudioModeration.js`
  - Admin moderation workflows: `src/app/admin/page.js`

### Reproducibility Checklist (for evaluations)

Capture before testing/reporting:

- Browser + version
- OS/device
- Camera/microphone permission state
- NAT/network condition
- Env configuration snapshot (secrets redacted)
- Signaling backend version
- Firebase rules snapshot date

---

## Deployment Notes

- Deploy frontend on Vercel (or equivalent Node-compatible host).
- Ensure environment parity between preview and production.
- Configure CORS and secure transport (HTTPS/WSS) across frontend, signaling backend, and media paths.
- TURN is strongly recommended for production-grade WebRTC connectivity.

---

## Security Considerations

- Frontend-only admin checks are **not sufficient** as authorization boundaries.
- Enforce backend validation for report payloads and evidence links.
- Harden Firestore security rules and role claims.
- Add abuse controls (rate limits, replay protection, suspicious-device heuristics).
- Treat client-side moderation as assistive, not tamper-proof enforcement.

---

## Testing & Quality Recommendations

Current codebase is feature-rich but should be expanded with:

- Unit tests for moderation scoring and strike state transitions.
- Integration tests for signaling and matchmaking edge cases.
- E2E coverage for auth → profile setup → match → report flow.
- Observability instrumentation:
  - moderation event metrics,
  - report pipeline reliability,
  - WebRTC connection quality diagnostics.

---

## Known Limitations

- Speech API behavior differs by browser and may degrade silently.
- Client-side model loading can delay moderation on low-end devices.
- WebRTC reliability depends heavily on TURN and network topology.
- Legacy reports without robust identifiers may limit admin actions.

---

## Roadmap Suggestions

- Backend role-based authorization hardening.
- Typed schema validation for profile/report writes.
- Accessibility and localization improvements.
- Improved anti-abuse intelligence and automated triage.
- Better incident analytics for moderation policy iteration.

---

BlindSpark can be framed as a **human-centered realtime communication system with embedded AI safety loops**. This README is intended to support both engineering onboarding and production planning.
