// functions/src/services/user.service.js
const { db, FieldValue, Timestamp } = require("../utils/firestore");
const { STATUS } = require("../config/constants");

/**
 * Calcula el score total basado en la tasa de cierre métricas manuales.
 * @param {number} tasaCierre - Tasa de cierre en porcentaje (0-100).
 * @param {Object} metricas - Objeto de métricas del usuario.
 * @returns {Object} { scoreTotal, puntosCierre, ptosEncuestas, ptosActualizacion, ptosComunicacion }
 */
const _calculateScoreDetails = (tasaCierre, metricas) => {
    const puntosCierre = Math.round(tasaCierre * 1.5);
    const ptosEncuestas = metricas.puntosEncuestas !== undefined ? metricas.puntosEncuestas : 30;
    const ptosActualizacion = metricas.puntosActualizacion !== undefined ? metricas.puntosActualizacion : 20;
    const ptosComunicacion = metricas.puntosComunicacion !== undefined ? metricas.puntosComunicacion : 20;

    const scoreTotal = puntosCierre + ptosEncuestas + ptosActualizacion + ptosComunicacion;

    return {
        scoreTotal,
        puntosCierre,
        ptosEncuestas,
        ptosActualizacion,
        ptosComunicacion
    };
};

/**
 * Mantiene sincronizado el campo `inventarioActivoIds` para consultas O(1).
 * Trigger: onDocumentWritten("users/{uid}")
 */
exports.maintainInventoryIndex = async (change) => {
    const antes = change.before.exists ? change.before.data() : {};
    const despues = change.after.exists ? change.after.data() : null;

    // Si el usuario fue borrado, no hacemos nada
    if (!despues) return;

    const inventario = despues.inventario || [];

    // Extraer IDs de desarrollos activos (string comparison safe)
    const activosIds = inventario
        .filter(i => i.activo === true || i.activo === 'true')
        .map(i => String(i.idDesarrollo));

    // Ordenar para comparar arrays y evitar escrituras innecesarias
    activosIds.sort();

    const currentIds = (despues.inventarioActivoIds || []).sort();

    // Si son iguales, no tocar (evita loops infinitos)
    if (JSON.stringify(activosIds) === JSON.stringify(currentIds)) return;

    console.log(`🔄 Indexando inventario para usuario ${change.after.id}. Activos: ${activosIds.length}`);

    // Actualizar solo el índice
    await change.after.ref.update({
        inventarioActivoIds: activosIds,
        lastIndexUpdate: FieldValue.serverTimestamp()
    });
};

/**
 * Actualiza las métricas de un asesor de forma INCREMENTAL (Escalable).
 * Trigger: onDocumentUpdated("leads/{leadId}")
 */
exports.updateAdvisorMetrics = async (change) => {
    const antes = change.before.data();
    const despues = change.after.data();

    if (antes.status === despues.status) return;

    const asesorUid = despues.asesorUid;
    if (!asesorUid) return;

    const asesorRef = db.collection("users").doc(asesorUid);

    try {
        // 1. Calcular Deltas (Cambios en contadores)
        const updates = {};

        // Status Ganado
        if (despues.status === STATUS.LEAD_WON && antes.status !== STATUS.LEAD_WON) {
            updates['metricas.conteoGanados'] = FieldValue.increment(1);
        } else if (antes.status === STATUS.LEAD_WON && despues.status !== STATUS.LEAD_WON) {
            updates['metricas.conteoGanados'] = FieldValue.increment(-1);
        }

        // Status Perdido
        if (despues.status === STATUS.LEAD_LOST && antes.status !== STATUS.LEAD_LOST) {
            updates['metricas.conteoPerdidos'] = FieldValue.increment(1);
        } else if (antes.status === STATUS.LEAD_LOST && despues.status !== STATUS.LEAD_LOST) {
            updates['metricas.conteoPerdidos'] = FieldValue.increment(-1);
        }

        // Si no hay cambios en contadores relevantes para el score, salimos o actualizamos timestamps
        if (Object.keys(updates).length === 0) return;

        // 2. Aplicar incrementos atómicos
        await asesorRef.update(updates);

        // 3. Recalcular Score
        // Lógica Híbrida/Lazy: Si los contadores no existen (Usuario Legacy), inicializarlos leyendo una vez.
        await db.runTransaction(async (t) => {
            const doc = await t.get(asesorRef);
            const data = doc.data();
            const m = data.metricas || {};

            let ganados = m.conteoGanados;
            let perdidos = m.conteoPerdidos;

            // LAZY MIGRATION: Si no existen contadores, los calculamos (Solo ocurre la primera vez que se toca este asesor)
            if (typeof ganados !== 'number' || typeof perdidos !== 'number') {
                console.log(`⚠️ Inicializando contadores para asesor ${asesorUid}...`);
                // Leer todos los leads (Solo ocurre la primera vez que se toca este asesor)
                const leadsSnap = await t.get(db.collection("leads").where("asesorUid", "==", asesorUid));
                ganados = 0;
                perdidos = 0;

                leadsSnap.forEach(d => {
                    const s = d.data().status;
                    if (s === STATUS.LEAD_WON) ganados++;
                    if (s === STATUS.LEAD_LOST) perdidos++;
                });

                // Guardamos los contadores inicializados
                t.update(asesorRef, {
                    "metricas.conteoGanados": ganados,
                    "metricas.conteoPerdidos": perdidos
                });
            }

            const finalizados = ganados + perdidos;
            const tasaCierre = finalizados > 0 ? ((ganados / finalizados) * 100) : 0;

            const results = _calculateScoreDetails(tasaCierre, m);

            t.update(asesorRef, {
                scoreGlobal: results.scoreTotal,
                "metricas.tasaCierre": Number(tasaCierre.toFixed(1)),
                "metricas.puntosCierre": results.puntosCierre,
                "metricas.ultimaActualizacionScore": FieldValue.serverTimestamp()
            });
        });

    } catch (error) {
        console.error(`Error actualizando métricas incremental ${asesorUid}:`, error);
    }
};

/**
 * Recalcula el score cuando se actualizan manualmente los puntos desde Admin.
 */
exports.recalculateUserScore = async (change) => {
    const antes = change.before.data() || {};
    const despues = change.after.data();
    const mAntes = antes.metricas || {};
    const mDespues = despues.metricas || {};

    if (
        mAntes.puntosEncuestas === mDespues.puntosEncuestas &&
        mAntes.puntosActualizacion === mDespues.puntosActualizacion &&
        mAntes.puntosComunicacion === mDespues.puntosComunicacion
    ) return;

    try {
        const tasaCierre = mDespues.tasaCierre || 0;
        const results = _calculateScoreDetails(tasaCierre, mDespues);

        if (despues.scoreGlobal !== results.scoreTotal) {
            await change.after.ref.update({
                scoreGlobal: results.scoreTotal,
                "metricas.puntosCierre": results.puntosCierre,
                "metricas.ultimaActualizacionScore": FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error("Error recalculando score manual:", error);
        throw error;
    }
};
