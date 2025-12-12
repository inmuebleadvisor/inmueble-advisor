// functions/index.js
// ÚLTIMA MODIFICACION: 11/12/2025

// --- 1. IMPORTACIÓN DE LIBRERÍAS ---
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

// --- 2. INICIALIZACIÓN DE LA APP ---
initializeApp();
const db = getFirestore();
const storage = getStorage();

// --- 3. IMPORTS LOCALES ---


// --- 4. CONSTANTES ---
const STATUS = {
  LEAD_NEW: 'NEW',
  LEAD_WON: 'WON',
  LEAD_LOST: 'LOST',
  LEAD_PENDING_ADMIN: 'PENDING_ADMIN'
};

// ==================================================================
// SECCIÓN A: TRIGGERS AUTOMÁTICOS (CRM Y LEADS)
// ==================================================================

// TRIGGER: Asignar Lead
exports.asignarLead = onDocumentCreated("leads/{leadId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const leadId = snapshot.id;
  const leadData = snapshot.data();

  if (leadData.asesorUid) return;

  try {
    const asesoresRef = db.collection("users");
    const snapshotAsesores = await asesoresRef.where("role", "==", "asesor").get();
    let candidatos = [];

    snapshotAsesores.forEach((doc) => {
      const asesor = { uid: doc.id, ...doc.data() };
      const tieneDesarrollo = asesor.inventario?.find(item =>
        String(item.idDesarrollo) === String(leadData.desarrolloId) && item.activo === true
      );
      if (tieneDesarrollo) candidatos.push(asesor);
    });

    if (candidatos.length === 0) {
      await snapshot.ref.update({
        status: STATUS.LEAD_PENDING_ADMIN,
        motivoAsignacion: 'Sin cobertura',
        historial: FieldValue.arrayUnion({
          accion: 'error_asignacion',
          fecha: Timestamp.now(),
          detalle: 'Sin asesores disponibles.'
        })
      });
      return;
    }

    let asesorGanador = candidatos[0];

    await snapshot.ref.update({
      asesorUid: asesorGanador.uid,
      asesorNombre: asesorGanador.nombre,
      status: STATUS.LEAD_NEW,
      fechaAsignacion: FieldValue.serverTimestamp(),
      historial: FieldValue.arrayUnion({
        accion: 'asignacion_automatica',
        fecha: Timestamp.now(),
        detalle: `Asignado a ${asesorGanador.nombre}`
      })
    });
  } catch (error) {
    console.error("Error en asignación:", error);
  }
});

