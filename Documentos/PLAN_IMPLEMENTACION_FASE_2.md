# Plan de Implementación - Fase 2: Refactorización de Servicios a Repositorios

Este documento define la estrategia para desacoplar `DashboardService` y `ConfigService` de Firestore, moviendo la lógica de persistencia a Repositorios dedicados.

## Análisis de Impacto
*   **Archivos Afectados**:
    *   `src/services/dashboard.service.js` (Modificación)
    *   `src/services/config.service.js` (Modificación)
    *   `src/services/service.provider.js` (Modificación)
    *   `src/repositories/dashboard.repository.js` (Nuevo)
    *   `src/repositories/config.repository.js` (Nuevo)
*   **Riesgo**: Bajo. No se cambia la firma pública de los métodos, solo su implementación interna.

## Estrategia de Implementación
Para evitar duplicidad y mantener consistencia con `LeadRepository` y `CatalogRepository`, seguiremos el patrón de "Constructor con Inyección de DB".

### Paso 1: Refactorización Dashboard
1.  **Crear `src/repositories/dashboard.repository.js`**:
    *   Clase `DashboardRepository`.
    *   Métodos: `getLatestStats()`, `getHistory(days)`.
    *   Mover imports de `firebase/firestore` aquí.
2.  **Modificar `src/services/dashboard.service.js`**:
    *   Eliminar imports de Firestore.
    *   Constructor recibe `dashboardRepository` en lugar de `db`.
    *   Delegar llamadas al repositorio.
3.  **Actualizar `src/services/service.provider.js`**:
    *   Instanciar `const dashboardRepository = new DashboardRepository(db)`.
    *   Inyectar en `new DashboardServiceImpl(dashboardRepository)`.

### Paso 2: Refactorización Config
1.  **Crear `src/repositories/config.repository.js`**:
    *   Clase `ConfigRepository`.
    *   Variables `SETTINGS_COLLECTION`, `SETTINGS_DOC_ID`.
    *   Métodos: `getSettings()`, `updateSettings(data)`.
2.  **Modificar `src/services/config.service.js`**:
    *   Eliminar imports de Firestore.
    *   Constructor recibe `configRepository`.
    *   Mantiene la lógica de negocio (defaults, merge), delega la lectura/escritura cruda.
3.  **Actualizar `src/services/service.provider.js`**:
    *   Instanciar `const configRepository = new ConfigRepository(db)`.
    *   Inyectar en `new ConfigService(configRepository)`.

## Verificación
*   **Dashboard**: Verificar que `DashboardService.getLatestStats()` sigue devolviendo datos (o null) sin errores.
*   **Config**: Verificar que `ConfigService.getPlatformSettings()` devuelve los defaults o datos reales.
*   **Build**: Ejecutar `npm run build` para asegurar que no hay referencias rotas.
