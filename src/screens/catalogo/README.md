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

### `DevelopmentDetailsContent.jsx`
Componente visual interno de `DetalleDesarrollo`.
- **Analítica (Hybrid Tracking):**
  - Implementa **Meta CAPI** para el evento `PageView`.
  - Genera su propio `eventId` para asegurar la cobertura incluso si la navegación SPA no dispara el pixel del navegador correctamente o es bloqueado.

### `Catalogo.jsx`
Pantalla principal del listado de desarrollos.
- **Funcionalidad:** Muestra tarjetas de propiedades con filtros básicos.

### `DetalleModelo.jsx`
Pantalla de detalle para un modelo específico (prototipo) dentro de un desarrollo.

### `Mapa.jsx`
Vista de mapa para la exploración geoespacial de los desarrollos.

## Dependencias Clave
- **Services:** `CatalogService` (datos), `MetaAdsService` (tracking client-side).
- **Context:** `UserContext` (tracking comportamiento interno), `CatalogContext` (estado global).
- **Firebase Functions:** `onLeadIntentMETA` para eventos server-side.
