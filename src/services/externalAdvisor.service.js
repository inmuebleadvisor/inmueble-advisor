import { db } from '../firebase/config';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, arrayUnion } from 'firebase/firestore';

/**
 * Servicio para la Gestión de Asesores Externos (Developments Sales Team)
 */

const COLLECTION_NAME = 'external_advisors';

/**
 * Busca un asesor externo por su número de teléfono.
 * @param {string} telefono - Teléfono a buscar.
 * @returns {Promise<Object|null>} - Retorna el objeto del asesor (con id) o null.
 */
export const findExternalAdvisorByPhone = async (telefono) => {
    try {
        if (!telefono) return null;
        // Limpieza básica del teléfono para mejorar el match
        const cleanPhone = telefono.replace(/\D/g, '');
        // Nota: En un caso real, la limpieza debería ser consistente al guardar y al buscar.

        const q = query(collection(db, COLLECTION_NAME), where('telefono', '==', telefono));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        // Retornamos el primero encontrado (asumiendo unicidad)
        const docSnap = snapshot.docs[0];
        return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
        console.error("Error buscando asesor externo:", error);
        throw error;
    }
};

/**
 * Crea o Actualiza un asesor externo.
 * Si ya existe (por teléfono), actualiza sus datos básicos si cambiaron.
 * Si no, crea uno nuevo.
 * @param {Object} advisorData - { nombre, telefono, email, desarrolloId(opcional) }
 * @returns {Promise<Object>} - El asesor persistido con su ID.
 */
export const createOrUpdateExternalAdvisor = async (advisorData) => {
    try {
        const existingAdvisor = await findExternalAdvisorByPhone(advisorData.telefono);

        if (existingAdvisor) {
            // Actualizar si es necesario (ej: nombre corregido)
            const advisorRef = doc(db, COLLECTION_NAME, existingAdvisor.id);
            await updateDoc(advisorRef, {
                nombre: advisorData.nombre,
                // No actualizamos teléfono porque es la llave de búsqueda
                lastUpdated: serverTimestamp()
            });
            return { id: existingAdvisor.id, ...advisorData };
        } else {
            // Crear Nuevo
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...advisorData,
                createdAt: serverTimestamp(),
                metricas: {
                    ganados: 0,
                    perdidos: 0,
                    tasaCierre: 0 // Se calculará igual que antes
                }
            });
            return { id: docRef.id, ...advisorData };
        }
    } catch (error) {
        console.error("Error gestionando asesor externo:", error);
        throw error;
    }
};

/**
 * Obtiene todos los asesores externos para el buscador.
 */
export const getAllExternalAdvisors = async () => {
    try {
        const snap = await getDocs(collection(db, COLLECTION_NAME));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("Error fetcheando asesores externos:", error);
        return [];
    }
};
/**
 * Registra un Lead en el historial del asesor.
 * @param {string} advisorId 
 * @param {Object} leadSummary - { leadId, nombreCliente, desarrollo, ... }
 */
export const addLeadToAdvisorHistory = async (advisorId, leadSummary) => {
    try {
        const advisorRef = doc(db, COLLECTION_NAME, advisorId);
        await updateDoc(advisorRef, {
            leadsAsignados: arrayUnion({
                ...leadSummary,
                fechaAsignacion: new Date().toISOString() // String para fácil lectura en array
            }),
            lastUpdated: serverTimestamp()
        });
    } catch (error) {
        console.error("Error registrando lead en historial de asesor:", error);
        // No lanzamos error crítico, es auditoría secundaria.
    }
};
