// functions/index.js (Código Completo y Final)
// DOCUMENTO MODIFICADO EL 01/12/2025

/**
 * BACKEND: INMUEBLE ADVISOR - CLOUD FUNCTIONS (CORREGIDO)
 * =======================================================
 * Correcciones aplicadas según Plan de Trabajo Fase 1:
 * 1. Uso estricto de FieldValue.serverTimestamp() para fechas.
 * 2. Corrección de lógica de inventario (Boolean 'activo').
 * 3. Estandarización de códigos de estado (STATUS).
 * * ✅ CORRECCIÓN DE FASE 2: Se asegura que las fechas del historial sean TIPO TIMESTAMP.
 */

const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// Inicializamos la app de administración
initializeApp();
const db = getFirestore();

// --- CONSTANTES DE ESTADO (Duplicadas para independencia del servicio - Principio de Autocontención) ---
const STATUS = {
    LEAD_NEW: 'NEW',
    LEAD_WON: 'WON',
    LEAD_LOST: 'LOST',
    LEAD_PENDING_ADMIN: 'PENDING_ADMIN'
};

/**
 * TRIGGER: Asignación Automática de Leads
 * Disparador: Creación de documento en 'leads/{leadId}'
 */
exports.asignarLead = onDocumentCreated("leads/{leadId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const leadId = snapshot.id;
  const leadData = snapshot.data();

  // 🛑 SEGURIDAD: Idempotencia
  if (leadData.asesorUid) {
    console.log(`🛑 El lead ${leadId} ya tiene asesor asignado.`);
    return;
  }

  const { desarrolloId, nombreDesarrollo, clienteDatos } = leadData;
  console.log(`🤖 Iniciando algoritmo de asignación para: ${nombreDesarrollo} (${leadId})`);

  try {
    // 1. OBTENER CANDIDATOS
    const asesoresRef = db.collection("users");
    const snapshotAsesores = await asesoresRef.where("role", "==", "asesor").get();

    let candidatos = [];

    snapshotAsesores.forEach((doc) => {
      const asesor = { uid: doc.id, ...doc.data() };
      
      // ✅ Validación contra Boolean 'activo' (Schema V1)
      const tieneDesarrollo = asesor.inventario?.find(item => 
        String(item.idDesarrollo) === String(desarrolloId) && item.activo === true
      );

      if (tieneDesarrollo) {
        candidatos.push(asesor);
      }
    });

    // CASO DE ERROR: Sin cobertura
    if (candidatos.length === 0) {
      console.warn("⚠️ No hay asesores disponibles. Lead queda pendiente de Admin.");
      await snapshot.ref.update({
        status: STATUS.LEAD_PENDING_ADMIN, // ✅ Uso de constante
        motivoAsignacion: 'Sin cobertura de asesores',
        
        // 🛠️ CORRECCIÓN APLICADA
        historial: FieldValue.arrayUnion({
          accion: 'error_asignacion',
          fecha: FieldValue.serverTimestamp(), // ✅ Usamos Timestamp
          detalle: 'No se encontraron asesores con este desarrollo activo.'
        })
      });
      return;
    }

    // 2. REGLA DE LEALTAD
    let asesorGanador = null;
    let motivoAsignacion = "";

    if (clienteDatos?.email) {
      const historialQuery = await db.collection("leads")
        .where("clienteDatos.email", "==", clienteDatos.email)
        .limit(5)
        .get();

      if (!historialQuery.empty) {
        const asesoresPreviosIds = historialQuery.docs.map(d => d.data().asesorUid).filter(Boolean);
        asesorGanador = candidatos.find(c => asesoresPreviosIds.includes(c.uid));
        
        if (asesorGanador) motivoAsignacion = "Lealtad (Cliente Recurrente)";
      }
    }

    // 3. REGLA DE MÉRITO
    if (!asesorGanador) {
      candidatos.sort((a, b) => {
        const scoreA = a.scoreGlobal || 0;
        const scoreB = b.scoreGlobal || 0;
        // Mayor score gana
        if (scoreB !== scoreA) return scoreB - scoreA;
        // Desempate aleatorio
        return 0.5 - Math.random();
      });

      asesorGanador = candidatos[0];
      motivoAsignacion = "Mérito (Score más alto)";
    }

    console.log(`🏆 Ganador: ${asesorGanador.nombre} - ${motivoAsignacion}`);

    // 4. ESCRITURA ATÓMICA
    await snapshot.ref.update({
      asesorUid: asesorGanador.uid,
      asesorNombre: asesorGanador.nombre,
      status: STATUS.LEAD_NEW, // ✅ Uso de constante universal
      motivoAsignacion: motivoAsignacion,
      
      // ✅ CORRECCIÓN CRÍTICA: Timestamps reales del servidor
      fechaAsignacion: FieldValue.serverTimestamp(), 
      
      // 🛠️ CORRECCIÓN APLICADA
      historial: FieldValue.arrayUnion({
        accion: 'asignacion_automatica',
        fecha: FieldValue.serverTimestamp(), // ✅ Usamos Timestamp
        detalle: `Asignado a ${asesorGanador.nombre} por ${motivoAsignacion}`
      })
    });

  } catch (error) {
    console.error("Error crítico en asignación:", error);
  }
});

