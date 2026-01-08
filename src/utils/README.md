# 🛠️ Utilities (Utils)

Funciones auxiliares puras y helpers para la aplicación.

## Archivos

*   **`formatters.js`**: Formateo de moneda, fechas (`formatDate`, `getTiempoTranscurrido`) y textos.
*   **`dataHelpers.js`**: Transformación de estructuras de datos (ej. mapeo de respuestas API).
*   **`exportUtils.js`**: Lógica para exportación de reportes (CSV/Excel).

## Regla de Oro
Las funciones aquí deben ser **Puras** (misma entrada = misma salida) y no depender del estado de React ni de Contextos.
