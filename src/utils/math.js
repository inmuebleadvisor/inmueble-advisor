/**
 * @file math.js
 * @description Utilidades matemáticas de precisión financiera compartidas.
 * Diseñadas para ser la fuente de verdad (DRY) de cálculos de redondeo
 * entre todas las estrategias hipotecarias del sistema.
 */

/**
 * Redondea un número a 2 decimales con precisión bancaria.
 * Usa Number.EPSILON para evitar errores de representación de punto flotante
 * (ej: 1.005 -> 1.01 en lugar de 1.00).
 * 
 * @param {number} num - El número a redondear.
 * @returns {number} El número redondeado a exactamente 2 decimales.
 * 
 * @example
 * round2(1845000 * 0.1015 / 360 * 30.40) // => 15735.83 (no 15735.8299999...)
 */
export const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;
