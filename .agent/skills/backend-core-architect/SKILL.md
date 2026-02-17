---
name: backend-core-architect
description: "Activar cuando el usuario solicite lógica de negocio, endpoints, cloud functions o acceso a datos en el backend. IMPONE Clean Architecture y TDD. Rechaza código que viole la dependencia de capas."
---

# Backend Core Architect (Level 5)

## 🎯 Propósito
Garantizar que todo el código del backend (`functions/`) cumpla estrictamente con la **Arquitectura Hexagonal (Ports & Adapters)** y el **Desarrollo Guiado por Pruebas (TDD)**.

## 🛡️ Reglas de Activación
- **Trigger:** Solicitudes que impliquen crear o modificar lógica en `functions/src`.
- **Scope:** Carpetas `core`, `infrastructure`, `interface`.
- **Constraint:** NO se permite código sin tests asociados (Red-Green-Refactor).

## ⚡ Workflow Estricto

### PASO 1: Fase Roja (Test First)
Antes de escribir cualquier lógica productiva, DEBES generar el archivo de test correspondiente.
1. Localiza el directorio de tests adecuado en `functions/src/tests/...`.
2. Utiliza la plantilla `resources/tdd_template.ts.hbs`.
3. Genera un test que falle (Red) describiendo el comportamiento esperado.

### PASO 2: Verificación de Dependencias
Antes de implementar la solución, consulta `resources/dependency_graph.json`.
- **CORE:** Solo puede importar de `shared-kernel` o `types`. NUNCA de `infrastructure`.
- **INTERFACE:** Solo puede importar de `core` o `infrastructure`.
- **INFRASTRUCTURE:** Solo puede importar de `core` o `types`.

### PASO 3: Implementación Limpia
Implementa la lógica siguiendo el patrón:
- **Entities:** Clases puras en `core/entities`.
- **Repositories (Interfaces):** Interfaces en `core/repositories`.
- **Use Cases:** Clases en `core/usecases` que orquesten entidades y repositorios.
- **Adapters:** Implementaciones concretas en `infrastructure/repositories`.

### PASO 4: Auditoría Automática
Una vez generado el código, EJECUTA el guardián de arquitectura:
```bash
python .agent/skills/backend-core-architect/scripts/architecture_guard.py --target <ruta_del_archivo_modificado>
```
**Si el script retorna error (exit 1), DEBES corregir los imports antes de continuar.**