/**
 * TRIGGER: Actualización de Métricas (Score)
 */
exports.actualizarMetricasAsesor = onDocumentUpdated("leads/{leadId}", async (event) => {
  const antes = event.data.before.data();
  const despues = event.data.after.data();

  if (antes.status === despues.status) return;

  const asesorUid = despues.asesorUid;
  if (!asesorUid) return;

  try {
    const asesorRef = db.collection("users").doc(asesorUid);
    const asesorSnap = await asesorRef.get();
    if (!asesorSnap.exists) return;
    
    const perfil = asesorSnap.data();
    const leadsSnap = await db.collection("leads").where("asesorUid", "==", asesorUid).get();
    
    let ganados = 0;
    let perdidos = 0;
    let totalLeads = 0;

    leadsSnap.forEach(doc => {
      const l = doc.data();
      totalLeads++;
      // ✅ Uso de constantes
      if (l.status === STATUS.LEAD_WON) ganados++;
      if (l.status === STATUS.LEAD_LOST) perdidos++;
    });

    const finalizados = ganados + perdidos;
    const tasaCierre = finalizados > 0 ? ((ganados / finalizados) * 100) : 0;

    // Cálculo simplificado del Score (Meritocracia)
    const promedioResenas = perfil.metricas?.promedioResenas || 0;
    const ptsResenas = (promedioResenas / 5) * 30;
    
    // Regla de inventario (20%)
    let ptsActualizacion = 0;
    if (perfil.metricas?.ultimaActualizacionInventario) {
        // Lógica de fecha simplificada
        ptsActualizacion = 20; 
    }

    const factorCierre = Math.min(tasaCierre, 10) / 10;
    const ptsCierre = factorCierre * 30;
    const cumplimientoAdmin = perfil.metricas?.cumplimientoAdmin || 80;
    const ptsAdmin = (cumplimientoAdmin / 100) * 20;

    const scoreFinal = Math.round(ptsResenas + ptsActualizacion + ptsCierre + ptsAdmin);

    await asesorRef.update({
      scoreGlobal: scoreFinal,
      "metricas.tasaCierre": Number(tasaCierre.toFixed(1)),
      "metricas.totalLeadsAsignados": totalLeads,
      "metricas.ultimaActualizacionScore": FieldValue.serverTimestamp() // ✅ Timestamp correcto
    });

  } catch (error) {
    console.error("Error calculando score:", error);
  }
});

// Endpoint de migración se mantiene igual (omitido para brevedad)
const { onRequest } = require("firebase-functions/v2/https");
const { ejecutarMigracion } = require("./migrator");
exports.migrarBaseDeDatos = onRequest(async (req, res) => {
  if (req.query.key !== "MIGRACION_2025_SECURE") return res.status(403).send("⛔");
  try {
    const resultado = await ejecutarMigracion();
    res.json({ mensaje: "✅ Migración OK", detalles: resultado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});