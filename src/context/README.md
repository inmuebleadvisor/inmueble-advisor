# Global State (Contextos) 🌐

Este directorio gestiona el estado global de la aplicación utilizando la API de Context de React.

## ¿Cuándo usar Context?
Usa Context solo para datos que sean verdaderamente "globales" o necesarios en muchos niveles de profundidad del árbol de componentes.
-   **`AuthContext`**: Sesión del usuario actual.
-   **`CatalogContext`**: Catálogo unificado de modelos y desarrollos, encargado del enriquecimiento y filtrado base por ciudad/calidad.
-   **`ThemeContext`**: Tema claro/oscuro.
-   **`FavoritesContext`**: Lista global de IDs favoritos para acceso rápido en la UI.


## Mejores Prácticas

1.  **Patrón Provider:** Exportar un componente `Provider` que envuelva la parte de la app que necesita el estado.
2.  **Custom Hook Consumer:** Siempre exportar un hook personalizado (ej. `useAuth`) para consumir el contexto. NUNCA exportes el objeto `Context` crudo.
    *   *Por qué?* Esto permite validar que el hook se use dentro del Provider correcto y facilita el refactoring.
3.  **Evitar el "Context Hell":** No crees un contexto para todo. Si el estado solo vive en una página, usa `useState` o un Hook local.

## Ejemplo
```javascript
// useAuth.js
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
    return context;
};
```
