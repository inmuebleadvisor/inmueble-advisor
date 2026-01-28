# Onboarding Cliente 🏠

Este módulo gestiona la experiencia inicial del comprador ("Buyer First"), permitiendo descubrir su capacidad financiera y las propiedades que mejor se adaptan a sus necesidades.

## 🚀 Funcionalidades Clave

1.  **Perfilamiento Dinámico:** Captura de preferencias de recámaras y tiempo de entrega.
2.  **Calculadora de Capacidad:** Algoritmo financiero que cruza ahorros (`capitalInicial`) y mensualidad cómoda para determinar el presupuesto máximo real, incluyendo gastos notariales.
3.  **Motor de Filtrado Unificado:** Utiliza `CatalogService.filterCatalog` para garantizar que el número de opciones mostrado sea idéntico al que el usuario verá en el catálogo principal.
4.  **Confirmación y Registro:** Integración con Google Auth y persistencia del perfil financiero en Firestore.

## 🧠 Lógica de Negocio

### Cálculo del Presupuesto Máximo
El presupuesto se calcula en base a la restricción más fuerte:
- **Límite por Efectivo:** Basado en el enganche mínimo y gastos notariales requeridos.
- **Límite por Capacidad de Pago:** Basado en la mensualidad y el factor de crédito por millón.

### Consistencia Onboarding-Catálogo
Para evitar discrepancias, este componente consume:
- `obtenerDatosUnificados()` (Modelos)
- `obtenerInventarioDesarrollos()` (Contexto de construcción)

El filtrado utiliza el objeto de configuración oficial definido en `CatalogService`.

## 📂 Estructura de Archivos
- `OnboardingCliente.jsx`: Componente principal (Vista y Lógica de UI).
- `../../styles/Onboarding.css`: Estilos siguiendo metodología BEM.
- `../../services/catalog.service.js`: Motor de filtrado compartido.

## 🧪 Pruebas
Las pruebas unitarias se encuentran en `tests/OnboardingCliente.test.jsx`.
Para ejecutar: `npm test tests/OnboardingCliente.test.jsx`

---
⚠️ **Nota de Mantenimiento:** Cualquier cambio en la lógica de filtrado del catálogo debe ser validado en este componente para asegurar que la "promesa" de resultados se mantenga íntegra.
