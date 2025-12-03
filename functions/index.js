// functions/index.js
// ÚLTIMA MODIFICACION: 02/12/2025

// --- 1. IMPORTACIÓN DE LIBRERÍAS ---
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");

// --- 2. INICIALIZACIÓN DE LA APP ---
initializeApp();
const db = getFirestore();

// --- 3. IMPORTS LOCALES ---
const { ejecutarReestructuracionV2 } = require("./migrator"); 
const { mapearDesarrolloV2, mapearModeloV2 } = require("./csvImporter");

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

// TRIGGER: Actualizar Métricas Asesor
exports.actualizarMetricasAsesor = onDocumentUpdated("leads/{leadId}", async (event) => {
  const antes = event.data.before.data();
  const despues = event.data.after.data();
  
  if (antes.status === despues.status) return;

  const asesorUid = despues.asesorUid;
  if (!asesorUid) return;

  try {
    const asesorRef = db.collection("users").doc(asesorUid);
    const leadsSnap = await db.collection("leads").where("asesorUid", "==", asesorUid).get();
    
    let ganados = 0; let perdidos = 0; let total = 0;
    leadsSnap.forEach(doc => {
      const l = doc.data();
      total++;
      if (l.status === STATUS.LEAD_WON) ganados++;
      if (l.status === STATUS.LEAD_LOST) perdidos++;
    });

    const finalizados = ganados + perdidos;
    const tasaCierre = finalizados > 0 ? ((ganados / finalizados) * 100) : 0;
    const scoreFinal = Math.round(Math.min(tasaCierre + 50, 100)); 

    await asesorRef.update({
      scoreGlobal: scoreFinal,
      "metricas.tasaCierre": Number(tasaCierre.toFixed(1)),
      "metricas.totalLeadsAsignados": total,
      "metricas.ultimaActualizacionScore": FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error("Error metricas:", error);
  }
});


// ==================================================================
// SECCIÓN B: ADMINISTRACIÓN DE DATOS
// ==================================================================

/**
 * FUNCIÓN HTTP: Importación Masiva de Datos
 * CAMBIO CRÍTICO: Se agregó { cors: true } para permitir peticiones desde la herramienta HTML.
 */
exports.importarDatosMasivos = onRequest({ cors: true }, async (req, res) => {
    // 1. Validación de Método
    if (req.method !== 'POST') return res.status(405).send("Método no permitido. Use POST.");
    
    // 2. Extracción de Datos
    const { tipo, datos } = req.body;
    
    if (!datos || !Array.isArray(datos)) {
        return res.status(400).json({ error: "Formato incorrecto. Se espera un array en 'datos'." });
    }

    const batchSize = 400; 
    let batch = db.batch();
    let contador = 0;
    let procesados = 0;

    try {
        console.log(`>>> Iniciando importación masiva. Tipo: ${tipo}, Cantidad: ${datos.length}`);
        
        for (const row of datos) {
            let docRef;
            let dataLimpia;

            // 3. Mapeo y Limpieza
            if (tipo === 'desarrollos') {
                dataLimpia = mapearDesarrolloV2(row);
                docRef = db.collection('desarrollos').doc(String(dataLimpia.id));
            
            } else if (tipo === 'modelos') {
                dataLimpia = mapearModeloV2(row);
                
                if (dataLimpia.id) {
                    docRef = db.collection('modelos').doc(String(dataLimpia.id));
                } else {
                    docRef = db.collection('modelos').doc();
                }
            } else {
                return res.status(400).json({ error: "Tipo desconocido. Use 'desarrollos' o 'modelos'." });
            }

            // 4. Auditoría y Escritura
            dataLimpia.updatedAt = FieldValue.serverTimestamp();
            batch.set(docRef, dataLimpia, { merge: true });

            contador++;
            procesados++;

            if (contador >= batchSize) {
                await batch.commit();
                batch = db.batch();
                contador = 0;
            }
        }
        
        if (contador > 0) await batch.commit();

        res.json({ 
            success: true, 
            mensaje: "Importación finalizada", 
            procesados: procesados, 
            tipo: tipo 
        });

    } catch (error) {
        console.error("Error crítico en importación:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * FUNCIÓN HTTP: Mantenimiento DB
 */
exports.mantenimientoDB = onRequest(async (req, res) => {
  if (req.query.key !== "MIGRACION_2025_SECURE") {
      return res.status(403).send("⛔ Acceso Denegado: Clave incorrecta.");
  }
  
  try {
    const resultado = await ejecutarReestructuracionV2();
    res.json({ 
        mensaje: "✅ Mantenimiento V2.1 Ejecutado Correctamente", 
        detalles: resultado 
    });
  } catch (error) {
    console.error("Error en mantenimiento:", error);
    res.status(500).json({ error: error.message });
  }
});