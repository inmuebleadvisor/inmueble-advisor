# Inmueble Advisor

Inmueble Advisor is a modern real estate application built with React, Vite, and Firebase. It follows a Clean Architecture approach to ensure scalability and maintainability.

## 🚀 Getting Started

### Prerequisites
- Node.js (Latest LTS recommended)
- npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Navigate to the project directory:
    ```bash
    cd inmueble-advisor
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```

### Development

To start the development server:

```bash
npm run dev
```


### Build

To build for production:

```bash
npm run build
```

## ⚙️ Configuration

### External Services Verification

- **Facebook Domain Verification**: A meta tag has been added to `index.html` to verify the domain with Meta (Facebook) services.
    - Tag: `<meta name="facebook-domain-verification" content="..." />`
    - Location: `public/index.html` (or root `index.html` in Vite).
    
## 🔍 SEO & Crawlability

This application is optimized for search engines using a hybrid dynamic strategy:

-   **Dynamic Head Content**: Managed by `react-helmet-async` for titles, descriptions, and Open Graph tags across all screens.
-   **Structured Data (JSON-LD)**: Injected on property detail pages using `Schema.org` (Product, RealEstateAgent) for Rich Snippets.
-   **Serverless Sitemap**: A dynamic `sitemap.xml` is generated in real-time by a Firebase Cloud Function, mapping all active developments and models.
    - URL: `/sitemap.xml` (Proxied via Firebase Hosting rewrites).
    - Cache: 12-hour Edge CDN caching to optimize performance and billing.
-   **Semantic HTML**: Uses `.sr-only` utility for visually-hidden SEO text (e.g., proper H1 hierarchy in Hero sections).

## 🏗️ Architecture

This project follows a strictly layered architecture. Please refer to [src/README.md](./src/README.md) for a detailed breakdown of the folder structure and design principles.

## 🌍 Ecosystem & Full Stack Overview

This project is a **Hybrid Single Page Application (SPA)** that relies on a robust Serverless Backend.

-   **Frontend (`src/`):** React + Vite. Handles UI, Client State, and optimistic updates.
-   **Backend (`functions/`):** Google Cloud Functions. Acts as the **secure driver** for critical business logic (e.g., Role Promotion, Payments, Sensitive Data Aggregation).
    > **Security Note:** Never put sensitive business rules (pricing algorithms, role changes) solely in the frontend. Always maintain a mirror or driver in `functions/`.

Please refer to [src/README.md](./src/README.md) for a detailed breakdown of the folder structure and design principles.

### Key Directories
- **`src/`**: Frontend application (Vite + React).
- **`functions/`**: Backend logic (Firebase Cloud Functions in TypeScript).
- **`src/services/`**: Business logic and external communication.
- **`src/repositories/`**: Data transformation and abstraction.
- **`src/types/`**: Data definitions and models.
- **`src/components/`**: UI components (Atomic Design).
- **`src/screens/`**: Application pages/views.
- **`src/hooks/`**: ViewModels and logic encapsulation.

## 🤝 Contributing

Please ensure you follow the coding standards and architecture guidelines defined in `src/README.md`.
