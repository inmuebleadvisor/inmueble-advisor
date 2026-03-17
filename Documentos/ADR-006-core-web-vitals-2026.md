# ADR-006: Remediación Core Web Vitals 2026

**Fecha:** 2026-03-17
**Estado:** Aceptado
**Autores:** Antigravity / Deepmind

---

## Contexto

La auditoría técnica del 2026-03-17 identificó 4 hallazgos críticos que afectan el posicionamiento en Google Search Console bajo los umbrales de 2026: LCP > 2.5s, CLS > 0.1 potencial, ausencia de estrategia noindex para contenido IDX/MLS, y bundle inicial bloqueante por modales pesados.

---

## Decisiones

### 1. LCP — `fetchPriority="high"` en lugar de `<link rel="preload">`

**Decisión:** Añadir `fetchPriority="high"` al `<img>` del hero vía la prop `priority` de `ImageLoader`.

**Alternativa descartada:** `<link rel="preload">` en `index.html`. Esta alternativa requeriría conocer la URL de imagen en tiempo de build, lo cual es imposible en un marketplace donde las URLs son dinámicas (Firebase Storage).

**Consecuencia:** El navegador eleva la prioridad de descarga de la imagen en tiempo de ejecución, con mínimo riesgo de regresión.

---

### 2. CLS — `aspect-ratio` en lugar de `height` fijo

**Decisión:** Reemplazar `height: 380px` en `.dev-details__header` y `aspect-ratio: 4/3` en `.model-gallery__stage` por `aspect-ratio: 16/9` en ambos.

**Alternativa descartada:** `min-height` o `padding-bottom: 56.25%` (truco CSS clásico). La propiedad `aspect-ratio` es nativa desde 2021, tiene soporte universal en los browsers objetivo, y es más legible y mantenible.

**Consecuencia:** Los contenedores reservan espacio antes de que las imágenes carguen, eliminando el layout shift visual.

---

### 3. IDX/MLS — Campo `isUniqueContent` con fallback `?? true`

**Decisión:** Exponer `isUniqueContent` en los mappers `Modelo.js` y `Desarrollo.js` con fallback `?? true`. Ningún documento existente recibe `noindex` hasta que un editor marque explícitamente el campo como `false` en Firestore.

**Alternativa descartada:** Aplicar `noindex` por defecto a todos los listados y solo indexar los marcados con `true`. Esto hubiera eliminado del índice de Google todos los listados existentes hasta la migración manual, con consecuencias severas en tráfico orgánico.

**Consecuencia positiva:** La estrategia es aditiva y no destructiva. El equipo puede etiquetar listados progresivamente en Firestore sin urgencia.

---

### 4. INP — `React.lazy` + `Suspense` en lugar de importación dinámica manual

**Decisión:** Migrar `MortgageSimulatorModal` y `LeadCaptureForm` a `const X = React.lazy(() => import(...))` con `<Suspense fallback={null}>`.

**Alternativa descartada:** Mover los componentes a un chunk manual en `vite.config.js`. Esta alternativa requiere configuración de build y no garantiza que el chunk solo se cargue al primer uso; `React.lazy` lo garantiza semánticamente.

**Consecuencia:** El bundle inicial se reduce. El modal se descarga solo una vez, la primera vez que el usuario interactúa. El `fallback={null}` evita cualquier flash de UI mientras carga.

---

## Archivos Modificados

- `src/components/common/ImageLoader.jsx`
- `src/components/catalogo/DevelopmentDetailsContent.jsx`
- `src/components/catalogo/model-details/ModelHeader.jsx`
- `src/styles/components/DevelopmentDetails.css`
- `src/styles/model-details/ModelHeader.css`
- `src/types/Modelo.js`
- `src/types/Desarrollo.js`
- `src/screens/catalogo/DetalleModelo.jsx`
- `src/screens/catalogo/DetalleDesarrollo.jsx`
- `src/components/catalogo/ModelDetailsContent.jsx`
