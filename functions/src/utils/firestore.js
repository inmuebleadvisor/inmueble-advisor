/**
 * ============================================================================
 * ARCHIVO: firestore.js (Utils)
 * ----------------------------------------------------------------------------
 * RESUMEN:
 * Singleton para inicializar y exportar la instancia de Firebase Admin SDK.
 * Evita inicializar la app múltiples veces en el mismo contenedor.
 * 
 * EXPLICACIÓN DIDÁCTICA:
 * - initializeApp(): Conecta este código con tu proyecto de Firebase usando las
 *   credenciales por defecto de Google Cloud (Service Account).
 * - getFirestore(): Nos da el objeto 'db' para leer/escribir datos.
 * 
 * ÚLTIMA MODIFICACIÓN: 11/12/2025
 * ============================================================================
 */
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

// Inicialización de la App (Idempotente en entorno global de Cloud Functions/Node)
// Si ya está inicializada, no hace nada; si no, la arranca.
initializeApp();

const db = getFirestore();
const storage = getStorage();

module.exports = {
    db,
    storage,
    FieldValue,
    Timestamp
};
