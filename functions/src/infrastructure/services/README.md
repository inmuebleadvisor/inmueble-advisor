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
  - **IMPORTANT:** Automatically normalizes phone numbers.
    > [!IMPORTANT]
    > Se asumirá el código de país **52 (México)** por defecto para números de 10 dígitos. Si la aplicación recibe tráfico internacional significativo, deberíamos requerir el código de país en el formulario.

### 2. `TelegramService`
**Implements:** `NotificationPort`

Provides real-time alert notifications via Telegram Bot API with enhanced robustness.

- **Key Features:**
  - **Axios-based**: Uses `axios` for standard HTTP request handling and error parsing.
  - **Markdown V1 Support**: Message formatting is escaped to be compatible with Telegram Markdown V1.
  - **Compatibility**: Reverts to `process.env` for secret access, ensuring stability in v1 Cloud Functions.
  - **Observability**: Fully integrated with `firebase-functions/logger` for production traceability.

- **Dependencies:**
  - `axios` for HTTP communication.
  - Standard environment variables for `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.

## 🏗 Architecture Note
These services are part of the **Infrastructure Layer**. They should validly depend on external libraries (axios, firebase-admin) but should interact with the rest of the application primarily through their Domain Interfaces defined in `src/core/interfaces`.
