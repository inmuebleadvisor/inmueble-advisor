/**
 * ============================================================================
 * ARCHIVO: lead.service.js
 * ----------------------------------------------------------------------------
 * RESUMEN:
 * Este módulo contiene la lógica de negocio responsable de reaccionar a la 
 * creación de un nuevo Lead (prospecto) y asignarle automáticamente un asesor
 * de ventas.
 * 
 * ALCANCE:
 * - Escucha eventos de creación en la colección "leads".
 * - Busca asesores aptos que tengan inventario del desarrollo solicitado.
 * - Ejecuta la asignación o marca el lead para revisión administrativa.
 * 
 * ÚLTIMA MODIFICACIÓN: 11/12/2025
 * ============================================================================
 */
const { db, FieldValue, Timestamp } = require("../utils/firestore");
const { STATUS } = require("../config/constants");

/**
 * FUNCIÓN: assignLead
 * -------------------
 * PROPÓSITO:
 * Es el "cerebro" de la asignación. Se ejecuta automáticamente (Trigger)
 * cuando entra un lead nuevo.
 * 
 * EXPLICACIÓN DIDÁCTICA:
 * 1. Recibe el 'snapshot' (la foto instantánea) del documento recién creado.
 * 2. Verifica si ya tiene asesor (para evitar reasignaciones infinitas).
 * 3. Consulta la base de datos ('users') buscando asesores que:
 *    a) Tengan rol de 'asesor'.
 *    b) Tengan el ID del desarrollo en su lista de 'inventarioActivoIds'.
 * 4. Si encuentra candidatos, escoge uno (actualmente el primero encontrado).
 * 5. Si no hay nadie, cambia el estado del lead a 'PENDING_ADMIN' para que un humano decida.
 * 
 * @param {Object} snapshot - Objeto que representa el documento de Firestore.
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
