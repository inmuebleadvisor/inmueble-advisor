const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

// Inicialización de la App (Idempotente en entorno global de Cloud Functions)
initializeApp();

const db = getFirestore();
const storage = getStorage();

module.exports = {
    db,
    storage,
    FieldValue,
    Timestamp
};
