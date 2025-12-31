import { db } from '../firebase/config';
import { UserRepository } from '../repositories/user.repository';
import { LeadRepository } from '../repositories/lead.repository';
import { CatalogRepository } from '../repositories/catalog.repository';

const userRepository = new UserRepository(db);
const leadRepository = new LeadRepository(db);
const catalogRepository = new CatalogRepository(db);

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
        return await userRepository.getAllUsers();
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
        return await leadRepository.getAllLeads();
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
        return await catalogRepository.getAllDesarrollos();
    } catch (error) {
        console.error("Error fetching desarrollos:", error);
        return [];
    }
};

/**
 * Obtiene todos los modelos (para reportes globales)
 */
export const getAllModelos = async () => {
    try {
        return await catalogRepository.getAllModelos();
    } catch (error) {
        console.error("Error fetching modelos:", error);
        return [];
    }
};


// --- 2. ACCIONES DE CONTROL ---

// 🗑️ DELETED: toggleAdvisorInventory, updateAdvisorMetrics (Obsolete)


