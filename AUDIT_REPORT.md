# Reporte de Auditoría Técnica - Inmueble Advisor
**Fecha:** 31 de Diciembre, 2025
**Auditor:** Antigravity Agent
**Objetivo:** Alineación con MANUALDEARQUITECTURA.md y purga de "Vibe Coding".

## 1. Resumen Ejecutivo
El código fuente en `src` refleja correctamente la arquitectura "Client-Side Only" (sin Cloud Functions activas). Sin embargo, carece de un sistema de validación robusto (Zod no encontrado) y contiene deuda técnica en forma de comentarios conversacionales ("Vibe Coding") y lógica de negocio acoplada en componentes UI.

## 2. Hallazgos por Categoría

### 🛡️ 1. Seguridad y Validación (CRÍTICO)
*   **Ausencia de Zod**: No se encontraron referencias a la librería `zod`. La validación de datos es manual (condicionales `if`) o inexistente.
    *   *Impacto*: `ExternalAdvisorService.createOrUpdate` acepta cualquier objeto, lo que puede corromper la base de datos Firestore.
    *   *Archivo*: `src/services/externalAdvisor.service.js`, `src/components/LeadCard.jsx`
*   **Validación Manual Dispersa**: 
    *   En `LeadCard.jsx`, se hacen chequeos manuales de nulos (`if (!fecha) ...`).

### 🧹 2. Limpieza de Obsoletos
*   **Estado Cloud Functions**: ✅ **Limpio**. No se encontraron rastros de `asignarLead`, `actualizarMetricasAsesor`, etc.
*   **Código Muerto**: No se detectaron bloques grandes de código comentado, pero sí comentarios conversacionales que deben eliminarse.

### ♻️ 3. Optimización DRY (Don't Repeat Yourself)
*   **Lógica de Fechas Duplicada**:
    *   `LeadCard.jsx` contiene `getTiempoTranscurrido` y `formatDate`. Esta lógica de formateo ("Hace 2h", "Hace 1d") es genérica y debería residir en `src/utils/formatters.js` o una nueva `src/utils/dateUtils.js`.
*   **Normalización de Datos**:
    *   `src/utils/formatters.js` tiene una función `normalizar` básica.
    *   `src/services/externalAdvisor.service.js` discute limpieza de teléfonos en comentarios pero la implementación es ambigua. Debería estandarizarse.

### 🚧 4. Código Incompleto / "Vibe Coding"
Se detectaron comentarios que narran el proceso de pensamiento del desarrollador en lugar de documentar el código ("Vibe Coding"). Esto ensucia la base de código profesional.

*   **`src/services/externalAdvisor.service.js`**:
    *   *Hallazgo*: Comentarios como `"Ojo: En el código original...", "Error mío en lectura anterior?"`.
    *   *Acción*: Eliminar inmediatamente.
*   **`src/components/LeadCard.jsx`**:
    *   *Hallazgo*: `// TODO: Pass real user ID`.
    *   *Hallazgo*: Comentarios excesivos tipo `// PORQUÉ: ...` (Aunque útiles didácticamente, deben ser docstrings profesionales o eliminarse si son obvios).
    *   *Hallazgo*: `// Added simplified mock function if not available...`.

---

## 3. Plan de Refactorización (Task List)

### Fase 1: Saneamiento y Estándares (Prioridad Alta)
- [ ] **Instalar Zod**: `npm install zod`
- [ ] **Limpieza "Vibe Coding"**:
    - [ ] Limpiar comentarios conversacionales en `src/services/externalAdvisor.service.js`.
    - [ ] Limpiar comentarios y TODOs en `src/components/LeadCard.jsx`.

### Fase 2: Abstracción y DRY
- [ ] **Refactorizar Utilidades de Fecha**:
    - [ ] Mover `getTiempoTranscurrido` y `formatDate` de `LeadCard.jsx` a `src/utils/dateUtils.js`.
    - [ ] Actualizar `LeadCard` para importar estas funciones.
- [ ] **Estandarizar Normalización**:
    - [ ] Crear `normalizePhone` en `src/utils/formatters.js`.
    - [ ] Implementarlo en `ExternalAdvisorService`.

### Fase 3: Seguridad (Validación)
- [ ] **Crear Esquemas**:
    - [ ] Crear `src/schemas/advisor.schema.js` (Definir estructura de Asesor).
    - [ ] Crear `src/schemas/lead.schema.js` (Definir estructura de Lead).
- [ ] **Implementar Validación**:
    - [ ] En `ExternalAdvisorService`, validar input con `AdvisorSchema.parse()` antes de guardar.
