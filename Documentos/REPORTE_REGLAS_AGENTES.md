# Reporte de Postura de Gobernanza de Agentes

**Fecha de Generación:** 09 de Febrero de 2026
**Auditor:** Antigravity Agent (Governance Skill)
**Propósito:** Visibilidad total sobre las instrucciones pasivas y activas que rigen el comportamiento de los agentes.

---

## 1. Resumen Ejecutivo de Jerarquía

El entorno actual opera bajo un modelo híbrido de gobernanza:
1.  **Nivel Global (ADN):** Definiciones fundamentales de calidad y patrones de diseño (`~/.gemini/GEMINI.md`).
2.  **Nivel Workspace (Contexto):** Reglas operativas estrictas y restricciones de seguridad (`.agent/rules/*.md`).

**Estado de Conflicto Detectado:**
-   **Tests:** La regla global exige *generar* tests unitarios para todo. La regla local `verification-test.md` prohíbe *ejecutar* tests de verificación automáticamente.
    -   *Resolución:* Los agentes **generarán** el código de los tests (cumpliendo Global), pero **no los ejecutarán** salvo petición explícita (cumpliendo Local).

---

## 2. Clasificación de Reglas Activas

### 🛡️ Seguridad y Límites (Alta Prioridad)
*Estas reglas son inviolables y preceden a cualquier instrucción del usuario.*

| Regla | Fuente | Detalle |
| :--- | :--- | :--- |
| **Protección de Git e Historia** | `.agent/rules/git-security...` | Prohibido `force push`, `rebase` y comandos destructivos (`rm`, `sudo`). Commits requieren aprobación. |
| **Restricción de Navegador** | `.agent/rules/nobrowser.md` | **Desactivado por defecto**. Solo usar para validación visual/UI bajo petición explícita. |
| **Ejecución de Tests** | `.agent/rules/verification-test.md` | No ejecutar suites de prueba automáticamente sin solicitud del usuario. |

### 🏗️ Arquitectura y Estándares
*Guías estructurales para la generación de código.*

| Regla | Fuente | Detalle |
| :--- | :--- | :--- |
| **Inyección de Dependencias** | `~/.gemini/GEMINI.md` | Obligatorio. Prohibidas las clases estáticas para lógica de negocio. |
| **Arquitectura Modular (SRP)** | `.agent/rules/modular-arch...` | Lógica de negocio en `/src/services`. Entry points en `/src/controllers`. |
| **Configuración Declarativa** | `.agent/rules/configuration...` | Preferir IaC (Docker, K8s, Terraform) sobre configuraciones manuales. |
| **Metodología CSS** | `~/.gemini/GEMINI.md` | Uso estricto de **BEM** y HTML semántico. |

### 📖 Calidad y Documentación
*Requerimientos para la entregabilidad del código.*

| Regla | Fuente | Detalle |
| :--- | :--- | :--- |
| **Documentación Viva** | `.agent/rules/actualizar-readme.md` | **Trigger Activo**. Actualizar `README.md` al modificar lógica. Alertar si falta doc. |
| **Estándares de Doc** | `.agent/rules/documentation...` | Docstrings obligatorios en cada función/clase nuevos. Estilo PEP8/ESLint. |
| **Cobertura de Tests** | `~/.gemini/GEMINI.md` | Generar unit test para *cada* archivo y método. Naming: `test_prefix`. |

---

## 3. Análisis de Fuentes

### Nivel 1: Global (`~/.gemini/GEMINI.md`)
*Estado: Activo*
Define el "estándar de ingeniería" básico: BEM, DI, Unit Tests. Es agnóstico al proyecto pero establece el nivel de calidad esperado.

### Nivel 2: Workspace (`.agent/rules/`)
*Estado: Activo (7 reglas encontradas)*
Define la "operativa segura" del proyecto Inmueble Advisor. Enfocado en prevenir daños (Git, Browser) y mantener la estructura (Hexagonal/Modular).

### Nivel 3: Legacy (`.cursorrules`)
*Estado: No encontrado*
El proyecto está limpio de configuraciones heredadas de Cursor.

---

## 4. Recomendaciones del Auditor

1.  **Consolidación de Testing:** Clarificar la regla `verification-test.md` para distinguir explícitamente entre "Generación de Tests" (Permitido/Obligatorio) y "Ejecución de CI/CD local" (Restringido).
2.  **Refuerzo de Documentación:** La regla de `actualizar-readme.md` es potente pero reactiva. Se sugiere elevarla a proactiva en futuras iteraciones de skills.
