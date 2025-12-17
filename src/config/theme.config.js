/**
 * @fileoverview Configuración Clasica y Estacional de la Aplicación.
 * Este archivo actúa como la "Fuente de Verdad" para logotipos, decoraciones y reglas de fechas.
 * 
 * GUÍA RÁPIDA:
 * 1. Para agregar una temporada: Copia el bloque dentro de 'seasons' y cambia ID, fechas y URLs.
 * 2. Para cambiar imágenes: Reemplaza las URLs en la sección 'assets'.
 */

export const THEME_CONFIG = {
    themes: {
        light: 'light',
        dark: 'dark'
    },
    defaultTheme: 'dark', // Tema por defecto (Premium Dark)
    storageKeys: {
        theme: 'theme',
        seasonalEnabled: 'seasonalEnabled'
    }
};

export const SEASONAL_CONFIG = {
    /**
     * LISTA DE TEMPORADAS
     * El sistema revisará esta lista de arriba a abajo.
     * La primera temporada cuyas fechas coincidan con hoy será la activa.
     */
    seasons: [
        {
            // ID Único para uso interno (no usar espacios)
            id: 'christmas',

            // Nombre visible para el Administrador
            name: 'Navidad',

            // RANGO DE FECHAS (Formato: Mes-Día 'MM-DD')
            // El sistema maneja automáticamente el cambio de año (ej: Dic a Ene)
            dateRange: {
                start: '12-01', // 1 de Diciembre
                end: '01-15'    // 15 de Enero
            },

            // ASSETS: Imágenes y Estilos específicos para esta temporada
            assets: {
                // Logo que se ve cuando el fondo es CLARO (usar logo oscuro/color)
                logoLight: "https://firebasestorage.googleapis.com/v0/b/inmueble-advisor-app.firebasestorage.app/o/Institucional%2Ftematico%2FLogo%20Navide%C3%B1o%20Modo%20Claro.png?alt=media",

                // Logo que se ve cuando el fondo es OSCURO (usar logo blanco/claro)
                logoDark: "https://firebasestorage.googleapis.com/v0/b/inmueble-advisor-app.firebasestorage.app/o/Institucional%2Ftematico%2FLogo%20Inmueble%20Advisor%20Navide%C3%B1o.png?alt=media",

                // Imagen decorativa que aparece sobre el pie de página
                footerDecoration: "https://firebasestorage.googleapis.com/v0/b/inmueble-advisor-app.firebasestorage.app/o/Institucional%2Ftematico%2Fpie%20de%20nieve%20con%20monito%20de%20nieve.png?alt=media",

                // Efecto de fondo. Opciones: 'snow' (nieve) o null (sin efecto)
                backgroundEffect: 'snow'
            }
        },

        // --- EJEMPLO: CÓMO AGREGAR HALLOWEEN ---
        /*
        {
            id: 'halloween',
            name: 'Halloween',
            dateRange: {
                start: '10-01',
                end: '11-02'
            },
            assets: {
                logoDark: "URL_LOGO_HALLOWEEN_BLANCO",
                logoLight: "URL_LOGO_HALLOWEEN_COLOR",
                footerDecoration: "URL_CALABAZAS_FOOTER",
                backgroundEffect: null // Sin efecto lluvia/nieve
            }
        },
        */
    ],

    /**
     * ASSETS POR DEFECTO
     * Estos se usan cuando NO hay ninguna temporada activa (el resto del año).
     */
    defaultAssets: {
        logoDark: "https://firebasestorage.googleapis.com/v0/b/inmueble-advisor-app.firebasestorage.app/o/Institucional%2FLogo%20blanco%20con%20amarillo.png?alt=media",
        logoLight: "https://firebasestorage.googleapis.com/v0/b/inmueble-advisor-app.firebasestorage.app/o/Institucional%2FLogo%20InmuebleAdvisor%20en%20fondo%20Azul.png?alt=media",
        footerDecoration: null, // Sin decoración en el pie de página
        backgroundEffect: null  // Sin efectos de fondo
    }
};
