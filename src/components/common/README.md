# Common Components

## MetaTracker
Handles unified PageView tracking for Meta Ads (Pixel + CAPI).
- **Update (2026-01-13):** Implemented `disablePushState = true` in Pixel initialization. `MetaTracker` is now the **sole** source of PageView events (Manual Mode) to guarantee deduplication with Server Events.
- **Logic:** Generates a unique `EventID` on every route change and ensures both Pixel and CAPI receive it.
- **Usage:** Placed inside `BrowserRouter` in `App.jsx`.
