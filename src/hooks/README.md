# Custom Hooks (Lógica Reutilizable) 🎣

Este directorio contiene la lógica de React encapsulada para ser reutilizada o para limpiar la vista de los componentes.

## Clasificación de Hooks

### 🧠 ViewModels (Lógica de Vista)
Estos hooks encapsulan *toda* la lógica de una pantalla específica. El componente de UI (`src/screens`) debe llamar a este hook y recibir solo los datos listos para renderizar.
-   **`useFavoritesViewModel`**: Maneja la carga, agregación y eliminación de favoritos.
-   **`useCatalogViewModel`** (Ejemplo): Manejaría filtros, paginación y carga del catálogo.

### 🧩 Logic Hooks (Utilidades)
Hooks genéricos que resuelven problemas específicos y pueden usarse en múltiples lugares.
-   **`useService`**: Hook fundamental para consumir servicios del `ServiceProvider` con manejo de estados de carga y error.
-   **`useForm`**: Manejo de formularios y validaciones.
-   **`useAuth`**: Acceso rápido al contexto de usuario.
-   **`useAnalytics`**: Abstracción del servicio de analítica (PostHog). Expone métodos `identifyUser` y `trackEvent`.
-   **`useShareSimulatorPDF`**: Generador de PDF de alta fidelidad para la corrida financiera del simulador. Utiliza carga perezosa (lazy load) de `jsPDF` y se integra con la Web Share API si el dispositivo lo soporta.

### `useCatalogFilter`
Maneja la lógica de filtrado del catálogo, sincronizando el estado con la navegación (`location.state`), parámetros de URL (`URLSearchParams`) y el Perfil del Usuario.

**Resolución de Prioridades (Source of Truth):**
1.  **Navigation State**: Acciones explícitas desde la UI (ej: clic desde la Calculadora).
2.  **URL Parameters**: Navegación directa o Deep Linking.
3.  **User Profile**: Preferencias persistidas del usuario (solo se aplican si no es una "Búsqueda Fresca").
4.  **Defaults**: Valores base definidos en `constants.js`.

**Características Técnicas:**
- **Fresh Search Logic**: Si se detecta un término de búsqueda (`searchQuery`) proveniente de la Home, se ignoran temporalmente los presupuestos del perfil para permitir una búsqueda libre.
- **Reactividad Total**: Escucha cambios en `location.state` para asegurar que la vista se actualice inmediatamente en navegaciones internas.
- **Tracking**: Integración con Meta Pixel para rastrear términos de búsqueda y filtros aplicados.
- **Optimización**: Debounce de 1.5s para eventos de tracking y filtrado.

### `useDevelopmentCatalog` (ViewModel)
Transforma la lista plana de modelos en una estructura jerárquica de Desarrollos para la vista principal.
**Entrada:** `modelosFiltrados`, `desarrollos`.
**Salida:** `enrichedDevelopments` (Desarrollos con `matchCount`, `visiblePrice`, `matchingModels`).
**Uso:** Principalmente en `Catalogo.jsx`.

### `useDebounce`
Hook utilitario para retrasar la actualización de un valor hasta que el usuario deja de interactuar.
**Uso:** Búsquedas en tiempo real, sliders de precio.

### `useMortgageSimulator` (ViewModel)
Maneja el estado interactivo del `MortgageSimulatorModal`. Realiza los cálculos financieros (enganche, plazos, ahorro acelerado) reactivos al input del usuario, e instancia la clase de servicio correspondiente u obtiene configuraciones bancarias.

## Regla de Oro: Separación UI/Lógica
Un componente de Vista (`screen`) no debería tener `useEffect` complejos ni lógica de estado masiva. Mueve esa lógica a un Custom Hook aquí.

```javascript
// Malo en un componente
useEffect(() => {
  api.getData().then(data => setData(data));
}, []);

// Bueno
const { data, loading } = useDataViewModel();
```
