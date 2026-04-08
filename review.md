# Repository Review — BlindSpark Frontend

## Scope
This review focuses on issues visible in the frontend and frontend-exposed API route code in this repository.

---

## 1) Admin access control is enforced only in client code (Critical)
- **What I found:** Admin gating is performed in a client component by checking `user.email` against a local allowlist and redirecting in `useEffect`.
- **Why this is an issue:** Client-side checks are not a security boundary. If Firestore security rules are not strict enough, an attacker can bypass UI routing and directly read/write admin-targeted data.
- **Evidence:** `src/app/admin/layout.js`.
- **Recommendation:** Move authorization enforcement to server-side controls (Firestore security rules, backend RBAC claims, server middleware) and treat client checks as UX-only.

## 2) Hard-coded single admin email in source (High)
- **What I found:** The admin allowlist is a hard-coded array containing one email.
- **Why this is an issue:** It is brittle, difficult to rotate, and not auditable. It also encourages shipping privileged identity data directly in client bundles.
- **Evidence:** `src/app/admin/layout.js` (`const ADMIN_EMAILS = ["..."]`).
- **Recommendation:** Use server-managed authorization (custom claims/roles stored securely) and remove hard-coded privileged identities from client code.

## 3) `/api/upload` has no authentication/authorization checks (Critical)
- **What I found:** The upload API accepts any POST with `{ image }` and uploads to Cloudinary.
- **Why this is an issue:** Unauthenticated public uploads can be abused for storage cost attacks, illicit content hosting, and denial-of-wallet behavior.
- **Evidence:** `src/app/api/upload/route.js`.
- **Recommendation:** Require authenticated user identity, verify permission to upload report evidence, and enforce per-user rate limits.

## 4) `/api/upload` lacks payload validation and size limits (High)
- **What I found:** The route only checks that `image` exists; there is no size/type validation.
- **Why this is an issue:** Large base64 payloads can cause memory pressure and excessive Cloudinary usage. Invalid formats can trigger unnecessary failures.
- **Evidence:** `src/app/api/upload/route.js`.
- **Recommendation:** Validate MIME type and max bytes before upload; reject oversized payloads with `413 Payload Too Large`.

## 5) Admin actions are executed directly from browser against Firestore (High)
- **What I found:** The admin page directly calls `updateDoc` to ban users and resolve reports.
- **Why this is an issue:** Security depends entirely on Firestore rules. If rules are permissive or misconfigured, privilege escalation is possible.
- **Evidence:** `src/app/admin/page.js` (`handleBan`, `handleDismiss`).
- **Recommendation:** Route privileged mutations through a server endpoint/function that validates admin role server-side.

## 6) Local camera/mic tracks are not explicitly stopped on teardown (Medium)
- **What I found:** PeerConnection cleanup closes the PC but does not stop local media tracks.
- **Why this is an issue:** Camera/microphone can remain active after match end or unmount, causing privacy and battery issues.
- **Evidence:** `src/hooks/WebRTC.js` (`cleanupPC` and effect cleanup).
- **Recommendation:** On teardown, call `localStreamRef.current?.getTracks().forEach(track => track.stop())` and clear refs/video `srcObject`.

## 7) User profile data used for matching is fully client-provided (Medium)
- **What I found:** `findMatch` emits `join-queue` with `userProfile` from client state.
- **Why this is an issue:** Client data is trivially spoofable. If backend trusts this directly, matching logic and moderation signals can be manipulated.
- **Evidence:** `src/hooks/WebRTC.js` (`findMatch`), `src/app/page.js` (`findMatch(userProfile)`).
- **Recommendation:** Send only user ID/token; hydrate authoritative profile server-side.

## 8) Potentially sensitive internal errors are surfaced directly to users (Low)
- **What I found:** Auth errors display raw Firebase messages after simple string replacement.
- **Why this is an issue:** Raw provider errors can leak implementation details and degrade UX consistency.
- **Evidence:** `src/components/LoginPage.jsx`.
- **Recommendation:** Map auth provider errors to curated user-facing messages and log detailed errors only internally.

## 9) Dead/unused signup field can cause data quality confusion (Low)
- **What I found:** Signup form stores `username` in component state but never submits or persists it.
- **Why this is an issue:** Increases maintenance burden and can mislead contributors/users about account data.
- **Evidence:** `src/components/AuthForm.jsx` (`signupData.username` exists but is unused).
- **Recommendation:** Remove unused field from state or fully wire it through validation and persistence.

---

## Suggested next actions
1. Lock down admin/report workflows with server-enforced authz first (issues 1, 3, 5).
2. Add strict validation + rate limiting to `/api/upload` (issues 3, 4).
3. Fix media lifecycle cleanup and trust boundaries in matching payloads (issues 6, 7).
4. Address UX/maintainability items (issues 8, 9).
