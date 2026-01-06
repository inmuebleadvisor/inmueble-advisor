# UI Components Library (Sistema de Componentes) 🧱

Este directorio contiene todas las piezas de interfaz de usuario de Inmueble Advisor. Seguimos una estructura híbrida basada en **Atomic Design** y **Feature-First Architecture**.

## Organización de Carpetas

> **💡 Objetivo:** Esta jerarquía previene el "CSS-Spaghetti". Al definir que `common` son componentes sin estado, obligamos a mantener la lógica compleja en las capas superiores o features, manteniendo la base limpia.

### 🟢 `common/` (Átomos y Moléculas)
Componentes genéricos y reutilizables que forman el sistema de diseño.
-   **Ejemplos**: `Button`, `Input`, `Loader`, `EmptyState`.
-   **Regla de Oro**: Estos componentes deben ser "tontos" (Presentational). No deben conocer nada de Firebase ni de la lógica de negocio. Operan 100% mediante `props`.

### 🔵 `layout/` (Organismos Estructurales)
Piezas que definen la estructura visual de la aplicación.
-   **Ejemplos**: `Navbar`, `StickyPanel`, `Footer`.

### 🟡 `modals/`
Contenedores para diálogos y ventanas emergentes globales.
-   **Ejemplos**: `LoginModal`, `AddLeadModal`, `ImageGalleryModal`.

### 📁 Carpetas de Características (Features)
Componentes que pertenecen a un dominio de negocio específico:
-   **`auth/`**: Formularios de login, perfiles.
-   **`catalogo/`**: Tarjetas de propiedades, filtros de búsqueda, sliders de fotos.
-   **`leads/`**: Tablas de prospectos, detalles de contacto, historial.
-   **`admin/`**: Tableros de control y gestión interna.

## 🛠️ Reglas de Desarrollo
1.  **Metodología BEM**: Todo el CSS debe seguir la convención `clase-padre__elemento--modificador` para evitar colisiones y asegurar la semántica.
2.  **Separación de Preocupaciones**: Si un componente necesita transformar datos complejos o hacer llamadas a servicios, esa lógica debe vivir en un **Custom Hook** (ViewModel) dentro de `src/hooks/`.
3.  **Semántica HTML**: Siempre usa elementos `main`, `section`, `article`, `header` y `footer` correctamente para asegurar la accesibilidad y el SEO.
4.  **No Placeholders**: Al crear nuevos componentes, usa imágenes reales (puedes generarlas con herramientas de IA) para mantener la fidelidad del diseño "Premium".

---
*Nota: Antes de crear un componente en una feature, revisa si puede ser generalizado y movido a `common/`.*
