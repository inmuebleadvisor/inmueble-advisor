# 🏙️ Módulo del Catálogo (Components/Catalogo)

Este módulo contiene los componentes visuales encargados de presentar la oferta inmobiliaria (Desarrollos y Modelos) de manera atractiva y funcional.

## Componentes Principales

### 1. DevelopmentCard
*   **Archivo:** `DevelopmentCard.jsx`
*   **CSS:** `DevelopmentCard.css`
*   **Propósito:** Tarjeta premium que presenta un desarrollo inmobiliario.
*   **Características:**
    - Slider de modelos integrados.
    - Tooltip interactivo de amenidades.
    - Etiquetas de estado (Preventa, Entrega Inmediata) dinámicas.
    - Responsive y optimizado para scroll.
*   **Tests:** `DevelopmentCard.test.jsx`

### 2. PropertyCard (Legacy/Individual)
*   **Archivo:** `PropertyCard.jsx`
*   **Propósito:** Presentación individual de modelos de casa/departamento fuera del contexto de slider de desarrollo.

### 3. AmenidadesList
*   **Archivo:** `AmenidadesList.jsx`
*   **Propósito:** Renderizado estandarizado de la lista de características de una propiedad.

### 4. MapCatalogView
*   **Archivo:** `MapCatalogView.jsx`
*   **CSS:** `MapCatalogView.css`
*   **Propósito:** Vista de mapa interactiva con Leaflet para localizar desarrollos.
*   **Características:**
    - Fullscreen dinámico optimizado para móviles con `100dvh`.
    - Marcadores personalizados con precios y estatus de favoritos.
    - Leyenda interactiva integrada.

## Estándares del Módulo

1.  **Metodología BEM:** Es obligatorio el uso de BEM con el prefijo correspondiente al componente (ej. `.development-card__element`).
2.  **Desacoplamiento:** La lógica de negocio (formateo, etiquetas de estado, selección de imagen de portada) **DEBE** delegarse a `src/services/developmentService.js` o `src/utils/formatters.js`.
3.  **Configuración de UI:** Ajustes como velocidades de scroll, umbrales de visibilidad y límites de elementos se gestionan a través del objeto `SCROLL_CONFIG` dentro del componente.
4.  **Premium Experience:** Todas las animaciones deben usar la variable `--ease-premium`.

## Guía de Estilos (CSS)
Las tarjetas utilizan variables globales definidas en `src/index.css` para asegurar compatibilidad con el **Dark Mode** y temas estacionales.
