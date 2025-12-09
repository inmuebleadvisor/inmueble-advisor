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

// --- 3. MANTENIMIENTO DE CONTENIDO (VISIBILIDAD) ---

/**
 * Oculta desarrollos que no tienen foto de portada ni galería.
 */
export const hideIncompleteDevelopments = async () => {
    try {
        const snap = await getDocs(collection(db, 'desarrollos'));
        const batch = writeBatch(db);
        let count = 0;

        snap.docs.forEach(docSnap => {
            const data = docSnap.data();
            // Criterio: No tiene media.cover Y (no tiene media.gallery O está vacía)
            // Y check legacy: no tiene imagen

            const hasCover = data.media?.cover || data.imagen || data.multimedia?.portada;
            const hasGallery = (data.media?.gallery?.length > 0) || (data.multimedia?.galeria?.length > 0);

            if (!hasCover && !hasGallery) {
                batch.update(docSnap.ref, { activo: false });
                count++;
            }
        });

        if (count > 0) await batch.commit();
        return { success: true, count };
    } catch (error) {
        console.error("Error concealing incomplete developments:", error);
        return { success: false, error };
    }
};

/**
 * Oculta modelos que no tienen imágenes (plantas o renders).
 */
export const hideIncompleteModels = async () => {
    try {
        const snap = await getDocs(collection(db, 'modelos'));
        const batch = writeBatch(db);
        let count = 0;

        snap.docs.forEach(docSnap => {
            const data = docSnap.data();

            // Criterio: No imagen principal Y no planatas arquitectonicas
            const hasImage = data.imagen || data.media?.render; // Asumiendo estructura, ajustamos a lo común
            const hasPlans = data.media?.plantasArquitectonicas?.length > 0 || data.plantas?.length > 0;
            const hasVirtual = data.media?.recorridoVirtual || data.recorrido360;

            // Si no tiene NADA visual, ocultar
            if (!hasImage && !hasPlans && !hasVirtual) {
                batch.update(docSnap.ref, { activo: false });
                count++;
            }
        });

        if (count > 0) await batch.commit();
        return { success: true, count };
    } catch (error) {
        console.error("Error concealing incomplete models:", error);
        return { success: false, error };
    }
};

/**
 * Oculta modelos que no tienen precio definido o es 0.
 */
export const hidePricelessModels = async () => {
    try {
        const snap = await getDocs(collection(db, 'modelos'));
        const batch = writeBatch(db);
        let count = 0;

        snap.docs.forEach(docSnap => {
            const data = docSnap.data();

            let price = 0;
            if (data.precios?.base) price = Number(data.precios.base);
            else if (data.precioNumerico) price = Number(data.precioNumerico);

            if (!price || price <= 0) {
                batch.update(docSnap.ref, { activo: false });
                count++;
            }
        });

        if (count > 0) await batch.commit();
        return { success: true, count };
    } catch (error) {
        console.error("Error concealing priceless models:", error);
        return { success: false, error };
    }
};

/**
 * Oculta desarrollos que no tienen ningún modelo activo visible.
 */
export const hideEmptyDevelopments = async () => {
    try {
        // 1. Obtener todos los modelos activos
        const modelsQuery = query(collection(db, 'modelos'), where('activo', '!=', false));
        const modelsSnap = await getDocs(modelsQuery);

        // Set de IDs de desarrollos que TIENEN al menos un modelo activo
        const activeDevIds = new Set();
        modelsSnap.docs.forEach(d => {
            const data = d.data();
            // Normalizamos IDs
            const devId = data.idDesarrollo || data.id_desarrollo || data.desarrollo_id;
            if (devId) activeDevIds.add(String(devId));
        });

        // 2. Revisar todos los desarrollos
        const devsSnap = await getDocs(collection(db, 'desarrollos'));
        const batch = writeBatch(db);
        let count = 0;

        devsSnap.docs.forEach(docSnap => {
            // Si el desarrollo NO está en el set de IDs activos, lo desactivamos
            // (a menos que ya esté desactivado para no gastar write ops, aunque batch es ok)
            if (!activeDevIds.has(docSnap.id)) {
                // Opción: Checar si ya era false para no escribir? Firestore cobra por write.
                // Leemos el dato actual
                if (docSnap.data().activo !== false) {
                    batch.update(docSnap.ref, { activo: false });
                    count++;
                }
            }
        });

        if (count > 0) await batch.commit();
        return { success: true, count };

    } catch (error) {
        console.error("Error concealing empty developments:", error);
        return { success: false, error };
    }
};

/**
 * Reactiva todos los desarrollos (opción de emergencia/reset).
 */
export const enableAllDevelopments = async () => {
    try {
        const snap = await getDocs(collection(db, 'desarrollos'));
        const batch = writeBatch(db);
        let count = 0;

        snap.docs.forEach(docSnap => {
            const data = docSnap.data();
            if (data.activo === false) {
                batch.update(docSnap.ref, { activo: true });
                count++;
            }
        });

        if (count > 0) await batch.commit();
        return { success: true, count };
    } catch (error) {
        console.error("Error enabling all developments:", error);
        return { success: false, error };
    }
};
