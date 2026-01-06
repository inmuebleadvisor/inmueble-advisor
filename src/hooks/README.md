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
