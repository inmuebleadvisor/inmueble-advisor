# 🎨 Inmueble Advisor - Styles System

Directorio de estilos de la plataforma. Tema único: **Light Professional** (fondo blanco `#ffffff`, azul corporativo `#00396a`, acentos dorado `#dcb23a`). Ver `STYLES_GUIDE.md` para la fuente de verdad de tokens y reglas BEM.

## 📄 Recursos Principales
- **[Guía de Estilos Premium](./STYLES_GUIDE.md)**: Estándares de BEM, diseño atómico y tokens. **LECTURA OBLIGATORIA** antes de modificar el CSS.

## 📂 Estructura de Archivos

### Core
- `index.css`: Definición de variables globales (`:root`), resets y utilidades de layout.
- `Layout.css`: Estructura base de los contenedores principales.
- `Header.css`: Estilos del sistema de navegación principal.

### Librería de Componentes (Shared)
- `buttons.css`: Botones primarios, secundarios, iconos y sellos de confianza.
- `cards.css`: Contenedores con elevación y estados interactivos.

### Estilos Modulares (Screen Specific)
- `Admin.css`: Panel administrativo y tablas de datos.
- `Catalogo.css`: Filtros y cuadrícula de propiedades.
- `Onboarding.css`: Flujo secuencial de entrada de clientes.

### `model-details/` — Detalle de Modelo
- **`ModelHeader.css`**: Galería hero del modelo.
  - `.model-gallery__stage` → `aspect-ratio: 16/9` (móvil y desktop). Garantiza CLS = 0 reservando espacio antes de que cargue la imagen LCP.

### `components/` — Detalle de Desarrollo
- **`DevelopmentDetails.css`**: Layout del detalle de proyecto.
  - `.dev-details__header` → `aspect-ratio: 16/9; height: auto`. Reemplaza el antiguo `height: 380px` fijo que generaba CLS.

## 🛠 Mantenimiento
1. **No usar hardcoding**: Usa siempre `var(--nombre-variable)`.
2. **Metodología BEM**: Mantén la estructura `bloque__elemento--modificador`.
3. **8px Grid**: Todos los márgenes y rellenos deben ser múltiplos de 8.
