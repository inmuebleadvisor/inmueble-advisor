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
    logoDark: "https://firebasestorage.googleapis.com/v0/b/inmueble-advisor-app.firebasestorage.app/o/Institucional%2FLogo%20blanco%20con%20amarillo.png?alt=media",
    footerDecoration: null,
    backgroundEffect: null
};
