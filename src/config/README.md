# Configuración del Sistema (Frontend)

Este directorio contiene las constantes y configuraciones globales de la aplicación React.

## Archivos Clave
- `constants.js`: Definición de estados, reglas financieras y configuraciones de servicios externos.
- `posthog.js`: Configuración del rastreo de telemetría.
- `theme.config.js`: Tokens de diseño y variables de estilo.

## Meta Ads (CAPI & Pixel)
La configuración de Meta se encuentra en `constants.js` bajo el objeto `META_CONFIG`.

### IMPORTANT - Eliminación para Producción
El `TEST_EVENT_CODE` está actualmente definido en archivos de constantes. Para el despliegue final en producción, DEBES limpiar este valor (dejarlo como una cadena vacía o eliminar la clave) tanto en `src/config/constants.js` como en `functions/src/core/constants/meta.ts` para evitar que los eventos se envíen a la herramienta "Test Events" en lugar del conjunto de datos real.
