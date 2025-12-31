# Plan de Implementación: Refactorización Data Manager

**Objetivo:** Modernizar y purgar `data-manager` para cumplir con los estándares de calidad y arquitectura, manteniendo la lógica dentro de la carpeta `data-manager` (sin migrar a `/src`).

## User Review Required
> [!NOTE]
> **Estructura de Directorios**: Se mantendrá el directorio `lib/` pero se organizará internamente para separar responsabilidades.
> - `lib/` (raíz) -> `index.js` (EntryPoint)
> - `lib/services/` -> Lógica de negocio (`ImportService`, `StatsService`)
> - `lib/adapters/` -> Transformadores de datos (`CSVAdapter`)
> - `lib/models/` -> Definiciones de datos (`Zod Schemas`)
> - `lib/utils/` -> Helpers compartidos (Fecha, String, Firebase)

## Proposed Changes

### 1. Limpieza y Organización (DRY & Structure)
Centralizar utilerías para eliminar código duplicado en `adapters.js` y `calculations.js`.

#### [NEW] [date.utils.js](file:///c:/Users/novat/inmueble-advisor/data-manager/lib/utils/date.utils.js)
- Consolidar toda la lógica de `parseDate`, `parseDateWithTimezone`, `parseDateHelper`.
- Asegurar manejo correcto de Timezones (Mexico_City).

#### [NEW] [string.utils.js](file:///c:/Users/novat/inmueble-advisor/data-manager/lib/utils/string.utils.js)
- Centralizar `cleanStr`, `slugify`, `cleanEmail`, `cleanPhone`.

#### [MODIFY] [adapters.js](file:///c:/Users/novat/inmueble-advisor/data-manager/lib/adapters.js)
- **Acción**: Refactorizar para usar `date.utils.js` y `string.utils.js`.
- **Cambio**: Eliminar funciones privadas duplicadas y usar las compartidas.

### 2. Eliminación de Código Obsoleto (Legacy)
Eliminar campos y lógica que ya no se usan en la v2 de la plataforma.

#### [MODIFY] [calculations.js](file:///c:/Users/novat/inmueble-advisor/data-manager/lib/calculations.js)
- **Acción**: Remover soporte para `ActivoModelo` (Legacy). Solo usar `activo`.
- **Acción**: Eliminar lógica de "Reset loop" y comentarios TODO innecesarios.
- **Mejora**: Usar validación Zod explícita antes de escribir updates en `recalculateDevelopmentStats`.

### 3. Seguridad de Datos (Zod Enforcement)
Asegurar que ninguna escritura a Firestore ocurra sin pasar por un esquema Zod.

#### [MODIFY] [import.js](file:///c:/Users/novat/inmueble-advisor/data-manager/lib/import.js)
- **Acción**: Abstraer la lógica de inicialización (valores por defecto) a los Schemas de Zod (`.default(...)`).
- **Acción**: Eliminar inicialización manual de objetos `operacion` o `stats` si Zod ya lo maneja.

### 4. Reestructuración de Archivos
Mover archivos para cumplir SRP (Single Responsibility Principle) dentro de `lib/`.

#### [MOVE] `lib/schemas.js` -> `lib/models/schemas.js`
#### [MOVE] `lib/calculations.js` -> `lib/services/stats.service.js`
#### [MOVE] `lib/import.js` -> `lib/services/import.service.js`
#### [MOVE] `lib/export.js` -> `lib/services/export.service.js`

## Verification Plan

### Automated Tests
1.  **Ejecución de Tests Existentes**:
    - Correr `node test_adapters.js` para verificar que la limpieza de datos sigue funcionando idénticamente.
2.  **Verificación de Importación**:
    - Ejecutar importación de prueba (Dry Run) con un CSV de muestra.
    - Confirmar que no hay errores de validación Zod.

### Manual Verification
- Revisar que `AUDIT_REPORT.md` (si se regenerara) no muestre duplicidad de código.
- Verificar que los logs de consola no muestren advertencias de "Legacy field detected".
