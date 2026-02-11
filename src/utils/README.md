# 🛠️ Utilities (Utils)

Funciones auxiliares puras y helpers para la aplicación.

## Archivos

*   **`formatters.js`**: Formateo de moneda, millones (`formatoMillones`), fechas (`formatDate`, `getTiempoTranscurrido`) y normalización de textos.
*   **`dataHelpers.js`**: Transformación de estructuras de datos (ej. mapeo de respuestas API).
*   **`amenityIconMapper.jsx`**: Mapeo inteligente de nombres de amenidades a iconos visuales (SVG) basado en palabras clave.
*   **`exportUtils.js`**: Lógica para exportación de reportes (CSV/Excel).

## Regla de Oro
Las funciones aquí deben ser **Puras** (misma entrada = misma salida) y no depender del estado de React ni de Contextos.
