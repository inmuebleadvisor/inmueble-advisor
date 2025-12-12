// functions/src/services/lead.service.js
const { db, FieldValue, Timestamp } = require("../utils/firestore");
const { STATUS } = require("../config/constants");

/**
 * Asigna un asesor a un lead basado en el inventario.
 * @param {Object} snapshot - El snapshot del documento creado (event.data).
 */
exports.assignLead = async (snapshot) => {
    if (!snapshot) return;

    const leadId = snapshot.id;
    const leadData = snapshot.data();

    if (leadData.asesorUid) return;

    try {
        const asesoresRef = db.collection("users");

        // OPTIMIZACIÓN (O(1)): Usamos el índice 'inventarioActivoIds' mantenido automáticamente
        // Si la migración no ha corrido, esto podría no devolver nada.
        // El trigger de 'maintainInventoryIndex' asegura que eventulamente se pueble.
        const snapshotAsesores = await asesoresRef
            .where("role", "==", "asesor")
            .where("inventarioActivoIds", "array-contains", String(leadData.desarrolloId))
            .get();

        let candidatos = [];

        snapshotAsesores.forEach((doc) => {
            candidatos.push({ uid: doc.id, ...doc.data() });
        });

        if (candidatos.length === 0) {
            await snapshot.ref.update({
                status: STATUS.LEAD_PENDING_ADMIN,
                motivoAsignacion: 'Sin cobertura',
                historial: FieldValue.arrayUnion({
                    accion: 'error_asignacion',
                    fecha: Timestamp.now(),
                    detalle: 'Sin asesores disponibles con inventario activo.'
                })
            });
            return;
        }

        // Asignar al primero de la lista (Aquí se puede mejorar con Round Robin / Score)
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
        console.error(`Error en asignación de lead ${leadId}:`, error);
        throw error;
    }
};
