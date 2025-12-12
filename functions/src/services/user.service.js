/**
 * ============================================================================
 * ARCHIVO: user.service.js
 * ----------------------------------------------------------------------------
 * RESUMEN:
 * Gestiona toda la lógica relacionada con los usuarios (Asesores), específicamente
 * el mantenimiento de sus métricas de desempeño y la indexación rápida de su
 * inventario para consultas eficientes.
 * 
 * ALCANCE:
 * - Calculadora de Puntaje (Score) de Asesores.
 * - Mantenimiento de Índices de Búsqueda (inventarioActivoIds).
 * - Actualización incremental de métricas (Ganados/Perdidos) sin leer toda la DB.
 * 
 * ÚLTIMA MODIFICACIÓN: 11/12/2025
 * ============================================================================
 */
const { db, FieldValue, Timestamp } = require("../utils/firestore");
const { STATUS } = require("../config/constants");

/**
 * FUNCIÓN: _calculateScoreDetails (Privada)
 * -----------------------------------------
 * PROPÓSITO:
 * Encapsula la fórmula matemática del "Score" del asesor. 
 * Se separa para poder reutilizarla en recálculos automáticos y manuales.
 * 
 * EXPLICACIÓN DIDÁCTICA:
 * El Score se compone de desempeño duro (ventas/cierres) y blando (encuestas/proactividad).
 * 
 * @param {number} tasaCierre - Porcentaje calculado de efectividad.
 * @param {Object} metricas - Datos crudos almacenados en el usuario.
 * @return {Object} Desglose detallado de los puntos.
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
 * FUNCIÓN: maintainInventoryIndex
 * -------------------------------
 * PROPÓSITO:
 * Mantiene un campo especial llamado `inventarioActivoIds` dentro del usuario.
 * 
 * EXPLICACIÓN DIDÁCTICA:
 * Firestore no puede hacer consultas complejas como "Dame usuarios cuyo ARRAY de objetos 
 * tenga una propiedad 'id' igual a X y 'activo' igual a TRUE". 
 * 
 * Solución (Desnormalización):
 * cada vez que cambia el usuario, extraemos solo los IDs de los desarrollos activos
 * y los guardamos en un array simple de strings ['dev1', 'dev2'].
 * Así podemos usar la consulta ultra-rápida `array-contains`.
 * 
 * Trigger: Se ejecuta cada vez que se escribe (crea/edita) en "users/{uid}"
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



    // Actualizar solo el índice
    await change.after.ref.update({
        inventarioActivoIds: activosIds,
        lastIndexUpdate: FieldValue.serverTimestamp()
    });
};

/**
 * FUNCIÓN: updateAdvisorMetrics
 * -----------------------------
 * PROPÓSITO:
 * Actualiza los contadores de leads Ganados/Perdidos de un asesor en tiempo real.
 * 
 * EXPLICACIÓN DIDÁCTICA:
 * En lugar de contar todos los leads de la base de datos cada vez (lo cual sería lento y caro),
 * usamos un enfoque "Incremental".
 * 
 * 1. Escuchamos cambios en un lead individual.
 * 2. Si el status cambió de "Nuevo" a "Ganado", sumamos +1 al contador del asesor.
 * 3. Si cambió de "Ganado" a "Perdido", restamos -1 a Ganados y sumamos +1 a Perdidos.
 * 
 * Atomicidad: Usamos `FieldValue.increment(1)` para que si dos leads cambian al mismo tiempo,
 * no se pierda la cuenta.
 * 
 * Trigger: Se ejecuta al actualizar documento en "leads/{leadId}"
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
 * FUNCIÓN: recalculateUserScore
 * -----------------------------
 * PROPÓSITO:
 * Recalcula el puntaje si un Admin edita manualmente las métricas "blandas"
 * (ej: puntos por encuestas de satisfacción).
 * 
 * EXPLICACIÓN DIDÁCTICA:
 * A veces el sistema automático no lo cubre todo. Si un jefe entra al panel y le sube los
 * puntos de "Comunicación" a un asesor, esta función detecta ese cambio manual
 * y re-suma el total para que el Score Global sea siempre consistente.
 * 
 * Trigger: Se ejecuta al actualizar documento en "users/{uid}"
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
