# UI Components

This directory contains the visual building blocks of the application.

## Directory Structure
*   `common/`: Generic, reusable components (Buttons, Inputs, Modals) that are domain-agnostic.
*   `layout/`: Structural components (Headers, Footers, Sidebars). *(Note: Main page layouts are in `src/layouts`)*.
*   `features/`: Components specific to a business feature (e.g., `leads/`, `catalogo/`).
*   `auth/`: Components related to authentication flow.

## "Smart" vs "Dumb" Components
*   **Dumb (Presentational):** Receive data via props and render it. Have no side effects or API calls. Most components in `common` should be Dumb.
*   **Smart (Container):** Can call hooks, services, and manage state. Often composed of multiple Dumb components.

## Styling
*   Prefer CSS Modules or Scoped CSS where possible.
*   Use variables from `src/styles/variables.css` for colors and spacing.
