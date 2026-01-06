# 🎨 UI Components

Este directorio contiene **componentes de presentación reutilizables** y agnósticos al negocio.
Estos componentes reciben datos vía `props` y no deberían contener lógica de negocio compleja ni llamadas directas a APIs (salvo excepciones controladas).

## Contenido

*   **Atomos/Moleculas:** `FavoriteBtn`, `Icons`, `WhatsAppButton`.
*   **Modales:** `Modal`, `FilterModal`, `HighlightsModal`.
*   **Layout:** `StickyActionPanel`, `Delightbox` (Lightbox de imágenes).

## Reglas
1.  Si el componente es específico de una funcionalidad (ej. `LeadForm`), usar `src/components/leads`.
2.  Si es un componente base (ej. `Button`), va aquí.
