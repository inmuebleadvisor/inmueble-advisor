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

// 🗑️ DELETED: toggleAdvisorInventory, updateAdvisorMetrics (Obsolete)


