# Global State (Contextos) 🌐

Este directorio gestiona el estado global de la aplicación utilizando la API de Context de React.

## ¿Cuándo usar Context?
Usa Context solo para datos que sean verdaderamente "globales" o necesarios en muchos niveles de profundidad del árbol de componentes.
-   **`UserContext`**: Sesión del usuario actual (anteriormente `AuthContext`) y Preferencias Globales.
    - **Preferencia de Ciudad Automática**: Por defecto inicializa y asigna `Culiacán` a los nuevos usuarios en `localStorage`, saltándose el proceso de selección y alineándose a la estrategia actual de lanzamiento de ventas.
### `CatalogContext`
Provee el inventario completo (`modelos`, `desarrollos`) y utilidades de búsqueda.
- **Carga Inteligente**: Solo carga modelos si hay una ciudad seleccionada.
- **Optimización**: El valor del contexto está memorizado con `useMemo` para evitar re-renderizados masivos al cambiar filtros que no afectan la data base.
- **Enriquecimiento**: Hidrata los modelos con datos de su desarrollo padre antes de exponerlos.
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
