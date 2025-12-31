# Auditoría Técnica: Data Manager

**Fecha:** 30 Diciembre 2025
**Auditor:** Google Antigravity Staff Engineer
**Estatus:**  🔴 Requiere Refactorización Crítica

## 1. Resumen Ejecutivo
El módulo `data-manager` opera funcionalmente pero viola principios clave del `MANUALDEARQUITECTURA.md`, específicamente en modularidad, estructura de carpetas y principio DRY. Existen vestigios de lógica "legacy" (campos como `ActivoModelo`) y duplicidad en el manejo de fechas y limpieza de datos entre `adapters.js` y `shared/zod-utils.js`.

## 2. Hallazgos por Categoría

### A. Seguridad y Validación (Zod & Datos)
*   ✅ **Zod Schemas**: `schemas.js` define modelos robustos.
*   ⚠️ **Inconsistencia de Adaptadores**: `adapters.js` realiza transformaciones manuales (piping, parsing) que deberían estar centralizadas o integradas en la coerción de Zod para evitar "doble verdad".
*   ⚠️ **Validación en Recálculos**: `calculations.js` lee y escribe directamente en Firestore sin re-validar con Zod schemas, lo que puede corromper la base de datos con datos inválidos si la lógica falla.
*   ⚠️ **Campos Anidados**: `AnalisisIASchema` y `PromocionSchema` están definidos, pero la lógica de importación en `adapters.js` hace parsing manual propenso a errores de zonas horarias.

### B. Código Obsoleto y "Vibe Coding"
*   🔴 **Lógica Legacy**: Referencias a campos antiguos como `ActivoModelo` en `calculations.js` y `adapters.js`. El sistema debe estandarizarse a `activo` (booleano).
*   🔴 **Hardcoded Init**: En `import.js` (L147), se inicializan campos operacionales (`asesoresAutorizados`) hardcoded, lo cual debería ser responsabilidad de un modelo o servicio de instanciación.
*   🔴 **Comentarios "TODO/Vibe"**: `calculations.js` contiene flujos de lógica iterativa ("Reset loop") y comentarios sobre optimizaciones de memoria no implementadas en `import.js`.

### C. Optimización DRY (Don't Repeat Yourself)
*   🔴 **Duplicidad de Date Parsing**: `adapters.js` re-implementa lógica de parseo de fechas (`parseDateHelper`) que parcialmente existe en `parseDateWithTimezone` (`timezones.js`) y `zod-utils.js`.
*   🔴 **Limpieza de Strings**: `cleanStr` y `cleanEmail` en `adapters.js` deberían ser utilidades compartidas accesibles por todo el sistema, posiblemente en una librería centralizada.

## 3. Conformidad con MANUALDEARQUITECTURA.md
*   ❌ **Estructura de Archivos**: La carpeta usa `lib/` plano. Debería migrar a una arquitectura de capas:
    *   `/src/models`: Schemas Zod.
    *   `/src/services`: Lógica de negocio (`ImportService`, `StatsService`).
    *   `/src/adapters`: Transformadores CSV.
    *   `/src/utils`: Helpers compartidos.

## 4. Plan de Refactorización (Task List)

### Fase 1: Reestructuración y Limpieza
- [ ] **Mover archivos a estructura `/src`**: Seguir la norma.
- [ ] **Unificar Utilerías de Fecha**: Crear `src/utils/date-utils.js` usando `date-fns-tz` (o la lógica actual de timezone) y eliminar implementaciones ad-hoc en adaptadores.
- [ ] **Eliminar Legacy Fields**: Remover soporte para `ActivoModelo` y `status` con pipes antiguos. Estandarizar a `activo: boolean`.

### Fase 2: Robustez en Servicios
- [ ] **Refactor `calculations.js` -> `StatsService`**:
    - Reescribir `recalculateDevelopmentStats` para ser determinista.
    - Asegurar que TODA escritura a DB pase por validación Zod (`DesarrolloSchema.parse(...)`).
- [ ] **Refactor `import.js` -> `ImportService`**:
    - Abstraer lógica de "Estrategia de Importación" (Merge vs Overwrite).
    - Eliminar inicialización hardcoded de campos no relacionados con la importación CSV.

### Fase 3: Pruebas
- [ ] **Unit Tests**: Generar tests para `StatsService` asegurando que los cálculos de precios y stock sean exactos.
- [ ] **Integration Test**: Simular importación de CSV y verificar estado final de DB.

## 5. Riesgos
*   **Corrupción de Datos**: Si se refactoriza `adapters.js` incorrectamente, los IDs deterministas (`slug`) podrían cambiar, duplicando registros en la BD.
*   **Timezones**: La normalización de fechas es crítica para `PromocionSchema`. Cualquier error ahí invalidará campañas activas.

**Recomendación**: Proceder con la refactorización inmediata antes de nuevas cargas de datos.
