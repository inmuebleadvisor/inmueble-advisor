# Componentes Comunes — `src/components/common`

Componentes transversales y agnósticos al dominio. No contienen lógica de negocio.

---

## `ImageLoader.jsx`

Wrapper de `<img>` con skeleton de carga y soporte optimizado para LCP.

### Props

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `src` | `string` | — | URL de la imagen. |
| `alt` | `string` | — | Texto alternativo. Obligatorio para accesibilidad. |
| `className` | `string` | — | Clase BEM del contenedor externo. |
| `style` | `object` | — | Estilos inline adicionales del contenedor. |
| `priority` | `boolean` | `false` | **LCP Flag.** Si `true` → `loading="eager"` + `fetchPriority="high"`. Usar solo en la imagen visible Above-the-fold (primera imagen del hero). |

### Comportamiento

- Muestra un **skeleton animado** mientras la imagen carga (`opacity: 0` → `1`).
- En error → muestra `FALLBACK_ICON` (icono institucional de Firebase Storage).
- El contenedor externo siempre ocupa el 100% del espacio del padre.

### Regla de uso para LCP

```jsx
// ✅ CORRECTO — Solo el primer item del carrusel recibe priority
{galeriaImagenes.map((img, idx) => (
    <ImageLoader src={img} alt="..." priority={idx === 0} />
))}

// ❌ INCORRECTO — Nunca pasar priority a todas las imágenes
{galeriaImagenes.map((img) => (
    <ImageLoader src={img} alt="..." priority={true} />
))}
```

---

## `SEOHead.jsx`

Inyector dinámico de metadatos SEO usando `react-helmet-async`.

### Props

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `title` | `string` | `'Inmueble Advisor \| ...'` | Título de la página. Se concatena con `\| Inmueble Advisor`. |
| `description` | `string` | Descripción genérica | Meta description. |
| `keywords` | `string` | Keywords genéricas | Meta keywords. |
| `ogImage` | `string` | Favicon institucional | URL de imagen OG para social sharing. |
| `ogUrl` | `string` | — | URL canónica OG. |
| `noIndex` | `boolean` | `false` | Si `true` → `<meta name="robots" content="noindex, nofollow">`. |

### Cuándo usar `noIndex={true}`

1. Estado de error (`!modelo`, `!desarrollo`) — Soft 404.
2. Estado de carga (`loading === true`) — Contenido parcial.
3. Listado IDX/MLS genérico: `noIndex={!entidad.isUniqueContent}`. El campo `isUniqueContent` viene del mapper de Firestore con default `true`.

---

## `StructuredData.jsx`

Inyector de JSON-LD para Schema.org. Recibe un objeto `data` y lo renderiza como `<script type="application/ld+json">`.

- **Modelos:** Schema `Product` con `offers.price` y `offers.availability`.
- **Desarrollos:** Schema `RealEstateAgent` con `address` y `priceRange`.

---

## `MetaTracker`

Gestor global de PageView para Meta Ads (Pixel + CAPI). Montado dentro de `BrowserRouter` en `App.jsx`.

- **Modo Manual:** `disablePushState = true`. Es la **única** fuente de `PageView`, garantizando deduplicación con server events.
- Genera un `EventID` único por cada cambio de ruta.
