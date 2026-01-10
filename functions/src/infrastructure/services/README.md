# Infrastructure Services

This directory contains concrete implementations of the application's core service interfaces.

## 📁 Services

### 1. `MetaAdsService`
**Implements:** `TrackingService`

Handles server-side event tracking for Meta (Facebook) Conversion API (CAPI).

- **Key Features:**
  - Sends events like `Schedule`, `Contact`, `ViewContent` to Meta Graph API.
  - Automatically hashes PII (Email, Phone, Name) using SHA-256 before sending.
  - Generates `event_id` for deduplication with browser-side pixel events.
  - Supports custom data payload.

- **Configuration:**
  - Relies on `META_CONFIG` from `src/core/constants/meta.ts` for Pixel ID and Access Token.

### 2. `TelegramService`
**Implements:** `NotificationPort`

Provides real-time alert notifications via Telegram Bot API.

- **Key Features:**
  - Sends text messages to a configured Telegram Chat.
  - Uses Firebase Secrets (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`) for secure configuration.
  - Silently handles API failures (logs error but does not crash process) to prevent disrupting the main flow.

- **Dependencies:**
  - `firebase-functions/params` for secret management.

## 🏗 Architecture Note
These services are part of the **Infrastructure Layer**. They should validly depend on external libraries (axios, firebase-admin) but should interact with the rest of the application primarily through their Domain Interfaces defined in `src/core/interfaces`.
