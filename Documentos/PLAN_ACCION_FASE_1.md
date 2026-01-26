# Plan de Acción - Fase 1: Remediación Estructural

Este plan detalla los pasos técnicos para corregir las discrepancias identificadas en la Auditoría de Arquitectura (Fase 1).

## 1. Frontend: Estandarización de Nomenclatura
**Objetivo**: Asegurar que todos los servicios sigan el patrón `[nombre].service.js`.

*   **Paso 1.1**: Renombrar `src/services/leadAssignmentService.js` a `src/services/leadAssignment.service.js`.
*   **Paso 1.2**: Actualizar referencias a este archivo en `src/services/serviceProvider.js`.
*   **Nota sobre `serviceProvider.js`**: Este archivo actúa como Composition Root (Factory), no como Service. Se mantendrá su nombre o se renombrará a `service.provider.js` para consistencia. **Decisión**: Renombrar a `service.provider.js`.

## 2. Frontend: Centralización de Tests
**Objetivo**: Limpiar el directorio `src/` de archivos de prueba.

*   **Paso 2.1**: Mover `src/services/meta.service.test.js` a `tests/unit/services/meta.service.test.js`.
*   **Paso 2.2**: Validar que la importación del servicio en el test siga siendo correcta tras el movimiento.

## 3. Backend: Organización de Tests
**Objetivo**: Separar lógica de negocio de pruebas y evitar despliegue de tests.

*   **Paso 3.1**: Crear directorio `functions/tests/unit/core/usecases`.
*   **Paso 3.2**: Mover `functions/src/core/usecases/test_RegisterConversion.spec.ts` a `functions/tests/unit/core/usecases/registerConversion.test.ts` (Renombrando para estándar).
*   **Paso 3.3**: Verificar `functions/tsconfig.json` o scripts de deploy para asegurar que `tests/` está excluido del build.

## 4. Limpieza
**Objetivo**: Eliminar directorios fantasma.

*   **Paso 4.1**: Eliminar la carpeta vacía `src/controllers`.

## 5. Actualización de Documentación
**Objetivo**: Alinear el manual con la realidad (Clean Architecture).

*   **Paso 5.1**: Modificar `Documentos/MANUALDEARQUITECTURA.md`.
    *   Cambiar la sección "Estructura Típica Recomendada".
    *   Especificar que el **Backend** usa Clean Architecture (`core`, `interface`, `infrastructure`).
    *   Especificar que el **Frontend** usa Capas Clásicas (`services`, `components`, `hooks`).

## Ejecución
Solicito aprobación para ejecutar estos 5 pasos de forma secuencial.
