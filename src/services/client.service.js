import { db } from '../firebase/config';
import { UserRepository } from '../repositories/user.repository';

// Singleton or instantiation
const userRepository = new UserRepository(db);

/**
 * SERVICIO DE GESTIÓN DE CLIENTES (Lead-User Link)
 * -----------------------------------------------
 * Responsabilidad:
 * - Garantizar que cada Lead esté vinculado a una entidad "User".
 * - Evitar duplicidad de usuarios basada en Email o Teléfono.
 * REFACTORIZADO: Ene 2026 - Uso de UserRepository
 */

// Normalizar teléfono para búsqueda (eliminar espacios, guiones)
const normalizePhone = (phone) => {
    return phone.replace(/\D/g, '').slice(-10); // Últimos 10 dígitos
};

/**
 * Busca un cliente existente por Email o Teléfono.
 * Prioridad: 1. Email (Exacto), 2. Teléfono (Normalizado).
 * @returns {Promise<{uid: string, ...data} | null>}
 */
export const findClientByContact = async (email, phone) => {
    // 1. Buscar por Email
    if (email) {
        const user = await userRepository.findUserByEmail(email);
        if (user) return user;
    }

    // 2. Buscar por Teléfono (Si no se encontró por email)
    if (phone) {
        const user = await userRepository.findUserByPhone(phone);
        if (user) return user;
    }

    return null;
};

/**
 * Crea un nuevo Usuario con rol "cliente".
 * NOTA: Esto crea un "Ghost User" si no está autenticado. 
 * Si luego se registra con Google, el UID será diferente y habrá que fusionar (Fase futura).
 * Por ahora, esto cumple el requisito de tener un registro único de contacto.
 */
export const createClient = async (userData) => {
    try {
        const newUser = {
            nombre: userData.nombre,
            email: userData.email,
            telefono: userData.telefono,
            role: 'cliente',
            fechaRegistro: new Date().toISOString(),
            origen: 'web_lead_form',
            onboardingCompleto: false,
            // Metadatos de auditoría son manejados por el repo
        };

        const createdUser = await userRepository.createUser(newUser);
        return createdUser;
    } catch (error) {
        console.error("Error creating client:", error);
        throw error;
    }
};

/**
 * Actualiza los datos de contacto de un cliente existente si son más recientes.
 */
export const updateClientContact = async (uid, newData) => {
    try {
        await userRepository.updateUser(uid, newData);
    } catch (error) {
        console.error("Error updating client:", error);
        // No lanzamos error para no bloquear el flujo principal (Lead Creation)
    }
};
