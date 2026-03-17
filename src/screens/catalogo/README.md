# Módulo: Pantallas del Catálogo (`src/screens/catalogo`)

Este directorio contiene las pantallas principales relacionadas con la visualización y exploración del inventario de desarrollos inmobiliarios.

## Componentes Principales

### `DetalleDesarrollo.jsx`
Pantalla de detalle para un desarrollo específico.
- **Ruta:** `/desarrollo/:id`
- **Funcionalidad:**
  - Carga la información completa del desarrollo usando `CatalogService`.
  - Muestra la galería de imágenes, información técnica, ubicación y modelos disponibles.
  - Gestiona la navegación y el estado de carga/error.
  - **Match Quality:** Enriquece la señal enviando datos del usuario logueado (Email, Teléfono, Nombre) protegidos mediante hash en el servidor.
  - **SEO & Microdatos:** 
    - Inyecta `SEOHead` con títulos y descripciones optimizados.
    - Maneja interceptadores de renderizado: previene indexación de textos "Cargando..." e inyecta dinámicamente `<meta name="robots" content="noindex">` si el desarrollo es un Soft 404.
    - Utiliza `StructuredData` para emitir microdatos de tipo `RealEstateAgent` y calcular el rango de precios dinámico.

### `DevelopmentDetailsContent.jsx`
Componente visual interno de `DetalleDesarrollo`.
- **Analítica (Hybrid Tracking):**
  - Implementa **Meta CAPI** para el evento `PageView`.
  - Genera su propio `eventId` para asegurar la cobertura incluso si la navegación SPA no dispara el pixel del navegador correctamente o es bloqueado.
  - **Match Quality:** Enriquece los eventos `PageView` y `Contact` con PII de usuario autenticado.

### `Catalogo.jsx`
Pantalla principal del listado de desarrollos.
- **Funcionalidad:** Muestra tarjetas de propiedades con filtros básicos.

### `DetalleModelo.jsx`
Pantalla de detalle para un modelo específico (prototipo) dentro de un desarrollo.
- **Ruta:** `/modelo/:id`
- **SEO & Microdatos:**
  - Inyecta `SEOHead` con el nombre del modelo y el desarrollo asociado.
  - Emplea la misma estrategia de intercepción de Sitelinks en el enrutador para evitar Sitelinks temporales y Soft 404s vía `noIndex`.
  - Genera microdatos `Product` (Schema.org) incluyendo el precio exacto (`precioNumerico`), moneda (MXN) y disponibilidad para visualización en resultados enriquecidos de Google.

### `Mapa.jsx`
Vista de mapa para la exploración geoespacial de los desarrollos.
- **Interacción (Hammer Fix):** Implementa una estrategia agresiva para garantizar interactividad instantánea en dispositivos híbridos (Windows Touch):
  - `tap={false}` en Leaflet para evitar conflictos táctiles.
  - **Body Scroll Lock:** Bloquea físicamente el scroll de la página (`overflow: hidden`) al montar el mapa para evitar que el primer click sea interpretado como "pan".
  - **Auto-Focus:** El mapa reclama el foco del navegador al cargar.
  - **CSS Global:** Requiere overrides específicos en `index.css` (`touch-action: none`, `isolation: isolate`) para evitar que el navegador capture eventos.
## Dependencias Clave
- **Services:** `CatalogService` (datos), `MetaAdsService` (tracking client-side).
- **SEO Elements:** `SEOHead`, `StructuredData`.
- **Context:** `UserContext` (tracking comportamiento interno), `CatalogContext` (estado global).
- **Firebase Functions:** `onLeadIntentMETA` (tracking), `generateSitemap` (rastreo orgánico).
