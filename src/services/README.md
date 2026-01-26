# Meta Ads Service Implementation

## Overview
The `MetaService` handles the hybrid tracking integration (Meta Pixel + Conversion API) for Inmueble Advisor. It ensures high Event Match Quality (EMQ) through PII normalization and robust event deduplication using `event_id`.

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
