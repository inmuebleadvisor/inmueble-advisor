# Documentación Funcional: Lógica de Cloud Functions (Backend) - DESACTIVADO

> [!WARNING]
> **ESTADO ACTUAL: INACTIVO / DESHABILITADO**
> No existe código ejecutable en el backend (Cloud Functions). Toda la lógica previa ha sido eliminada para garantizar que **no se ejecute ningún proceso automático en la nube**.

Este documento queda como referencia histórica de que la lógica de negocio del lado del servidor ha sido purgada.

---

## 1. Arquitectura Actual

El proyecto opera bajo un modelo **Client-Side Only** (o gestión manual).

*   **Cloud Functions**: El directorio `functions/` ha sido limpiado. No hay triggers (`onDocumentCreated`, etc.) activos.
*   **Credenciales**: Se mantienen únicamente las configuraciones de conexión en el Frontend (`src/firebase/config.js`) para permitir lectura/escritura autorizada a Firestore/Storage en el futuro, pero sin lógica de backend asociada.

## 2. Procesos Eliminados

Las siguientes funciones, anteriormente documentadas, **YA NO EXISTEN**:

*   ❌ `asignarLead` (Asignación automática de asesores)
*   ❌ `actualizarMetricasAsesor`
*   ❌ `mantenerIndiceInventario`
*   ❌ `recalcularScoreUsuario`

## 3. Manejo de Leads (Estado Actual)

La creación de leads es gestionada puramente por el **Frontend** con un estado inicial fijo (ej. `PENDING_DEVELOPER_CONTACT`), sin intervención posterior de scripts en la nube.

> **Nota Técnica**: El backend contiene archivos vacíos o placeholders para mantener la estructura del proyecto sin ejecutar código.
