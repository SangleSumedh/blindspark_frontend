# BlindSpark Frontend — Academic Project Report Dossier

## 1) Abstract
BlindSpark is a client-side web platform for random video conversations with layered safety controls. The frontend combines identity management, profile-based matchmaking metadata, browser-native WebRTC media exchange, automated visual/audio moderation, abuse reporting, and an administrative review panel. This document is structured to support academic writing by detailing architecture, constraints, feature logic, operational assumptions, and design decisions at implementation granularity.

## 2) System Scope and Purpose
- Provide near-instant anonymous social connections through queue-based random pairing.
- Improve interaction quality through profile attributes (display name, language, interests, karma).
- Reduce harmful encounters via machine-assisted moderation and escalation.
- Preserve human oversight via reporting and admin resolution workflows.
- Deliver a stylized, youth-oriented interaction model using cinematic onboarding and dark UI aesthetics.

## 3) Technology Stack and Rationale
### 3.1 Framework and Runtime
- **Next.js App Router + React (client-heavy model):** chosen for componentized development and route-level composition while still enabling browser APIs required by media and speech features.
- Most critical pages/components are marked as client components (`"use client"`), indicating intentional dependency on browser APIs.

### 3.2 Realtime and Networking
- **Socket.IO client** is used for signaling and moderation event transport.
- **WebRTC RTCPeerConnection** is used for media streams.
- STUN defaults are provided and TURN is optionally injected via environment variables.

### 3.3 Safety/Moderation ML
- **nsfwjs + tfjs:** visual explicit-content classification.
- **BlazeFace:** face presence validation.
- **Toxicity model:** transcript-level abusive language detection.
- **Web Speech API:** transcript capture pipeline for audio moderation.

### 3.4 Data and Identity
- **Firebase Auth:** email/password + Google OAuth sign-in.
- **Firestore:** profile data, moderation reports, admin decision updates.
- **Cloudinary:** storage for evidence images captured from live remote video.

## 4) Application Flow (End-to-End)
1. User lands in intro animation screen.
2. User enters auth form and signs in/up.
3. If no profile exists, profile setup modal enforces required metadata.
4. User starts matchmaking.
5. Client joins queue and receives match metadata + role.
6. Caller/callee signaling proceeds via offer/answer/ICE.
7. Live session begins; moderation loops activate.
8. Violations trigger local overlays and backend violation events.
9. User can skip/report; evidence snapshot optionally uploaded.
10. Admin interface can review pending reports and apply ban/dismiss outcomes.

## 5) Functional Modules
### 5.1 Authentication and Session Context
- Global `AuthProvider` wraps the root layout.
- `onAuthStateChanged` fetches profile doc for signed-in users.
- Exposed actions: `signUp`, `signIn`, `signInWithGoogle`, `logout`, `refreshProfile`.
- Profile absence is treated as an onboarding state rather than an error state.

### 5.2 Intro and Authentication UX
- Intro uses Lottie fire animation with timed staged reveals and an “Enter” transition flood sequence.
- Auth UI is tab-based (login/signup) with Google fallback.
- Error normalization strips noisy Firebase prefixes for user readability.

### 5.3 Profile Setup and Data Sanitization
- Required: display name + at least one interest.
- Interest selection limited to 5 in UI.
- Sanitization rules:
  - display name trimmed and truncated to 20 chars,
  - interests trimmed/truncated and sliced.
- Initial moderation/account fields seeded (`isBanned`, `reportCount`, `karma`).

### 5.4 Matchmaking and WebRTC Session Control
- Internal state machine includes: `idle`, `searching`, `connecting`, `matched`.
- Socket events handled: `matched`, `waiting`, `role`, `ready`, `offer`, `answer`, `ice-candidate`, `peer-disconnected`, moderation notifications.
- Connection provisioning strategy:
  - Ensure media and peer connection as soon as match is known.
  - Queue ICE candidates until remote description exists.
- User controls: mute toggle, video toggle, skip-to-next, report peer.

### 5.5 Video Moderation Pipeline
- Alternating interval loop (NSFW scan and face scan in turns).
- NSFW decision gate:
  - combined porn+hentai score threshold,
  - at least one dominant class threshold,
  - strike increment on violation.
- Strike escalation levels:
  1) warning,
  2) blurred,
  3) terminated.
- Cooldown resets strikes after sustained clean frames.
- Face absence timeout creates warning if face not detected continuously.

### 5.6 Audio Moderation Pipeline
- Speech recognition continuously captures final transcript chunks.
- Transcript normalization handles spacing and leetspeak obfuscation.
- Hybrid scoring model:
  - regex pattern hits (English + Hinglish slur/threat sets),
  - toxicity model labels.
