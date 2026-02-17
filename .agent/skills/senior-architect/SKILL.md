---
name: senior-architect
description: Ejecuta una auditoría profunda de calidad y arquitectura sobre un directorio o archivo. Verifica el cumplimiento de Clean Architecture, la existencia de Tests (TDD) y detecta deuda técnica (archivos gigantes, complejidad ciclomática).
---

# Senior Architect Skill

## 🛡️ Propósito
Esta skill actúa como un guardián de calidad y consistencia arquitectónica. Su objetivo es asegurar que el código no solo funcione, sino que sea mantenible, escalable y respete los límites de la arquitectura (Hexagonal/Clean) y las prácticas de TDD.

## ⚙️ Triggers (Cuándo usar)
- **SIEMPRE** antes de dar por terminada una refactorización mayor.
- **SIEMPRE** antes de finalizar una tarea de creación de una nueva feature.
- Cuando el usuario solicite una "auditoría" o "revisión de código".
- Cuando detectes "code smells" y quieras validar hipótesis sobre la salud del código.

## 🤖 Instrucciones Ejecutables

### 1. Preparación
Antes de ejecutar el análisis, identifica el objetivo (`TARGET`). Puede ser un archivo específico o un directorio completo.
- Si el usuario no especifica, asume el directorio de trabajo actual o los archivos modificados recientemente.

### 2. Ejecución del Auditor
Ejecuta el script de auditoría ubicado en `scripts/code_auditor.py`.
Debes pasar el argumento `--target` con la ruta absoluta o relativa del código a analizar.

```bash
# Ejemplo de uso
python .agent/skills/senior-architect/scripts/code_auditor.py --target src/modules/users
```

### 3. Interpretación de Resultados
El script devolverá un reporte en formato JSON o Markdown.

- **Si el resultado es "PASSED" (Exitoso):**
  - Puedes proceder con la tarea original o confirmar la calidad al usuario.

- **Si el resultado es "FAILED" (Fallido) o tiene "WARNINGS":**
  - **STOP.** No des por terminada la tarea.
  - Analiza los errores reportados (ej. violación de capas, falta de tests).
  - **DEBES** proponer un plan de corrección inmediato al usuario.
  - Cita explícitamente las violaciones encontradas (ej. *"El archivo X importa infraestructura en el dominio"*).

## 📏 Reglas de Arquitectura (Referencia)
Las reglas que valida este skill están definidas en `resources/architecture_rules.json`.
Principios clave:
1.  **Independencia del Dominio:** El código en capas de dominio/entidades NO debe importar librerías de infraestructura, frameworks web (React, Express) ni bases de datos.
2.  **TDD Obligatorio:** Todo archivo de lógica de negocio (Servicios, Casos de Uso) debe tener un archivo de test asociado (`.test.ts`, `.spec.js`, etc.).
3.  **Complejidad Controlada:** Archivos de más de 300 líneas o funciones con indentación excesiva (>5) son deuda técnica.
