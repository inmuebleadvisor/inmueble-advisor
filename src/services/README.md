# Inmueble Advisor - Services Layer

## Overview
The `src/services` directory contains the core business logic of the frontend application. It follows the **Dependency Injection** pattern to allow easy testing and loose coupling.

## Core Services

### 1. Catalog Service
*   **File:** `catalog.service.js`
*   **Purpose:** Manages the inventory of developments and models. Handles caching and filtering.
*   **Key Methods:** `obtenerDatosUnificados()`, `filterCatalog()`.

### 2. Auth Service
*   **File:** `auth.service.js`
*   **Purpose:** Facade for Firebase Auth and User Repository. Manages user sessions and profile retrieval.

### 3. Analytics Service
*   **File:** `analytics.service.js`
*   **Purpose:** Central hub for tracking user behavior (Page Views, Events). Bridges the `AnalyticEventsRepository` with the UI.

### 4. Admin Service
*   **File:** `admin.service.js`
*   **Purpose:** Provides restricted access to global data (All Users, All Leads) for administrative dashboards.

## Meta Ads Service Implementation
*   **File:** `meta.service.js`
*   **Purpose:** Hybrid tracking (Pixel + CAPI).

... [Rest of Meta Docs preserved] ...


## Location
- **Service:** `src/services/meta.service.js`
- **Tests:** `src/services/meta.service.test.js`

## Hybrid Event Tracking (Pixel + CAPI)
These events are sent from both the browser and the server to ensure maximum attribution accuracy.

| Event (Meta Standard) | Trigger Moment | Server Function (Cloud Function) | Payload Details |
| :--- | :--- | :--- | :--- |
| **`PageView`** | SPA route changes via `MetaTracker.jsx` | `onLeadPageViewMETA` | `url`, `fbp`, `fbc`, `userAgent` |
| **`ViewContent`** | Product/Model detail load | `onLeadIntentMETA` | `content_ids`, `value`, `currency` |
| **`Contact`** | WhatsApp button interaction | `onLeadContactMETA` | `phone`, `name` (if available) |
| **`Schedule`** | Lead capture form success | `onLeadCreatedMETA` | `email`, `phone`, `name`, `external_id` |

## Browser-Only Events
Tactical behavioral events tracked via the Pixel.

| Event (Meta Standard) | Trigger Moment | Component / Hook |
| :--- | :--- | :--- |
| **`Search`** | Filter application (1.5s debounce) | `useCatalogFilter.js` |
| **`AddToWishlist`** | Favorite toggle (addition) | `FavoritesContext.jsx` |
| **`CompleteRegistration`** | Onboarding/Calculator completion | `OnboardingCliente.jsx` |

## Technical Implementation Rules
1. **Deduplication:** Every event must include a unique `eventID` generated via `metaService.generateEventId()`.
2. **PII Normalization:** All user data must pass through `prepareUserData()` before being sent.
    - Emails: Lowercase & trimmed.
    - Phones: Digit extraction + `52` prefix prefixing for Mexico (10 digits).
3. **Privacy:** Advanced Matching is automatically handled if user session data is present.
4. **SPA Fixes:** `fbq.disablePushState` is set to `true` to prevent duplicate automatic PageViews on internal navigation.

## Usage example
```javascript
const eventId = metaService.generateEventId();
// Pixel call
metaService.track('ViewContent', { content_ids: ['123'], value: 2500000, currency: 'MXN' }, eventId);
// CAPI call
metaService.trackIntentCAPI(eventId, pii, { content_ids: ['123'] });
```
