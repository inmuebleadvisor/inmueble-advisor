# Plan de Ejecución: Auditoría de Arquitectura

Este documento detalla el plan de acción para auditar el cumplimiento del proyecto `inmueble-advisor` con respecto al `Documentos/MANUALDEARQUITECTURA.md` y las reglas globales del proyecto.

## Objetivos de la Auditoría
1. **Verificar Alineación Estructural**: Confirmar que los microservicios y el frontend sigan la estructura de carpetas definida.
2. **Validar Patrones de Diseño**: Asegurar el uso de Inyección de Dependencias (DI), Principio de Responsabilidad Única (SRP) y persistencia políglota.
3. **Control de Calidad (Testing & Docs)**: Verificar cobertura de pruebas y presencia de documentación/ADRs.
4. **Infraestructura**: Validar la configuración declarativa (IaC) y Serverless.

---

## Fases de Ejecución

### Fase 1: Auditoría Estructural y de Nomenclatura
**Objetivo**: Validar la organización física del código.

1. **Escaneo de Directorios**:
   - Analizar `src/` (Frontend) y `functions/src/` (Backend).
   - **Criterio de Éxito**: Existencia de carpetas `models`, `repositories`, `services`, `controllers`.
   - **Punto Crítico**: Detectar desviaciones (ej. `core`, `infrastructure` en backend vs `services` en manual) y documentarlas como discrepancias a resolver o validar.

2. **Nomenclatura**:
   - Verificar convención de nombres de archivos.
   - Verificar si los tests siguen el patrón `[nombre].test.js/ts`.

### Fase 2: Auditoría de Patrones de Código (Análisis Estático)
**Objetivo**: Validar la lógica interna y adherencia a reglas.

1. **Inyección de Dependencias (DI)**:
   - **Acción**: Buscar instanciación directa de clases (`new Service()`) dentro de otros servicios o controladores.
   - **Regla**: Todo servicio debe recibir sus dependencias vía constructor.

2. **Desacoplamiento de Capas**:
   - Verificar que los `Controllers` SOLO manejen Request/Response.
   - Verificar que los `Services` contengan la lógica de negocio.
   - Verificar que los `Repositories` sean los únicos con acceso a DB/Firestore.
   - **Check**: Buscar imports de `firebase-admin` o SQL drivers en `controllers` o `services` (Violación de Repository Pattern).

3. **Frontend BEM & Semántica**:
   - Analizar archivos CSS/SCSS para verificar metodología BEM.
   - Analizar JSX para verificar uso de HTML semántico (`<header>`, `<main>`, `<article>` vs `<div>`).

### Fase 3: Auditoría de Persistencia y Datos
**Objetivo**: Validar el manejo de datos y aislamiento.

1. **Aislamiento de Servicios**:
   - Verificar si algún servicio accede directamente a colecciones/tablas que conceptualmente pertenecen a otro dominio.

2. **Persistencia Políglota**:
   - Identificar qué tecnologías de persistencia se usan y si están justificadas (Firestore para NoSQL, Storage para archivos, etc.).

### Fase 4: Auditoría de Testing y Documentación
**Objetivo**: Asegurar la mantenibilidad y confiabilidad.

1. **Cobertura de Pruebas**:
   - Ejecutar suite de pruebas actual (`npm test`).
   - Verificar existencia de archivo de prueba *por cada* archivo de lógica de negocio.

2. **Documentación**:
   - Verificar existencia de `README.md` en cada módulo principal.
   - Verificar existencia de carpeta `Documentos/decisions` o similar para ADRs.
   - Validar definiciones de API (Swagger/OpenAPI si aplica).

### Fase 5: Infraestructura (IaC)
**Objetivo**: Validar despliegue y seguridad.

1. **Firebase Config**:
   - Auditar `firebase.json`.
   - Verificar que no haya secretos (API Keys, Credenciales) hardcodeados en el código. Deben estar en variables de entorno.

## Entregables
1. **Reporte de Discrepancias**: Lista de violaciones encontradas clasificadas por severidad (Crítica, Alta, Media, Baja).
2. **Plan de Remediación**: Pasos específicos para corregir las violaciones (ej. "Refactorizar `UserService` para usar DI", "Renombrar carpetas en `functions`").
3. **Actualización de Manuales**: Si la arquitectura actual es superior al manual, proponer actualización del `MANUALDEARQUITECTURA.md`.

---

## Comandos Sugeridos para el Auditor (Agente)
- `find . -type d -name "services"` (Verificar estructura)
- `grep -r "new " src/services` (Detectar falta de DI)
- `grep -r "firebase" src/controllers` (Detectar acoplamiento indebido)
- `npm run test -- --coverage` (Verificar cobertura)
