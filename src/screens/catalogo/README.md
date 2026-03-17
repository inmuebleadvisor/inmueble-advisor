# Screens: Catálogo — `src/screens/catalogo`

Pantallas de navegación del catálogo inmobiliario. Actúan como **orquestadores de datos**: cargan la información, la pasan a componentes de presentación y gestionan el ciclo SEO/Analítica.

---

## `DetalleModelo.jsx` — Ruta `/modelo/:id`

### Responsabilidad
Pantalla de detalle de un modelo de propiedad (prototipo de casa o departamento).

### Flujo de datos
1. Obtiene `id` desde `useParams`.
2. Busca en cache local (`getModeloById` de `CatalogContext`). Si no existe → llama `catalogService.obtenerInformacionModelo(id)`.
3. Cuando encuentra el modelo, resuelve el desarrollo padre via `getDesarrolloById(idDesarrollo)` y extrae los modelos hermanos por `idDesarrollo`.

### SEO
```jsx
<SEOHead
  title={`${modelo.nombre_modelo} en ${desarrollo?.nombre || 'Venta'}`}
  description="Características, precio y ubicación."
  ogImage={modelo.imagenPrincipal}
  noIndex={!modelo.isUniqueContent}   // false explícito en Firestore → noindex
/>
```
- `noIndex` es dinámico. Controlado por el campo `isUniqueContent` del documento Firestore.
- Default del campo: `true` (indexable). Ver `src/types/Modelo.js`.

### Structured Data
Emite schema `Product` con `offers.price` en MXN y `availability: InStock`.

### Meta Hybrid Tracking (ViewContent)
Dispara ViewContent en browser Pixel + CAPI en mounted. Event deduplication via `eventId` generado por `MetaService`.

### Componentes delegados
- **`ModelDetailsContent`** — Layout y presentación completa.
- **`SEOHead`** / **`StructuredData`** — Meta e inyección de JSON-LD.

---

## `DetalleDesarrollo.jsx` — Ruta `/desarrollo/:id`

### Responsabilidad
Pantalla de detalle de un proyecto inmobiliario completo.

### Flujo de datos
1. Obtiene `id` desde `useParams`.
2. Llama directamente `catalogService.obtenerInformacionDesarrollo(id)` — no usa cache local.
3. Los modelos relacionados vienen dentro de `desarrollo.modelos` (ya incluidos en el response del servicio).

### SEO
```jsx
<SEOHead
  title={`Desarrollo ${desarrollo.nombre} | Preventa...`}
  description={`...en ${desarrollo.ubicacion?.ciudad}...`}
  ogImage={desarrollo.imagen}
  noIndex={!desarrollo.isUniqueContent}  // false explícito en Firestore → noindex
/>
```
- Mismo contrato `isUniqueContent` que `DetalleModelo`. Ver `src/types/Desarrollo.js`.

### Structured Data
Emite schema `RealEstateAgent` con `address.addressLocality` y `priceRange` calculado desde `modelos`.

### Meta Hybrid Tracking (ViewContent)
Mismo patrón que `DetalleModelo`. El `minPrice` se calcula como `Math.min(...modelos.map(m => m.precioNumerico))`.

### Componentes delegados
- **`DevelopmentDetailsContent`** — layout, galería, modelos disponibles.
- **`SEOHead`** / **`StructuredData`** — Meta e inyección de JSON-LD.

---

## Dependencias compartidas

| Dependencia | Propósito |
|---|---|
| `CatalogContext` | Cache y acceso sin re-fetch a modelos/desarrollos ya cargados. |
| `UserContext` | PII para Advanced Matching de Meta. `trackBehavior` para analytics interno. |
| `useService()` | Inyección de `catalogService` y `metaService`. |
| `SEOHead` | Control de metadata y directiva `noindex`. |
| `StructuredData` | Rich Snippets (JSON-LD). |
