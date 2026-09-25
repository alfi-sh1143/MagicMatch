# MagicMatch Booth — Visual Walkthrough & Screenshots

This directory catalogs the authentic visual interface of the MagicMatch physical touchscreen kiosk and mobile companion portal.

## Recommended Public Walkthrough Captures

| Index | Screen Name | Route / Component | Description |
| :--- | :--- | :--- | :--- |
| **01** | **Landing / Product Overview** | `/` (`LandingPage.tsx`) | Public introduction, interactive demo trigger, hardware specs, and kiosk entry. |
| **02** | **Attract Mode (Idle Loop)** | `/kiosk` (`AttractMode.tsx`) | Ambient animated kiosk idle loop with simulated "Match Found" pulses and "Tap To Start". |
| **03** | **Question Engine** | `/kiosk` (Step 3: `QuestionEngine.tsx`) | 5 tactile touch questionnaire cards (energy, interests, hangout scenarios, battery, intent). |
| **04** | **Camera Viewfinder & Capture** | `/kiosk` (Step 4: `CameraCapture.tsx`) | Live 720p/1080p WebRTC stream, countdown beeps, canvas flash, and filters (Normal/Mono/Warm/Cyber). |
| **05** | **Match Reveal & QR** | `/kiosk` (Step 6: `MatchReveal.tsx`) | Explainable compatibility tier, reasons breakdown, and high-entropy connection token. |
| **06** | **3D Photo Strip & Print Spool** | `/kiosk` (Step 8: `PhotoStrip.tsx`) | 3D flippable physical strip preview (Side A: Photos; Side B: Candidate insights) & print queue dispatch. |
| **07** | **Operator Hub & Diagnostics** | `/dashboard` (`OperatorDashboard.tsx`) | Real-time subsystem health, active token monitor, thermal ESC/POS test cut, and event logs. |
| **08** | **Mobile Connect Portal** | `#/connect/:token` (`ConnectionPageView.tsx`) | Mobile phone view after scanning QR code with server-authoritative dual consent gating. |

## Authentic Reference Assets

- `hero_booth_kiosk_1790275625997.jpg`: Physical touchscreen kiosk installed in a cultural art cafe.
- `booth_photostrip_sample_1790275639935.jpg`: 2x6" physical dye-sub photo strip print with QR connection token.
- `venue_social_lounge_1790275652323.jpg`: Venue ambience and multi-booth social discovery hub.
