/**
 * ============================================================================
 * ARCHIVO: constants.js (Config)
 * ----------------------------------------------------------------------------
 * RESUMEN:
 * Centraliza strings mágicos y valores de configuración inmutables.
 * Sirve para evitar errores de dedo (typos) al escribir estados como 'NEW' o 'WON'.
 * 
 * EXPLICACIÓN DIDÁCTICA:
 * En lugar de escribir "PENDING_ASSIGNMENT" en 20 archivos distintos y arriesgarnos
 * a escribirlo mal en uno, lo definimos aquí UNA vez. Si queremos cambiar el nombre
 * del estado, solo tocamos este archivo.
 * 
 * ÚLTIMA MODIFICACIÓN: 11/12/2025
 * ============================================================================
 */
// Sincronizado con src/config/constants.js

const STATUS = {
    // Desarrollo
    DEV_IMMEDIATE: 'IMMEDIATE',
    DEV_PREALE: 'PREALE',
    DEV_PREVENTA_STRING: 'Pre-Venta',
    DEV_INMEDIATA_STRING: 'Entrega Inmediata',

    // Leads (Embudo)
    LEAD_NEW: 'NEW',
    LEAD_CONTACTED: 'CONTACTED',
    LEAD_VISIT_SCHEDULED: 'VISIT_SCHEDULED',
    LEAD_VISIT_CONFIRMED: 'VISIT_CONFIRMED',
    LEAD_VISITED: 'VISITED',
    LEAD_RESERVED: 'RESERVED',
    LEAD_WON: 'WON',
    LEAD_LOST: 'LOST',
    LEAD_CLOSED: 'CLOSED',
    LEAD_PENDING_ADMIN: 'PENDING_ADMIN',
    LEAD_PENDING_ASSIGNMENT: 'PENDING_ASSIGNMENT'
};

module.exports = { STATUS };
