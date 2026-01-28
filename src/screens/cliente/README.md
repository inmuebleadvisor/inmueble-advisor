# Onboarding Cliente 🏠

Este módulo gestiona la experiencia inicial del comprador ("Buyer First"), permitiendo descubrir su capacidad financiera y las propiedades que mejor se adaptan a sus necesidades.

## 🚀 Funcionalidades Clave

1.  **Enfoque Financiero (2 Pasos):** El onboarding ha sido optimizado a solo 2 pasos, iniciando directamente con "Hablemos de números" para reducir la fricción.
2.  **Cálculo Desacoplado:** Utiliza `FinancialService` para determinar el presupuesto máximo real, separando la lógica de negocio de la UI.
3.  **Motor de Filtrado Unificado:** Implementa `CatalogService.applyQualityFilters` y `CatalogService.enrichModels` para garantizar consistencia total con el catálogo.
4.  **Confirmación y Registro:** Integración con Google Auth y persistencia del perfil financiero en Firestore.

## 🧠 Lógica de Negocio

### Cálculo del Presupuesto Máximo
El cálculo es delegado al `FinancialService.calculateAffordability()`, el cual considera:
- **Límite por Efectivo:** Enganche mínimo + gastos notariales.
- **Límite por Capacidad de Pago:** Mensualidad cómoda y factor de crédito.

### Consistencia Onboarding-Catálogo
Para evitar discrepancias, ambos módulos utilizan la misma tubería de procesamiento en `CatalogService`:
1.  `enrichModels()`: Hereda datos del desarrollo (ubicación, constructora).
2.  `applyQualityFilters()`: Aplica reglas globales (ocultar sin fotos/precio).
3.  `filterCatalog()`: Aplica los filtros específicos del usuario.


## 📂 Estructura de Archivos
- `OnboardingCliente.jsx`: Componente principal (Vista y Lógica de UI).
- `../../styles/Onboarding.css`: Estilos siguiendo metodología BEM.
- `../../services/catalog.service.js`: Motor de filtrado compartido.

## 🧪 Pruebas
Las pruebas unitarias se encuentran en `tests/OnboardingCliente.test.jsx`.
Para ejecutar: `npm test tests/OnboardingCliente.test.jsx`

---
⚠️ **Nota de Mantenimiento:** Cualquier cambio en la lógica de filtrado del catálogo debe ser validado en este componente para asegurar que la "promesa" de resultados se mantenga íntegra.
