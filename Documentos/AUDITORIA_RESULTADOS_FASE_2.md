# Resultados de Auditoría - Fase 2: Patrones y Calidad

**Fecha:** 26 de Enero, 2026
**Estatus:** 🟠 ALTA PRIORIDAD (Violaciones de Patrones de Diseño)

## 1. Violaciones de Desacoplamiento (Backend en Frontend)
El Manual exige que **solo** los Repositorios accedan a la Base de Datos.
*   **🔴 CRÍTICO: `DashboardService` (`src/services/dashboard.service.js`)**
    *   Importa `firebase/firestore` (`doc`, `getDoc`, `query`).
    *   Ejecuta lógica de persistencia directamente.
    *   **Violación**: Repository Pattern.
*   **🟡 MEDIA: `ConfigService` (`src/services/config.service.js`)**
    *   Importa `firebase/firestore`.
    *   Accede directamente a la colección `settings`.
    *   **Violación**: Repository Pattern.
*   **✅ CUMPLIMIENTO**: `CrmService` usa correctamente `leadRepository`. Importa `serverTimestamp` solo como utilidad, lo cual es aceptable (aunque idealmente debería ser agnóstico).

## 2. Inyección de Dependencias (DI)
*   **Estado General**: Bueno.
*   **Execpción**: `DashboardService` crea su propia lógica de DB. Aunque se inyecta `db` en el constructor (en `service.provider.js`), la clase *conoce* demasiado sobre la implementación de Firestore (colecciones, queries).

## 3. Calidad Frontend (Semántica y Estilos)
Se analizó `OnboardingCliente.jsx` y `Onboarding.css` como muestra representativa.

### A. CSS / BEM (Metodología)
*   **Hallazgo**: Uso débil de BEM.
*   **Ejemplo Negativo**:
    ```css
    .onboarding-card { ... }
    .progress-bar-container { ... } /* Debería ser .onboarding-card__progress */
    .step-content { ... } /* Selector genérico global, riesgo de colisión */
    ```
*   **Riesgo**: Colisiones de estilos y baja mantenibilidad. `onboarding-title` está bien, pero falta bloque contenedor claro.

### B. HTML Semántico
*   **Hallazgo**: "Div Soup" (Sopa de Divs).
*   **Análisis**:
    *   Se usa `<div className="onboarding-container">`. **Correcto**: `<main>`.
    *   Se usa `<div className="onboarding-card">`. **Correcto**: `<section>` o `<article>`.
    *   Se usa `<h1 className="onboarding-title">`. ✅ Correcto.
*   **Impacto**: Accesibilidad baja y SEO semántico pobre.

## Tabla de Acciones Inmediatas (Remediación Fase 2)

| Prioridad | Tarea | Descripción |
| :--- | :--- | :--- |
| 🔴 Alta | Refactorizar `DashboardService` | Extraer lógica de Firestore a `DashboardRepository`. |
| 🟡 Media | Refactorizar `ConfigService` | Extraer lógica a `ConfigRepository`. |
| 🟢 Baja | Refactorizar Frontend Semántico | Cambiar `div`s contenedores por `main`, `section`. (Pospuesto a Fase 3/Refactor). |
