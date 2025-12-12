// functions/index.js
// ÚLTIMA MODIFICACION: 11/12/2025 - Refactorización a Servicios + Optimización

// --- 1. IMPORTACIÓN DE LIBRERÍAS DE TRABAJO ---
const { onDocumentCreated, onDocumentUpdated, onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { db } = require("./src/utils/firestore");

// --- 2. IMPORTACIÓN DE SERVICIOS (Lógica de Negocio) ---
const leadService = require("./src/services/lead.service");
const userService = require("./src/services/user.service");

// NOTA: La inicialización de la App ahora ocurre en src/utils/firestore.js

// ==================================================================
// SECCIÓN A: TRIGGERS AUTOMÁTICOS (CRM Y LEADS)
// ==================================================================

// TRIGGER: Asignar Lead (OPTIMIZADO O(1))
exports.asignarLead = onDocumentCreated("leads/{leadId}", async (event) => {
  return leadService.assignLead(event.data);
});

// TRIGGER: Actualizar Métricas Asesor (INCREMENTAL O(1))
exports.actualizarMetricasAsesor = onDocumentUpdated("leads/{leadId}", async (event) => {
  return userService.updateAdvisorMetrics(event.data);
});

// TRIGGER: Mantener Índice de Inventario (SELF-HEALING)
exports.mantenerIndiceInventario = onDocumentWritten("users/{uid}", async (event) => {
  return userService.maintainInventoryIndex(event);
});

// TRIGGER: Recalcular Score Usuario (ADMIN)
exports.recalcularScoreUsuario = onDocumentUpdated("users/{uid}", async (event) => {
  return userService.recalculateUserScore(event.data);
});

// ==================================================================
// SECCIÓN B: UTILERÍAS Y MIGRACIÓN
// ==================================================================

// HTTP: Migrar Usuarios (Para crear indices iniciales)
exports.migrarIndicesUsuarios = onRequest(async (req, res) => {
  try {
    const usersSnap = await db.collection("users").get();
    let count = 0;
    const batch = db.batch();

    // Simplemente "tocamos" el documento con un campo dummy o forzamos la actualización
    // En realidad, para activar onDocumentWritten, necesitamos escribir.
    // Vamos a escribir lastMigration: timestamp

    usersSnap.docs.forEach((doc) => {
      batch.update(doc.ref, { lastMigrationTrigger: new Date() });
      count++;
    });

    await batch.commit();
    res.json({ message: `Migración iniciada para ${count} usuarios. El Trigger mantendrá el índice.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});



