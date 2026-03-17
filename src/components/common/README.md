# Common Components

## MetaTracker
Handles unified PageView tracking for Meta Ads (Pixel + CAPI).
- **Update (2026-01-13):** Implemented `disablePushState = true` in Pixel initialization. `MetaTracker` is now the **sole** source of PageView events (Manual Mode) to guarantee deduplication with Server Events.
- **Logic:** Generates a unique `EventID` on every route change and ensures both Pixel and CAPI receive it.
- **Usage:** Placed inside `BrowserRouter` in `App.jsx`.

## SEOHead
Advanced dynamic meta tag manager using `react-helmet-async`.
- **Purpose:** Controls `<title>`, `<meta name="description">`, Open Graph (OG/Twitter) preview tags, and `noindex` directives.
- **Dynamic Context:** Injected on every screen to ensure search engines and social scrapers see relevant content per page.
- **Update (2026-03-17):** Added `noIndex` prop to intercept Error/Loading states before rendering, preventing Soft 404s and partial DOM indexing.

## StructuredData
Semantic microdata injector for Schema.org.
- **Format:** Injects `<script type="application/ld+json">`.
- **Primary Use:** Property and Development detail pages to enable Google Rich Snippets (Rich Results).
- **Standards:** Uses `Product` and `RealEstateAgent` schemas.
