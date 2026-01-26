# Modals Component Library

**Path:** `src/components/modals`

This directory handles all application modals using a centralized or component-specific approach.

## Components

### [Modal.jsx](file:///c:/Users/novat/inmueble-advisor/src/components/modals/Modal.jsx)
A reusable generic modal wrapper that provides the basic overlay, animation, and close button functionality.
- **Props:**
  - `isOpen` (boolean): Controls visibility.
  - `onClose` (function): Handler to close the modal.
  - `title` (string): Optional header title.
  - `children` (node): Modal content.

### [MapModal.jsx](file:///c:/Users/novat/inmueble-advisor/src/components/modals/MapModal.jsx)
Specialized modal for displaying property locations using `react-leaflet`.
- **Key Feature:** Includes a "Schedule" button that redirects to WhatsApp with a location-specific message.
- **Dependencies:** `react-leaflet`, `leaflet`.

### [CitySelectorModal.jsx](file:///c:/Users/novat/inmueble-advisor/src/components/modals/CitySelectorModal.jsx)
Allows users to select their preferred city/region.
- **Usage:** Typically triggered from the global header or onboarding flow.

### [FilterModal.jsx](file:///c:/Users/novat/inmueble-advisor/src/components/modals/FilterModal.jsx)
Provides complex filtering options for the catalog (Price range, Model type, etc.).

### [HighlightsModal.jsx](file:///c:/Users/novat/inmueble-advisor/src/components/modals/HighlightsModal.jsx)
Displays key highlights or features of a development/model.

## Usage Guidelines
- Always use portals (if applicable in future refactors) or ensure modals are rendered high enough in the DOM stack to avoid z-index issues.
- Modals like `MapModal` should handle their own body scroll locking to prevent background scrolling when open.
