# Custom Hooks

This directory contains reusable logic encapsulated as React Hooks.

## Guidelines
1.  **Naming:** All files must start with `use` (e.g., `useAuth.js`).
2.  **Responsibility:** Hooks should handle side effects, state logic, and data fetching. They should return data and functions, **not JSX**.
3.  **Composition:** Hooks can use other hooks.

## Common Hooks
*   `useService()`: Access the global service layer.
*   `useUser()`: Access current user session and profile.
*   `useForm()`: Generic form handling (if applicable).

## When to write a Hook?
*   When you find yourself copying `useEffect` or `useState` logic between components.
*   To extract complex logic from a View component to make it cleaner.