// TRIGGER: Actualizar Métricas Asesor (Cuando cambian los leads)
exports.actualizarMetricasAsesor = onDocumentUpdated("leads/{leadId}", async (event) => {
  const antes = event.data.before.data();
  const despues = event.data.after.data();

  // Solo procesar si cambia el status para evitar loops o calculos innecesarios
  if (antes.status === despues.status) return;

  const asesorUid = despues.asesorUid;
  if (!asesorUid) return;

  try {
    const asesorRef = db.collection("users").doc(asesorUid);
    // Transacción para leer métricas actuales (puntos manuales) y leads atómicamente
    await db.runTransaction(async (t) => {
      const docAsesor = await t.get(asesorRef);
      const userData = docAsesor.data();
      const metricas = userData.metricas || {};

      // Obtener leads para calcular tasa de cierre
      // Nota: En transacciones no se pueden hacer queries de collections completas facilmente sin indices, 
      // pero aqui leemos la coleccion leads filtrada. Firestore Transaction query support exists.
      const leadsSnap = await t.get(db.collection("leads").where("asesorUid", "==", asesorUid));

      let ganados = 0; let perdidos = 0; let total = 0;
      leadsSnap.forEach(doc => {
        const l = doc.data();
        total++;
        if (l.status === STATUS.LEAD_WON) ganados++;
        if (l.status === STATUS.LEAD_LOST) perdidos++;
      });

      const finalizados = ganados + perdidos;
      const tasaCierre = finalizados > 0 ? ((ganados / finalizados) * 100) : 0;

      // --- NUEVA FÓRMULA DE SCORE ---
      // 1. Puntos por Cierre (1.5 puntos por cada 1% de tasa)
      // Regla: Este valor inicia con 0.
      const puntosCierre = Math.round(tasaCierre * 1.5);

      // 2. Variables Manuales (Defaults definidos por regla de negocio)
      // Reglas:
      // - Encuestas: Inicia con 30.
      // - Actualización: Inicia con 20.
      // - Comunicación: Inicia con 20.

      const ptosEncuestas = metricas.puntosEncuestas !== undefined ? metricas.puntosEncuestas : 30;
      const ptosActualizacion = metricas.puntosActualizacion !== undefined ? metricas.puntosActualizacion : 20;
      const ptosComunicacion = metricas.puntosComunicacion !== undefined ? metricas.puntosComunicacion : 20;

      const scoreTotal = puntosCierre + ptosEncuestas + ptosActualizacion + ptosComunicacion;

      // Cap al Score (Opcional, pero recomendado para UI, aunque la regla no dice limite, asumimos 150+ es posible)
      // La regla original implicaba base 100, aqui puede pasar de 100 facilmente (100% cierre = 150 pts + 70 manual = 220).

      t.update(asesorRef, {
        scoreGlobal: scoreTotal,
        "metricas.tasaCierre": Number(tasaCierre.toFixed(1)),
        "metricas.totalLeadsAsignados": total,
        "metricas.puntosCierre": puntosCierre,
        "metricas.puntosEncuestas": ptosEncuestas,
        "metricas.puntosActualizacion": ptosActualizacion,
        "metricas.puntosComunicacion": ptosComunicacion,
        "metricas.ultimaActualizacionScore": FieldValue.serverTimestamp()
      });
    });

  } catch (error) {
    console.error("Error metricas:", error);
  }
});

// TRIGGER: Recalcular Score Usuario (Cuando Administración cambia puntos manuales)
exports.recalcularScoreUsuario = onDocumentUpdated("users/{uid}", async (event) => {
  const antes = event.data.before.data();
  const despues = event.data.after.data();

  // Verificamos si cambiaron los puntos manuales en 'metricas'
  const mAntes = antes.metricas || {};
  const mDespues = despues.metricas || {};

  if (
    mAntes.puntosEncuestas === mDespues.puntosEncuestas &&
    mAntes.puntosActualizacion === mDespues.puntosActualizacion &&
    mAntes.puntosComunicacion === mDespues.puntosComunicacion
  ) {
    return; // No hubo cambios relevantes para el score
  }

  // Evitar ciclo infinito: Si ya se actualizó el scoreGlobal, no hacemos nada 
  // (aunque el check de arriba suele bastar, doble seguridad)

  try {
    const tasaCierre = mDespues.tasaCierre || 0;

    // Recalculo con la misma lógica
    const puntosCierre = Math.round(tasaCierre * 1.5);
    const ptosEncuestas = mDespues.puntosEncuestas !== undefined ? mDespues.puntosEncuestas : 30;
    const ptosActualizacion = mDespues.puntosActualizacion !== undefined ? mDespues.puntosActualizacion : 20;
    const ptosComunicacion = mDespues.puntosComunicacion !== undefined ? mDespues.puntosComunicacion : 20;

    const scoreTotal = puntosCierre + ptosEncuestas + ptosActualizacion + ptosComunicacion;

    // Solo escribimos si el score cambia
    if (despues.scoreGlobal !== scoreTotal) {
      await event.data.after.ref.update({
        scoreGlobal: scoreTotal,
        "metricas.puntosCierre": puntosCierre,
        "metricas.ultimaActualizacionScore": FieldValue.serverTimestamp()
      });
    }

  } catch (error) {
    console.error("Error recalculando score manual:", error);
  }
});


// ==================================================================
// SECCIÓN B: ADMINISTRACIÓN DE DATOS
// ==================================================================


