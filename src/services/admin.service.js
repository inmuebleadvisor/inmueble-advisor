import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, getDoc, writeBatch, query, where } from 'firebase/firestore';

/**
 * Servicio para la Gestión Administrativa
 * Responsabilidad: Acceso a datos globales (Usuarios, Leads, Inventario) y control de permisos.
 */

// --- 1. GETTERS DE DATOS GLOBALES ---

/**
 * Obtiene todos los usuarios (Asesores y Clientes)
 */
export const getAllUsers = async () => {
    try {
        const snap = await getDocs(collection(db, 'users'));
        return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
    } catch (error) {
        console.error("Error fetching all users:", error);
        return [];
    }
};

/**
 * Obtiene todos los leads para métricas generales
 */
export const getAllLeads = async () => {
    try {
        const snap = await getDocs(collection(db, 'leads'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("Error fetching all leads:", error);
        return [];
    }
};

/**
 * Obtiene todos los desarrollos
 */
export const getAllDesarrollos = async () => {
    try {
        const snap = await getDocs(collection(db, 'desarrollos'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("Error fetching desarrollos:", error);
        return [];
    }
};


// --- 2. ACCIONES DE CONTROL ---

/**
 * Activa o desactiva una propiedad para un asesor específico.
 * @param {string} asesorUid - ID del asesor
 * @param {Array} currentInventory - Array actual de inventario del asesor (para no hacer fetch extra)
 * @param {string} idDesarrollo - ID del desarrollo a modificar
 * @param {boolean} newStatus - Nuevo estado (true/false)
 */
export const toggleAdvisorInventory = async (asesorUid, idDesarrollo, newStatus) => {
    try {
        const asesorRef = doc(db, 'users', asesorUid);
        const asesorSnap = await getDoc(asesorRef);

        if (!asesorSnap.exists()) {
            throw new Error("Asesor no encontrado");
        }

        const currentInventory = asesorSnap.data().inventario || [];

        // Encontrar el índice del item en el array
        const updatedInventory = currentInventory.map(item => {
            if (String(item.idDesarrollo) === String(idDesarrollo)) {
                return { ...item, activo: newStatus };
            }
            return item;
        });

        await updateDoc(asesorRef, {
            inventario: updatedInventory
        });

        return { success: true, updatedInventory };
    } catch (error) {
        console.error("Error toggling inventory:", error);
        return { success: false, error };
    }
};

/**
 * Actualiza las métricas manuales de un asesor para el Score Card.
 * @param {string} asesorUid - ID del asesor
 * @param {Object} metrics - Objeto con valores manuales { puntosEncuestas, puntosActualizacion, puntosComunicacion }
 */
export const updateAdvisorMetrics = async (asesorUid, metrics) => {
    try {
        const asesorRef = doc(db, 'users', asesorUid);

        // Validamos que los valores sean números antes de enviar
        const dataToUpdate = {};
        if (metrics.puntosEncuestas !== undefined) dataToUpdate["metricas.puntosEncuestas"] = Number(metrics.puntosEncuestas);
        if (metrics.puntosActualizacion !== undefined) dataToUpdate["metricas.puntosActualizacion"] = Number(metrics.puntosActualizacion);
        if (metrics.puntosComunicacion !== undefined) dataToUpdate["metricas.puntosComunicacion"] = Number(metrics.puntosComunicacion);

        await updateDoc(asesorRef, dataToUpdate);
        return { success: true };
    } catch (error) {
        console.error("Error updating advisor metrics:", error);
        return { success: false, error };
    }
};


