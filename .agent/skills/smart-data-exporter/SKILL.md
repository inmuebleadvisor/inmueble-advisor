---
name: smart-data-exporter
description: "Exporta datos de negocio o logs a archivos locales. Ejecuta validación de rutas y verificación de existencia antes de escribir. Usa scripts Python para evitar alucinaciones."
---

# Skill: Smart Data Exporter (Level 5 - Security Focused)

> [!CAUTION]
> **INTEGRIDAD DE DATOS:** Esta skill tiene prohibido realizar cualquier tipo de auto-corrección o suposición en caso de error. Si un script falla, el agente debe detenerse.

## 🛡️ Propósito
Permitir la exportación segura de datos de negocio (SQL, CSV, JSON) a rutas locales pre-aprobadas, garantizando que no haya pérdida de información ni alucinaciones en el proceso.

## ⚙️ Reglas de Activación y Seguridad
- **Trigger:** Solicitudes de "exportar", "descargar datos" o "generar reporte local".
- **Validación Obligatoria:** Antes de proceder, verifica que la ruta destino esté en `resources/allowed_paths.json`.

## ⚡ Protocolo de Ejecución

### 1. Validación de Ruta
Consulta `resources/allowed_paths.json` para asegurar que el directorio destino es seguro.

### 2. Ejecución Determinista
Utiliza el script `scripts/export_handler.py`.
```bash
python .agent/skills/smart-data-exporter/scripts/export_handler.py --target <ruta_destino> --source <query_o_fuente>
```

### 3. Protocolo de Escalado (No Auto-fix)
Si el script retorna un código de error (exit code != 0):
1.  **STOP:** No intentes corregir la ruta, los permisos o los datos.
2.  **REPORT:** Copia el error íntegro y preséntalo al usuario.
3.  **WAIT:** Solicita instrucciones explícitas antes de cualquier reintento.

## 🚫 Restricciones Críticas
- **PROHIBIDO** inventar datos de ejemplo si la fuente está vacía.
- **PROHIBIDO** sobrescribir archivos sin el flag `--force` (el cual debe ser solicitado al usuario).
- **PROHIBIDO** suponer que un directorio existe si la validación falla.

## 📚 Ejemplos de Referencia
- Ver `examples/export_usage.json` para el flujo correcto y manejo de fallos informativos.
