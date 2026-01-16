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

export const THEME_ASSETS = {
    logoDark: "https://firebasestorage.googleapis.com/v0/b/inmueble-advisor-app.firebasestorage.app/o/Institucional%2FLogo%20blanco%20con%20amarillo.png?alt=media",
    logoLight: "https://firebasestorage.googleapis.com/v0/b/inmueble-advisor-app.firebasestorage.app/o/Institucional%2FLogo%20InmuebleAdvisor%20en%20fondo%20Azul.png?alt=media",
    footerDecoration: null,
    backgroundEffect: null
};
