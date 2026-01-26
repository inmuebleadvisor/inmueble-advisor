# WhatsAppButton Component

**Path:** `src/components/common/WhatsAppButton/WhatsAppButton.jsx`

## Description
A floating action button that redirects users to WhatsApp using the `wa.me` API. It dynamically generates a contextual message based on the current route (Development, Model, Advisor, etc.) to facilitate lead conversion.

## Features
- **Contextual Messages:** Detects if the user is viewing a specific Model or Development and pre-fills the WhatsApp message with relevant details.
- **Tracking:** Integrates with `MetaService` to track `Contact` events (Pixel + CAPI) before redirection.
- **Route Awareness:** Hidden on the home page (`/`).

## Usage
This component is typically placed in a global layout or the main App component to appear across the site.

```jsx
import WhatsAppButton from './components/common/WhatsAppButton/WhatsAppButton';

function App() {
  return (
    <>
      <Router />
      <WhatsAppButton />
    </>
  );
}
```

## Configuration
The target phone number is defined as a constant `PHONE_NUMBER` within the component.
- **Current Number:** `+52 66 73 03 19 23`
