# Architecture Blueprint: MagicMatch Booth (Phase 4)

## 1. Architectural Philosophy

MagicMatch Booth is architected around a **Local-First, Cloud-Synched, Hardware-Abstracted** system design:
1. **Zero Downtime Autonomy**: The kiosk operates 100% offline in local venues without external network latency or cloud dependencies. If internet connection drops, it smoothly switches to local storage without session interruption.
2. **Dual Mode Backend**:
   - **Local Mode (Default)**: In-memory & browser-persisted state with strict client-authoritative security boundaries.
   - **Connected Mode (Supabase / PostgreSQL)**: Automatically activated when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided.
3. **Zero-Knowledge Dual Consent**: Sensitive contact details (phone numbers, email, private handles) are NEVER readable via public queries or exposed in the initial match teaser. The server/repository gatekeeper unlocks details only when both parties have confirmed consent.
4. **Hardware Driver Decoupling**: ESC/POS thermal printing, WebRTC camera enumeration, Web Audio synthesis, and touch kiosk gestures are isolated behind clean service interfaces.

---

## 2. Layered Architecture Diagram

```
+-------------------------------------------------------------------------------+
|                       Presentation Layer (React 19 + Tailwind v4)             |
|  [Kiosk Fullscreen / Attract]  [Booth Flow]  [Mobile Connect]  [Operator Hub] |
+-------------------------------------------------------------------------------+
                                      |
+-------------------------------------------------------------------------------+
|                        State & Navigation Orchestrator                         |
|                   App.tsx (Timeout, Reset, PIN, ErrorBoundary)                |
+-------------------------------------------------------------------------------+
         |                            |                               |
+------------------+        +-------------------+           +-------------------+
|  Camera Manager  |        |  Matching Engine  |           | Hardware Manager  |
| (WebRTC / Demo)  |        |  (v2.4 Algorithm) |           | (ESC/POS & Audio) |
+------------------+        +-------------------+           +-------------------+
                                      |
+-------------------------------------------------------------------------------+
|                      Token Resolution & Security Service                      |
|                   (Hashed tokens, 15m Expiration, Consent)                    |
+-------------------------------------------------------------------------------+
                                      |
+-------------------------------------------------------------------------------+
|                           Data Repository Interface                           |
|                               (DataRepository)                                |
+-------------------------------------------------------------------------------+
                  |                                           |
+-----------------------------------+       +-----------------------------------+
|      LocalStorageRepository       |       |        SupabaseRepository         |
|   (Active: Local-First Offline)   |       |    (Connected: PostgreSQL RLS)    |
+-----------------------------------+       +-----------------------------------+
```

---

## 3. Database Schema & Row-Level Security

The complete SQL migration script is located at `supabase/schema.sql`. It defines 17 normalized tables:
- `venues`, `booths`
- `profiles`, `profile_interests`, `profile_traits`, `profile_preferred_activities`, `profile_connection_intents`
- `candidate_preferences`
- `sessions`, `answers`, `captured_media_metadata`, `matches`
- `connection_consents`, `connection_tokens`
- `blocked_profiles`, `reports`, `print_jobs`, `booth_events`, `operator_actions`

### Security Definer RPC: `resolve_connection_contact`
Direct table queries for candidate contacts are restricted. Disclosure is governed by server-side RPC logic:
1. Verifies token hash exists and is in `ACTIVE` state.
2. Compares `NOW() < expires_at` against server clock (15-minute strict lifespan).
3. Verifies `guest_consent = true` AND `candidate_consent = true`.
4. Checks that candidate profile is in `ACTIVE` lifecycle status and not blocked.
5. Only if all checks pass does it return decrypted contact channels.

---

## 4. Mobile Connect Route (`/connect/:token`)

When a guest scans the QR code on their printed strip:
- Mobile route: `https://[app-url]/#/connect/[TOKEN]`
- Screen 1 (Safe Teaser): Shows candidate first name, shared interests, and vibe overlap. Zero personal contact info.
- Screen 2 (Dual Consent Confirmation): Guest confirms consent to share connection details.
- Screen 3 (Unlocked Contact): Reveals verified Instagram, Phone, or Email with 1-tap copy and action links.
- Revocation: Either participant can tap "Revoke Consent" to immediately invalidate the token.

---

## 5. Hardware Subsystems

- **ESC/POS Thermal Printer Driver**: Generates binary ESC/POS buffers (`ESC @`, font sizing, bold formatting, centering, and `GS V` automatic paper cut).
- **Camera Device Manager**: Enumerates available hardware video sources and monitors live streaming latency.
- **Synthesizer Sound Service**: Lightweight Web Audio API synthesizer for countdown beeps, mechanical shutter feedback, and match chimes.
