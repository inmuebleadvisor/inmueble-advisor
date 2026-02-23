/**
 * @fileoverview Configuración de Tema y Assets de la Aplicación.
 * Dark Premium es el único tema. No hay soporte para modo claro.
 *
 * GUÍA RÁPIDA:
 * 1. Para agregar una temporada: usa las claves en 'storageKeys' para persistencia.
 * 2. Para cambiar imágenes: reemplaza las URLs en la sección 'THEME_ASSETS'.
 */

export const THEME_CONFIG = {
    storageKeys: {
        seasonalEnabled: 'seasonalEnabled'
    }
};

export const THEME_ASSETS = {
    logoDark: "https://firebasestorage.googleapis.com/v0/b/inmueble-advisor-app.firebasestorage.app/o/Institucional%2FLogo%20Inmueble%20Advisor%20PNG.png?alt=media&token=d123edd6-31b1-4087-bcb3-afddb58b4d0f",
    footerDecoration: null,
    backgroundEffect: null
};
