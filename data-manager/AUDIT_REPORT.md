# Auditoría Técnica: `data-manager`

**Fecha:** 30 de Diciembre, 2025
**Auditor:** Agente Antigravity (Google Deepmind)
**Estado:** ⚠️ Requiere Refactorización
**Referencia:** MANUALDEARQUITECTURA.md, CODIGOCLOUD.docx

## 1. Resumen Ejecutivo
El módulo `data-manager` opera como una herramienta CLI funcional para la importación y normalización de datos hacia Firestore. Sin embargo, presenta deuda técnica relacionada con la duplicidad de lógica (DRY), manejo "artesanal" de zonas horarias (Vibe Coding) y discrepancias menores entre los adaptadores y los esquemas Zod definidos.

## 2. Hallazgos Técnicos

### 2.1 Seguridad y Validación (Schemas & Zod)
*   **Estado:** Aceptable, pero perfectible.
*   **Hallazgo:** Se utiliza `z.preprocess` extensivamente para coerción de tipos desde CSV. Esto es adecuado, pero los esquemas no son estrictos (`.strict()`), lo que permite que campos no definidos en el esquema (como `precios.moneda` en `Desarrollo`) sean ignorados silenciosamente o pasados inadvertidamente según la versión de Zod.
*   **Riesgo:** Pérdida de datos silenciosa o polución de la base de datos con campos "huesped".
*   **Archivos Afectados:** `lib/schemas.js`, `lib/adapters.js`.

### 2.2 Limpieza de Obsoletos (Cloud Functions & Legacy)
*   **Estado:** En transición.
*   **Hallazgo:** La lógica de cálculo (stats, highlights) se ha centralizado localmente en `lib/calculations.js`, sustituyendo a las Cloud Functions. No se detectaron llamadas HTTP externas a funciones legacy, lo cual es positivo.
*   **Hallazgo:** Existen comentarios de incertidumbre sobre campos legacy en `lib/adapters.js` (e.g., `// Legacy or deprecated flat fields removed or kept for backward compat?`).
*   **Acción:** Eliminar código muerto y comentarios especulativos.

### 2.3 Optimización DRY (Don't Repeat Yourself)
*   **Estado:** 🔴 Crítico.
*   **Hallazgo:** Funciones de utilidad como `cleanStr`, `parsePipes`, `generateId` y limpiezas de strings están duplicadas o implementadas ad-hoc en `lib/adapters.js` y `lib/schemas.js`.
*   **Hallazgo:** Lógica compleja y frágil en `lib/timezones.js` para "adivinar" el offset UTC iterativamente. Esto es "Vibe Coding" y debe reemplazarse por una biblioteca robusta (`date-fns-tz` o `luxon`).
*   **Acción:** Extraer utilidades a `lib/shared/utils-data.js` y normalizar el uso de bibliotecas de fecha.

### 2.4 Código Incompleto / "Vibe Coding"
*   **Hallazgo:** `lib/timezones.js` contiene lógica iterativa de convergencia para parsear fechas, descrita en comentarios como "SIMPLIFCATION FOR THIS TASK". Esto es inestable ante cambios de reglas DST.
*   **Hallazgo:** `lib/adapters.js` contiene lógica de "fallback" para IDs y slugs que podría no ser determinista si faltan datos clave.

## 3. Plan de Refactorización (Task List)

Este plan alinea el proyecto con los estándares de Modularidad y Calidad del MANUALDEARQUITECTURA.

- [ ] **1. Consolidación de Utilidades (Shared Lib)**
    - Crear `lib/shared/normalization.js` para `cleanStr`, `cleanEmail`, `generateId`.
    - Crear `lib/shared/transformers.js` para `parsePipes`, `parseHitos`.
    - Mover validaiones comunes de Zod a `lib/shared/zod-utils.js`.

- [ ] **2. Estandarización de Fechas**
    - Instalar `luxon` o `date-fns-tz`.
    - Reescribir `lib/timezones.js` para usar IANA Timezones estándar sin algoritmos de adivinanza.

- [ ] **3. Hardening de Esquemas**
    - Aplicar `.strict()` a todos los esquemas en `lib/schemas.js`.
    - Alinear `lib/adapters.js` para que solo emita campos permitidos por los esquemas.
    - Resolver discrepancia de `precios.moneda` en `DesarrolloSchema`.

- [ ] **4. Limpieza de Adaptadores**
    - Refactorizar `adaptDesarrollo`, `adaptModelo`, `adaptDesarrollador` para usar las nuevas utilidades compartidas.
    - Eliminar bloques de código comentado y lógica de "Legacy".

- [ ] **5. Verificación Determinista**
    - Asegurar que `generateId` sea 100% determinista y robusto ante caracteres especiales (normalización NFD).

## 4. Conclusión
El código es funcional pero frágil. Se recomienda proceder con el plan de refactorización antes de escalar masivamente la importación de datos.

Espera de comando `/openspec:apply` para ejecutar.
