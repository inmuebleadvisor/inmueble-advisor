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
- **Analítica (Hybrid Tracking):**
  - Implementa **Meta CAPI** para eventos de navegación (`ViewContent`).
  - Genera un `eventId` único para deduplicación entre Pixel y Server.
  - Utiliza `onLeadIntentMETA` (Firebase Callable) para enviar señales de alta intención directamente desde el backend.
  - **Match Quality:** Enriquece la señal enviando datos del usuario logueado (Email, Teléfono, Nombre) protegidos mediante hash en el servidor.

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

### `Mapa.jsx`
Vista de mapa para la exploración geoespacial de los desarrollos.
- **Interacción:** Configurado con `tap={false}` para evitar conflictos de eventos (doble clic requerido) en dispositivos táctiles/híbridos.
## Dependencias Clave
- **Services:** `CatalogService` (datos), `MetaAdsService` (tracking client-side).
- **Context:** `UserContext` (tracking comportamiento interno), `CatalogContext` (estado global).
- **Firebase Functions:** `onLeadIntentMETA` para eventos server-side.
