// src/config/constants.js

// --- IMÁGENES Y ASSETS ---
export const IMAGES = {
  FALLBACK_PROPERTY: "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png",
  LOGO_URL: "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png"
};

// --- REGLAS FINANCIERAS (Para Calculadora) ---
export const FINANZAS = {
  PORCENTAJE_GASTOS_NOTARIALES: 0.06, // 6%
  PORCENTAJE_ENGANCHE_MINIMO: 0.10,   // 10%
  FACTOR_MENSUALIDAD_POR_MILLON: 11000, // Por cada millón de crédito, pagas aprox esto
  PRECIO_MAXIMO_DEFAULT: 100000000 // 100 Millones (Tope filtros)
};

// --- OPCIONES DE UI ---
export const UI_OPCIONES = {
  FILTRO_PRECIO_MAX: 10000000,
  FILTRO_PRECIO_STEP: 100000,
  FILTRO_RECAMARAS_MAX: 4
};