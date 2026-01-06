# Inmueble Advisor Codebase 🏛️

Welcome to the `src` folder. This project follows a modified Clean Architecture + Feature-First (Screaming Architecture) approach.

## 📂 Directory Structure

### Layer 1: Domain & Data (`/types`, `/context`, `/hooks`)
*   **`types/`**: (Formerly `models`) Contains pure data definitions (JSDoc, Classes) and mappers. No logic.
*   **`context/`**: Global state management (User, Auth, Catalog, Theme).
*   **`hooks/`**: Custom hooks encapsulating business logic (ViewModels).

### Layer 2: UI Components (`/components`)
*   **`components/common/`**: The Design System. Dumb atoms (Buttons, Inputs, Loaders, Icons).
*   **`components/layout/`**: Structural components (search bars, headers, sticky panels).
*   **`components/modals/`**: Global application modals.
*   **`components/features/`** (Suggested): Feature-specific components (e.g., `leads/`, `auth/`).

### Layer 3: Screens/Pages (`/screens`)
*   **`screens/cliente/`**: Public user facing screens.
    *   *Example:* `Favoritos/` (Logic in `useFavoritesViewModel`, UI in `Favoritos.jsx`).
*   **`screens/admin/`**: Private administration dashboard.

### Layer 4: Infrastructure (`/services`, `/repositories`)
*   **`services/`**: Communication with backend (Firebase, external APIs).
*   **`repositories/`**: (Optional) Data transformation layer between API and App.

---

## 🛠️ Development Guidelines

1.  **Strict Imports:**
    *   ✅ Import `common` components anywhere.
    *   ❌ Never import a `screen` inside a `component`.
2.  **Logic Separation:**
    *   Complex screens MUST use a custom hook (ViewModel) for logic.
3.  **Naming:**
    *   Files: PascalCase for React Components (`Button.jsx`), camelCase for helpers (`formatCurrency.js`).

## ⚠️ Important
If you add a new logical entity (e.g., "Payments"), creating a plain JS class in `types/Payment.js` is preferred over scattering objects.
