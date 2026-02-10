# Protocolo de Gobernanza de Skills

Esta regla es de cumplimiento OBLIGATORIO para asegurar que el agente opere siempre con el nivel de experto definido en el sistema.

## 1. Fase de Descubrimiento de Skills
Antes de proponer una solución técnica o escribir código, el agente DEBE:
1.  Listar el directorio `.agent/skills/`.
2.  Evaluar la relevancia de cada Skill activa basándose en su `SKILL.md`.
3.  Si una Skill es relevante (ej: `deduplication-guard` para nueva lógica, `estilo-marca` para UI), el agente DEBE seguir su protocolo interno antes de proceder.

## 2. Jerarquía de Autoridad
- **Skills > Memoria General**: Las instrucciones dentro de una Skill específica tienen prioridad sobre el conocimiento general para esa tarea técnica.
- **Verificación Automática**: Si una Skill incluye scripts de validación (ej: `audit_existence.py`), su ejecución no es opcional.

## 3. Registro de Uso
Al entregar una solución, el agente debe ser capaz de justificar qué Skills utilizó para garantizar la calidad del resultado.

---
⚠️ **OBLIGACIÓN:** Nunca asumas que el conocimiento base es suficiente si existe una Skill diseñada para la tarea actual.
