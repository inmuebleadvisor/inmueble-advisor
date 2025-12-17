# Manual de Configuración de Temáticas Estacionales

Este documento explica cómo administrar y configurar las temáticas de temporada (Navidad, Halloween, etc.) en **Inmueble Advisor**.

## 📂 Ubicación de la Configuración

Toda la lógica de las temporadas está centralizada en un único archivo de configuración:

> **Ruta:** `src/config/theme.config.js`

Este archivo controla qué temporada está activa basándose en la fecha actual y qué imágenes se deben mostrar.

## 🛠️ Cómo Agregar o Modificar una Temporada

Dentro del archivo `theme.config.js`, encontrarás un objeto llamado `SEASONAL_CONFIG` con una lista `seasons`. Para agregar una nueva temporada, simplemente añade un nuevo objeto a esta lista.

### Estructura de una Temporada

```javascript
{
    id: 'identificador_unico',  // ej: 'verano'
    name: 'Nombre Visible',     // ej: 'Verano 2025'
    
    // Rango de fechas (Mes-Día)
    dateRange: {
        start: '06-20', // 20 de Junio
        end: '08-31'    // 31 de Agosto
    },

    // Imágenes y Efectos
    assets: {
        // Logo para modo oscuro (debe ser blanco/claro)
        logoDark: "URL_DE_TU_IMAGEN",
        
        // Logo para modo claro (debe ser oscuro/color)
        logoLight: "URL_DE_TU_IMAGEN",
        
        // Imagen decorativa que aparece sobre el pie de página
        footerDecoration: "URL_DE_TU_IMAGEN",
        
        // Efecto de fondo (opcional). 
        // Actualmente soportado: 'snow' (nieve) o null (ninguno)
        backgroundEffect: null 
    }
}
```

## 📅 Reglas de Fechas

*   **Formato:** Siempre usa `'MM-DD'` (Mes-Día). Ejemplo: `'12-25'` para 25 de Diciembre.
*   **Año Nuevo:** El sistema maneja automáticamente rangos que cruzan el año nuevo (ej: de Diciembre a Enero).
    *   *Ejemplo:* `start: '12-01'`, `end: '01-15'` funcionará correctamente desde el 1 de dic hasta el 15 de enero.

## 🎨 Gestión de Imágenes (Assets)

Para cambiar las imágenes, simplemente actualiza las URLs dentro del objeto `assets`.
Se recomienda usar URLs de **Firebase Storage** para asegurar que carguen rápido y tengan los permisos correctos.

### Ejemplo: Cambiar el Logo de Navidad

1.  Sube tu nuevo logo a Firebase Storage.
2.  Copia la URL pública (Token de descarga).
3.  Pega la URL en `logoDark` o `logoLight` según corresponda.

## ⚠️ Notas Importantes para el Administrador

1.  **Prioridad:** Si dos temporadas se solapan en fechas, el sistema tomará la **primera** que encuentre en la lista. Asegúrate de que las fechas no entren en conflicto o ordena la lista según prioridad.
2.  **Modo Predeterminado:** Si la fecha actual no coincide con ninguna temporada configurada, el sistema cargará automáticamente los logos predeterminados (Inmueble Advisor estándar) definidos en `defaultAssets`.
3.  **Despliegue:** Cualquier cambio en este archivo requiere un nuevo despliegue (Deploy) de la aplicación para que sea visible para todos los usuarios.