- Cumulative score threshold triggers strikes.
- Strike escalation levels:
  1) warning,
  2) muted,
  3) terminated.
- Cooldown mechanism can reset strike history after prolonged clean cycles.

### 5.7 Moderation UX and Event Semantics
- Distinct UX channels for:
  - local violator overlays,
  - peer-victim alerts,
  - server-pushed personal warnings.
- Warning toasts auto-dismiss; severe states present blocking overlays.
- On terminal violations, session report behavior is integrated with connection logic.

### 5.8 Reporting and Evidence Capture
- Report modal captures remote frame via canvas and encodes JPEG data URI.
- Upload route sends image to Cloudinary folder (`blindspark/reports`).
- Report payload includes reporter identity, optional reported user ID, reason, description, evidence URL, timestamp, status.
- Designed to support both manual moderation reports and automated moderation triggers.

### 5.9 Admin Console
- Route-level protection checks signed-in email against allowlist.
- Dashboard fetches pending reports ordered by timestamp.
- Actions:
  - Dismiss report,
  - Ban reported user (if user ID present) + resolve report.
- Current implementation notes missing user IDs in legacy reports; includes fallback messaging.

## 6) Data Model (Observed)
### 6.1 `users` Collection (approximate fields)
- `uid`, `email`, `displayName`, `photoURL`
- `interests[]`, `language`, `createdAt`
- `isBanned`, `reportCount`, `karma`

### 6.2 `reports` Collection (approximate fields)
- `reporterId`, `reporterEmail`, `reportedUserId`
- `reason`, `description`, `evidenceUrl`
- `timestamp`, `status`, optional `resolvedAt`

## 7) Security and Safety Constraints
- Frontend-only admin allowlist is not sufficient as a sole authorization boundary (must be backed by server/firestore security rules).
- Evidence capture occurs on client; trust boundary requires backend validation in production-scale deployments.
- Speech API browser support is inconsistent; moderation may degrade silently where unsupported.
- AI inference is client-side, exposing model behavior and making evasion attempts possible.
- Missing env vars can disable critical safeguards (e.g., TURN reliability, report uploads).

## 8) Reliability and Operational Constraints
- WebRTC success depends on network/NAT conditions and TURN availability.
- Media permissions are mandatory; denied camera access blocks matching.
- Moderation timers and model loading latency can delay enforcement on weak devices.
- Profile refresh is explicit after karma update notifications, coupling UX correctness to socket events.

## 9) Design Language and UX Intent
- Aesthetic: dark, neon-orange, “cyber/ignition” branding.
- Intro animation and glow/flood transitions create theatrical onboarding.
- Glassmorphism-style status cards and overlays communicate trust/safety interventions.
- Badge-style connection states and match info chips provide low-cognitive-load situational awareness.

## 10) Notable Design Decisions (with Academic Significance)
1. **Client-driven moderation loops:** minimizes backend inference cost; increases edge privacy and responsiveness but can reduce consistency.
2. **Escalation over instant punishment:** warning → intermediate enforcement → termination supports progressive discipline principles.
3. **Hybrid lexical + ML abuse scoring:** combines deterministic precision with probabilistic generalization.
4. **Queue skip semantics with immediate rejoin:** optimizes user continuity and reduces interaction dead-time.
5. **Karma feedback mechanism:** introduces behavior shaping via visible reputational score.
6. **Separate victim and violator messaging channels:** supports clarity, fairness signaling, and transparency.

## 11) Limitations and Improvement Opportunities
- Strengthen authorization with robust backend role claims and Firestore rules.
- Add unit/integration tests for moderation logic and socket event handling.
- Introduce observability (structured logs, metrics, moderation event analytics).
- Expand localization and accessibility coverage.
- Formalize schema validation for reports/profile writes.
- Add anti-abuse hardening (rate limiting, device fingerprint correlation, replay controls).

## 12) Reproducibility Notes for Academic Reporting
For reproducible study/reporting, document the following before each experiment:
- Exact env variable values (redacting secrets),
- Browser/version and OS,
- Camera/microphone permission state,
- Network type (NAT conditions),
- Moderation debug flag status,
- Backend version/signaling server build,
- Firebase project and rules snapshot date.

## 13) Conclusion
BlindSpark demonstrates a modern pattern for socially oriented real-time communication systems where trust and safety are treated as first-class interaction primitives. Its architecture is intentionally pragmatic: rich client logic, lightweight server assumptions, and modular escalation workflows. For academic framing, it is best analyzed as a **human-centered realtime system with embedded AI moderation and sociotechnical control loops**.
