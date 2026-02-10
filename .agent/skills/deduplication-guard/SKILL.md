---
name: deduplication-guard
description: CRÍTICO. Activar SIEMPRE que el usuario solicite: crear, generar, scaffold, añadir nueva funcionalidad o servicio. Realiza una auditoría de existencia previa para evitar código duplicado.
risk_level: low
---

# Deduplication Guard Skill

## Propósito
Esta skill actúa como un **Arquitecto de Deduplicación** automatizado. Su objetivo es interceptar cualquier intento de creación de nuevo código para verificar si la funcionalidad ya existe en el codebase (`src/` o `functions/`).

## Reglas de Activación
**DEBE** ejecutarse siempre que el usuario intente:
- Crear nuevos archivos o módulos.
- Generar "scaffolding" para nuevas características.
- Añadir servicios o lógica de negocio.

## Protocolo de Ejecución

### 1. Auditoría Semántica
Antes de escribir una sola línea de código, debes ejecutar el script de auditoría para buscar coincidencias semánticas.

```bash
# Ejecutar desde la raíz del proyecto
python .agent/skills/deduplication-guard/scripts/audit_existence.py --search "termino_clave" --type "class|function|file"
```

El script buscará en:
- `src/` (Frontend)
- `functions/` (Backend)

### 2. Evaluación de Resultados
El script devolverá un JSON. 
- **Si `exists: true`**:
  - **DETENER** la generación de código.
  - Informar al usuario sobre la duplicidad encontrada (ruta y similitud).
  - Proponer la reutilización o refactorización del código existente.
- **Si `exists: false`**:
  - **VALIDADA** la no-existencia.
  - **CEDER EL CONTROL** a otras skills (ej: `estilo-marca` para UI, o lógica estándar) para proceder con la implementación.

## Protocolo de No-Conflicto
Esta skill valida la **ARQUITECTURA**. Una vez que se confirma que no hay duplicados, esta skill ha cumplido su función. 
- No impone estilos de código (eso es rol de `estilo-marca` o linters).
- No dicta la estructura de archivos (eso es rol de la arquitectura hexagonal definida).
- Solo asegura que no reinventemos la rueda.
