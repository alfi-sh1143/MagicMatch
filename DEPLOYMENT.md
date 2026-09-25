# MagicMatch Booth — Physical Kiosk Deployment Guide

## 1. Hardware Specifications

| Component | Recommended Specification | Minimum Specification |
| :--- | :--- | :--- |
| **Compute** | Mini PC (Intel N100 / i3 / Raspberry Pi 5), 8GB RAM | 4GB RAM, Quad-Core CPU |
| **Display** | 21.5" - 27" Full HD (1920×1080) Projected Capacitive Touchscreen | 1024×768 Touchscreen |
| **Camera** | 1080p WebRTC USB Camera (Logitech Brio / C920) or DSLR with capture card | 720p USB Webcam |
| **Printer** | 2"×6" Dye-Sublimation Photo Printer (DNP DS620A / Citizen CX-02) OR 80mm ESC/POS Thermal Receipt Printer | Standard Desktop Printer (System Spool) |
| **Audio** | Internal Kiosk Speakers (3.5mm / USB Audio DAC) | Built-in Monitor Speakers |
| **Network** | Ethernet (Gigabit) + Wi-Fi 6 backup | Offline (Runs autonomously locally) |

---

## 2. Launching in Production Kiosk Mode

To prevent guests from navigating away, inspecting source, or pinching the viewport, launch in Chrome Kiosk mode:

### Linux / Ubuntu Kiosk Launch Script (`start_kiosk.sh`):
```bash
#!/bin/bash
xset s off
xset -dpms
xset s noblank

# Launch Chrome in Fullscreen Kiosk Mode
google-chrome \
  --kiosk \
  --incognito \
  --kiosk-printing \
  --noerrdialogs \
  --disable-infobars \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --check-for-update-interval=31536000 \
  --autoplay-policy=no-user-gesture-required \
  https://your-booth-domain.com
```

### Windows Kiosk Shortcut:
```cmd
chrome.exe --kiosk --incognito --kiosk-printing --disable-pinch --overscroll-history-navigation=0 "https://your-booth-domain.com"
```

---

## 3. Environment Configuration

Copy `.env.example` to `.env`:

```env
# Optional Remote Persistence (Supabase / Postgres)
# When set, the kiosk automatically syncs sessions to the cloud.
# When omitted, the kiosk runs in 100% offline Local-First mode.
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

---

## 4. Operator Controls & Security

- **Operator Gesture**: Touch and hold the **top-right corner of the kiosk screen for 5 seconds**.
- **Operator PIN (DEVELOPMENT / DEMO ONLY)**: Enter `1234`.
  - *Production Security Requirement*: For live commercial kiosks, local plaintext PINs must NOT be used. Production installations must enforce server-backed operator authentication, physical hardware NFC/RFID badge authentication, or cryptographically salted PIN hashes validated via the venue management API.
- **Session Reset**: Available immediately from Operator Hub or automatically upon 120s inactivity.
- **Photo Data**: Cleared from memory immediately after session completion or reset. Zero photos are stored without explicit user consent.
