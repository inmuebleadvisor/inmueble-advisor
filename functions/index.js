/**
 * BACKEND: INMUEBLE ADVISOR
 * =========================
 * Lógica segura de negocio (Serverless).
 */
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
/*const { onDocumentCreated } = require("firebase-functions/v2/firestore");
*/
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

// Inicializamos la app de administración para poder leer/escribir en toda la BD
initializeApp();
const db = getFirestore();

/**
 * TRIGGER: Asignación Automática de Leads
 * Se dispara automáticamente cuando se crea un documento en la colección "leads".
 */
exports.asignarLead = onDocumentCreated("leads/{leadId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    return;
  }

  const leadId = snapshot.id;
  const leadData = snapshot.data();

  // 🛑 SEGURIDAD: Evitar bucles infinitos.
  // Si el lead ya tiene asesor (porque lo editó un admin o el sistema ya corrió), paramos.
  if (leadData.asesorUid) {
    console.log(`🛑 El lead ${leadId} ya tiene asesor asignado.`);
    return;
  }

  const { desarrolloId, nombreDesarrollo, clienteDatos } = leadData;
  console.log(`🤖 Iniciando algoritmo de asignación para: ${nombreDesarrollo} (${leadId})`);

  try {
    // 1. OBTENER CANDIDATOS (Asesores con el rol correcto)
    const asesoresRef = db.collection("users");
    const snapshotAsesores = await asesoresRef.where("role", "==", "asesor").get();

    let candidatos = [];

    snapshotAsesores.forEach((doc) => {
      const asesor = { uid: doc.id, ...doc.data() };
      
      // Filtro de Inventario: Debe tener el desarrollo en su lista y estar 'activo'
      // Nota: Convertimos a String para asegurar que la comparación funcione
      const tieneDesarrollo = asesor.inventario?.find(item => 
        String(item.idDesarrollo) === String(desarrolloId) && item.status === 'activo'
      );

      if (tieneDesarrollo) {
        candidatos.push(asesor);
      }
    });

    // CASO DE ERROR: Nadie vende este desarrollo
    if (candidatos.length === 0) {
      console.warn("⚠️ No hay asesores disponibles. Lead queda pendiente de Admin.");
      await snapshot.ref.update({
        status: 'pendiente_admin',
        motivoAsignacion: 'Sin cobertura de asesores',
        historial: FieldValue.arrayUnion({
          accion: 'error_asignacion',
          fecha: new Date().toISOString(),
          detalle: 'No se encontraron asesores con este desarrollo activo.'
        })
      });
      return;
    }

    // 2. REGLA DE LEALTAD (Prioridad Histórica)
    // Buscamos si este cliente ya compró o fue atendido antes por alguien disponible
    let asesorGanador = null;
    let motivoAsignacion = "";

    if (clienteDatos?.email) {
      const historialQuery = await db.collection("leads")
        .where("clienteDatos.email", "==", clienteDatos.email)
        .limit(5) // Revisamos sus últimos 5 leads para no ir muy atrás
        .get();

      if (!historialQuery.empty) {
        // Obtenemos los IDs de los asesores que lo atendieron antes
        const asesoresPreviosIds = historialQuery.docs.map(d => d.data().asesorUid).filter(Boolean);
        
        // Buscamos si alguno de esos asesores está en la lista de candidatos actuales
        asesorGanador = candidatos.find(c => asesoresPreviosIds.includes(c.uid));
        
        if (asesorGanador) {
          motivoAsignacion = "Lealtad (Cliente Recurrente)";
        }
      }
    }

    // 3. REGLA DE MÉRITO (Ranking por Score)
    // Si no aplicó lealtad, compiten por calidad
    if (!asesorGanador) {
      candidatos.sort((a, b) => {
        // A. Score Global (Mayor es mejor)
        const scoreA = a.scoreGlobal || 0;
        const scoreB = b.scoreGlobal || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;

        // B. Desempate: Tasa de Cierre (Mayor es mejor)
        const tasaA = a.metricas?.tasaCierre || 0;
        const tasaB = b.metricas?.tasaCierre || 0;
        if (tasaB !== tasaA) return tasaB - tasaA;

        // C. Desempate Final: Aleatorio (Suerte)
        return 0.5 - Math.random();
      });

      asesorGanador = candidatos[0];
      motivoAsignacion = "Mérito (Score más alto)";
    }

    console.log(`🏆 Ganador: ${asesorGanador.nombre} - ${motivoAsignacion}`);

    // 4. ESCRITURA ATÓMICA (Actualizar el Lead)
    await snapshot.ref.update({
      asesorUid: asesorGanador.uid,
      asesorNombre: asesorGanador.nombre,
      status: 'nuevo', // Pasa de 'creado' a 'nuevo' (listo para trabajar)
      motivoAsignacion: motivoAsignacion,
      fechaAsignacion: new Date().toISOString(),
      // Agregamos el evento al historial del lead
      historial: FieldValue.arrayUnion({
        accion: 'asignacion_automatica',
        fecha: new Date().toISOString(),
        detalle: `Asignado a ${asesorGanador.nombre} por ${motivoAsignacion}`
      })
    });

  } catch (error) {
    console.error("Error crítico en asignación:", error);
  }
});
exports.actualizarMetricasAsesor = onDocumentUpdated("leads/{leadId}", async (event) => {
  const antes = event.data.before.data();
  const despues = event.data.after.data();

  // Solo corremos si cambió el status (ahorramos dinero/recursos)
  if (antes.status === despues.status) return;

  const asesorUid = despues.asesorUid;
  if (!asesorUid) return;

  console.log(`📊 Recalculando score para asesor: ${asesorUid}`);

  try {
    // 1. Obtener todas las variables necesarias
    // Leemos el perfil del asesor para obtener métricas "fijas" (Reseñas, Admin)
    const asesorRef = db.collection("users").doc(asesorUid);
    const asesorSnap = await asesorRef.get();
    
    if (!asesorSnap.exists) return;
    const perfil = asesorSnap.data();

    // Leemos TODOS los leads de este asesor para calcular la "Tasa de Cierre" real
    const leadsSnap = await db.collection("leads").where("asesorUid", "==", asesorUid).get();
    
    // 2. Calcular Estadísticas (Matemática pura)
    let ganados = 0;
    let perdidos = 0;
    let totalLeads = 0;

    leadsSnap.forEach(doc => {
      const l = doc.data();
      totalLeads++;
      if (l.status === 'vendido') ganados++;
      if (l.status === 'perdido') perdidos++;
    });

    const finalizados = ganados + perdidos;
    // Evitamos división por cero
    const tasaCierre = finalizados > 0 ? ((ganados / finalizados) * 100) : 0;

    // 3. Algoritmo de Score (El mismo que tenías en el frontend)
    // A. Reseñas (30%)
    const promedioResenas = perfil.metricas?.promedioResenas || 0;
    const ptsResenas = (promedioResenas / 5) * 30;

    // B. Actualización Inventario (20%) - Regla de 30 días
    const ultimaActualizacion = perfil.metricas?.ultimaActualizacionInventario;
    let ptsActualizacion = 0;
    if (ultimaActualizacion) {
      const fechaUltima = new Date(ultimaActualizacion);
      const diferenciaDias = (new Date() - fechaUltima) / (1000 * 60 * 60 * 24);
      if (diferenciaDias <= 30) ptsActualizacion = 20; 
    }

    // C. Tasa de Cierre (30%) - Tope en 10% de efectividad
    const factorCierre = Math.min(tasaCierre, 10) / 10;
    const ptsCierre = factorCierre * 30;

    // D. Cumplimiento Admin (20%)
    const cumplimientoAdmin = perfil.metricas?.cumplimientoAdmin || 80;
    const ptsAdmin = (cumplimientoAdmin / 100) * 20;

    const scoreFinal = Math.round(ptsResenas + ptsActualizacion + ptsCierre + ptsAdmin);

    console.log(`✅ Nuevo Score: ${scoreFinal} (Cierre: ${tasaCierre.toFixed(1)}%)`);

    // 4. Guardar en Base de Datos
    await asesorRef.update({
      scoreGlobal: scoreFinal,
      "metricas.tasaCierre": Number(tasaCierre.toFixed(1)),
      "metricas.totalLeadsAsignados": totalLeads,
      // Opcional: timestamp de última actualización de métricas
      "metricas.ultimaActualizacionScore": new Date().toISOString()
    });

  } catch (error) {
    console.error("Error calculando score:", error);
  }
});