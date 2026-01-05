# Global State (Context)

This directory manages application-wide state using React Context API.

## When to use Context?
Use Context for data that is considered "global" or needed by many components at different nesting levels, for example:
*   User Authentication (`UserContext`)
*   Theme/UI Preferences (`ThemeContext`)
*   Shopping Cart / Favorites (`FavoritesContext`)
*   Cached Data (`CatalogContext`)

## Best Practices
1.  **Provider Pattern:** Export a `Provider` component that wraps the part of the app needing the state.
2.  **Custom Hook Consumer:** Always export a custom hook (e.g., `useTheme`) to consume the context, rather than exporting the Context object directly. This allows validation and easier refactoring.
3.  **Avoid Overuse:** Do not put ephemeral local state in Context to avoid unnecessary re-renders.
