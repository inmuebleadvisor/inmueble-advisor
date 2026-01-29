# 🎨 Inmueble Advisor - Styles System

Este directorio contiene la arquitectura visual de la plataforma, basada en un diseño **Premium Dark Mode** con soporte para temas claros.

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
- `Mapa.jsx`: Integración con Leaflet y visualización geoespacial.

## 🛠 Mantenimiento
1. **No usar hardcoding**: Usa siempre `var(--nombre-variable)`.
2. **Metodología BEM**: Mantén la estructura `bloque__elemento--modificador`.
3. **8px Grid**: Todos los márgenes y rellenos deben ser múltiplos de 8.
