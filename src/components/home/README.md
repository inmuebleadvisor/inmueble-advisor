# Home Components 🏠

Este directorio contiene los bloques fundamentales que componen la página de inicio (Home) de Inmueble Advisor.

## 🧱 Componentes Principales

### 1. HeroSection
*   **Archivo:** `HeroSection.jsx`
*   **Responsabilidad:** Punto de entrada visual. Contiene el título principal y el acceso al buscador global.
*   **Estilos:** `../../styles/components/home/HeroSection.css`
*   **Interacción:** Al hacer clic en el buscador, navega al catálogo o abre el modal de filtros.

### 2. AffordabilityWidget (Calculadora)
*   **Archivo:** `AffordabilityWidget.jsx`
*   **Responsabilidad:** Permite al usuario calcular su presupuesto máximo basado en ingresos y enganche.
*   **Lógica:** Consume `financial.service.js` vía Inyección de Dependencias.
*   **Sincronización:** Al navegar al catálogo, envía la bandera `resetFilters: true` para asegurar que los resultados coincidan con el cálculo.
*   **Estilos:** `../../styles/components/home/AffordabilityWidget.css` (Diseño Premium Dark).

### 3. FeaturedDevelopers
*   **Archivo:** `FeaturedDevelopers.jsx`
*   **Responsabilidad:** Muestra carrusel de logos de desarrolladores destacados, filtrado por la ciudad seleccionada en el contexto.
*   **Estilos:** `../../styles/components/home/FeaturedDevelopers.css`

## 🎨 Metodología de Diseño
Todos los componentes siguen:
- **Metodología BEM** para clases CSS.
- **Sistema de 8px** para márgenes y paddings.
- **Tokens de Color** definidos en `index.css`.

## 🧪 Testing
Cada componente tiene su archivo de pruebas correspondiente en la raíz del directorio con el prefijo `test_`.
Ejemplo: `npm test src/components/home/test_AffordabilityWidget.jsx`
