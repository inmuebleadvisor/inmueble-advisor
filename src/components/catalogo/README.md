# Módulo Catálogo — `src/components/catalogo`

Componentes visuales de presentación del inventario inmobiliario. Orquestan UI, no lógica de datos.

---

## `DevelopmentDetailsContent.jsx`

Orquestador visual del detalle de un **Desarrollo**. Layout: hero carousel + info + lista de modelos.

### Props

| Prop | Tipo | Descripción |
|---|---|---|
| `desarrollo` | `object` | Objeto mapeado por `mapDesarrollo`. |
| `onBack` | `function` | Callback para botón de regreso. |
| `isModal` | `boolean` | Default `false`. Si `true`, adapta el layout para uso dentro de Modal. |

### Hero Image — LCP
```jsx
// El primer item del carrusel activa fetchPriority="high" vía la prop priority
{galeriaImagenes.map((img, idx) => (
    <ImageLoader src={img} priority={idx === 0} />
))}
```
El CSS del contenedor usa `aspect-ratio: 16/9` en `.dev-details__header` para reservar espacio y eliminar CLS.

### Modales — Code Splitting (INP)
```javascript
// Importación lazy — solo se descarga cuando el usuario abre el modal
const LeadCaptureForm = React.lazy(() => import('../leads/LeadCaptureForm'));
const MortgageSimulatorModal = React.lazy(() => import('../modals/MortgageSimulatorModal'));
```
Los modales se renderizan con `<React.Suspense fallback={null}>` para no bloquear la UI.

### Sticky Panel
`useStickyPanel(headerRef)` activa `StickyActionPanel` (barra inferior móvil) cuando el header sale del viewport.

---

## `ModelDetailsContent.jsx`

Orquestador visual del detalle de un **Modelo**. Layout marketplace: galería + info + aside sticky.

### Props

| Prop | Tipo | Descripción |
|---|---|---|
| `modelo` | `object` | Objeto mapeado por `mapModelo`. |
| `desarrollo` | `object\|null` | Desarrollo padre. Puede ser `null`. |
| `modelosHermanos` | `object[]` | Modelos del mismo desarrollo, para cross-sell. |
| `onBack` | `function` | Callback de navegación. |
| `isModal` | `boolean` | Default `false`. |

### Datos derivados (via `modelPresentationService`)
- `galeriaItems` — imágenes normalizadas.
- `precioFormateado` — MXN formateado.
- `simulatorPayload` — objeto pre-armado para el simulador hipotecario.

### Modales — Code Splitting (INP)
Mismo patrón `React.lazy` que `DevelopmentDetailsContent`. Ver arriba.

### Autenticación antes de formulario
`handleOpenLeadForm` → si el usuario no está logueado, lanza `loginWithGoogle()` antes de abrir el form.

---

## `model-details/ModelHeader.jsx`

Galería de imágenes del modelo (stage + thumbnails + swipe + Delightbox).

### Props

| Prop | Tipo | Descripción |
|---|---|---|
| `galeriaItems` | `array` | URLs o objetos `{url, type}`. Acepta strings directos o nesting de Firestore. |
| `esPreventa` | `boolean` | Muestra badge "Preventa". |
| `isModal` | `boolean` | Oculta botón de regreso. |
| `onBack` | `function` | Callback botón regreso. |

### LCP — `<img>` del stage principal
```jsx
<img
  loading={activeIndex === 0 ? "eager" : "lazy"}
  fetchPriority={activeIndex === 0 ? "high" : "auto"}
/>
```
Solo la imagen `activeIndex === 0` (visible en carga) recibe prioridad alta.

### CSS — `ModelHeader.css`
`.model-gallery__stage { aspect-ratio: 16/9 }` — unificado en móvil y desktop para CLS = 0.

### Interacciones
- **Swipe táctil:** `onTouchStart/Move/End` con umbral `minSwipeDistance = 50px`.
- **Desktop:** Botones `ChevronLeft/ChevronRight` (solo visibles ≥1024px via CSS).
- **Fullscreen:** Click en stage → abre `Delightbox` con todos los ítems.

---

## Estándares del Módulo

1. **BEM obligatorio** en todos los classNames. Prefijo = bloque raíz del archivo CSS.
2. **Sin lógica de negocio** en los componentes. Delegar a `src/services/`.
3. **Code Splitting** para cualquier modal o componente pesado importado condicionalmente.
4. **Animaciones** con `cubic-bezier(0.4, 0, 0.2, 1)` (`--ease-premium`). Velocidades: `0.2s` hover, `0.3s` entradas.
