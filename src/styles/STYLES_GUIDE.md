# 💎 Guía Maestra de Estilos Premium - Inmueble Advisor

Esta es la **fuente de verdad única** para la interfaz de Inmueble Advisor. Define los estándares visuales, técnicos y de diseño para mantener una experiencia "Premium" consistente.

---

## 1. Filosofía de Diseño: "Buyer First"
Nuestro diseño transmite autoridad, éxito y seguridad mediante:
- **Aesthetics**: Uso de *Dark Slate* (#0f172a), dorados (*Gold*) y efectos de cristal (*Glassmorphism*).
- **Ritmo Visual**: Layouts limpios basados en un sistema matemático de espaciado.
- **Movimiento Premium**: Animaciones sutiles con curvas de aceleración naturales.

---

## 2. Configuración de Colores — Dark Premium (Único)
Los colores se inyectan a través de variables CSS en `src/index.css`. No existe modo claro.

### 🎨 Variables Base (Tokens Raíz)
| Variable | Propósito | Valor |
| :--- | :--- | :--- |
| `--base-primary-dark` | Oro Brillante (Primario activo) | `#f59e0b` |
| `--base-brand-blue` | Azul Corporativo (Slate) | `#0f172a` |
| `--base-accent-blue` | Acentos y Highlights | `#0284c7` |

### 🌑 Tema Dark Premium (Default y Único)
| Elemento | Valor |
| :--- | :--- |
| Fondo Principal (`--bg-main`) | `#0f172a` |
| Fondo Secundario (`--bg-secondary`) | `#1e293b` |
| Texto Principal (`--text-main`) | `#f8fafc` |
| Color Primario (`--primary-color`) | `--base-primary-dark` |

---

## 3. Estándares Técnicos

### 🛠 Metodología BEM (Block Element Modifier)
Uso profesional de clases CSS para evitar colisiones:
- `.card` (Bloque)
- `.card__title` (Elemento)
- `.card--featured` (Modificador)

### 📐 Sistema de Espaciado (8px Grid)
Todos los márgenes, paddings y gaps deben ser múltiplos de **8px**:
`4px (micro), 8px, 16px, 24px, 32px, 48px, 64px`.

### 📱 Breakpoints y Layout
- **Móvil**: `< 768px`
- **Escritorio**: `>= 768px`
- **Contenedor Máximo**: `1200px`

### 🏗️ Jerarquía de Capas (Z-Index)
1. `1100`: Toggles Críticos (Hamburguesa).
2. `1050`: Modales y Menús Móviles.
3. `1000`: Navbars y Sticky Header.
4. `400`: Paneles de Mapas (Leaflet).
5. `2`: Footer.

---

## 4. Componentes y Patrones

### 🔘 Botones Globales (`buttons.css`)
- `.btn-primary`: Degradado Gold, sombra resplandeciente.
- `.btn-secondary`: Contorno que transmuta a cristal al hover.

### 🃏 Tarjetas (`CardTokens.css`)
Sistema de tokens compartido para `DevelopmentCard` y `PropertyCard`.
- **Dimensiones**: Radio `32px` (`--radius-xl`), Padding `24px`.
- **Efectos**: Elevación al hover (`translateY(-4px)`), sombra expansiva (`--shadow-lg`).
- **Imágenes**: Altura estándar `240px` con zoom suave (`--ease-premium`).

### 🛡️ Interactive Badges (Sellos de Confianza)
- **Visual**: Fondo secundario, borde sutil de 1px, radius de 8px.
- **Interacción**: Al hover aplica `translateY(-2px)`, vira a Gold y activa `var(--shadow-glow)`.

### 🔍 Buscador Premium (`SearchBar`)
Elemento central de navegación y conversión:
- **Presentación**: Diseño tipo "píldora" con fondo blanco puro (`#ffffff`) y radio `32px` (`--radius-xl`).
- **Sombras**: Usa `--shadow-lg` para un efecto de flotación sobre el fondo oscuro.
- **Ancho**: Fluido (`width: 100%`) con un tope de seguridad de `800px` para legibilidad.
- **Tipografía**: Texto oscuro (`--base-brand-blue`) para máximo contraste.
- **Interacción**: En `:focus-within` aplica un aura de marca (`--primary-color`) de 4px con opacidad.
- **Contenedor**: El contenedor global `.search-bar` debe ser transparente y sin fondo para integrarse fluidamente en cualquier sección (Home o Catálogo).

### ✨ Animaciones
- **Easing**: Siempre usar `cubic-bezier(0.4, 0, 0.2, 1)` para un movimiento fluido y premium.
- **Velocidad**: `0.2s` para estados simples, `0.3s` para entradas de componentes.

---

## 5. Iconografía (Lucide)
- **Biblioteca**: `lucide-react`.
- **Estándar**: `strokeWidth={2}`.
- **Tamaños**: `20px` (Utility), `24px` (Normal), `28px` (Header/Grandes).

---

## 6. Checklist de Entrega
1. [ ] ¿Usa BEM sin anidamiento profundo?
2. [ ] ¿Todos los colores son variables CSS?
3. [ ] ¿El espaciado es múltiplo de 8px?
4. [ ] ¿Usa exclusivamente las variables del Dark Premium?
5. [ ] ¿Usa el Easing estándar para las transiciones?

---
*Última actualización: Febrero 2026. Consolidado a Dark Premium único.*
