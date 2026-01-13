# Common Components

## MetaTracker
Handles unified PageView tracking for Meta Ads (Pixel + CAPI).
- **Update (2026-01-12):** Added strict EventID enforcement and diagnostic logging. Fixed potential timer leak in race condition handling.
- **Logic:** Generates a unique `EventID` on every route change and ensures both Pixel and CAPI receive it.
- **Usage:** Placed inside `BrowserRouter` in `App.jsx`.
