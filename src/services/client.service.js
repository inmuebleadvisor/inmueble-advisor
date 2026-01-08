
/**
 * SERVICIO DE GESTIÓN DE CLIENTES (Lead-User Link)
 * -----------------------------------------------
 * Responsabilidad:
 * - Garantizar que cada Lead esté vinculado a una entidad "User".
 * - Evitar duplicidad de usuarios basada en Email o Teléfono.
 */

/**
 * Service for managing Client Users (Lead-User Link).
 * Ensures every Lead is linked to a unique User.
 */
export class ClientService {
    /**
     * @param {import('../repositories/user.repository').UserRepository} userRepository 
     */
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Busca un cliente existente por Email o Teléfono.
     * Prioridad: 1. Email (Exacto), 2. Teléfono (Normalizado).
     * @returns {Promise<{uid: string, ...data} | null>}
     */
    /**
     * Finds an existing client by Email or Phone.
     * Priority: 1. Email (Exact), 2. Phone (Cleaned).
     * @param {string} email - User email
     * @param {string} phone - User phone
     * @returns {Promise<{uid: string, ...data} | null>} User document or null
     */
    async findClientByContact(email, phone) {
        // 1. Buscar por Email
        if (email) {
            const user = await this.userRepository.findUserByEmail(email);
            if (user) return user;
        }

        // 2. Buscar por Teléfono (Si no se encontró por email)
        if (phone) {
            // Nota: El servicio original limpiaba el teléfono aquí o asumía que venía sucio?
            // "Normalizar teléfono para búsqueda (eliminar espacios, guiones)"
            // const normalizePhone = (phone) => phone.replace(/\D/g, '').slice(-10);
            // El servicio original usaba `userRepository.findUserByPhone(phone)` DIRECTAMENTE sin normalizar en la llamada?
            // No, el original tenía `const normalizePhone` pero NO LO USABA en `findClientByContact`. 
            // Espera, re-reading step 20: 
            // `const normalizePhone = ...` defined but NOT USED inside `findClientByContact` logic shown!
            // Wait, line 35: `await userRepository.findUserByPhone(phone);` passed raw phone.
            // Okay, I will preserve that behavior or fix it?
            // Rule: "The agent is allowed to be proactive... avoid surprising the user". 
            // I will implement the helper as a private method or utilities if needed, but the original code didn't use it!
            // I will act logically: Clean it before passing to repo for better matching.

            // Actually, let's keep it robust.
            const cleanPhone = phone.replace(/\D/g, '').slice(-10);
            const user = await this.userRepository.findUserByPhone(cleanPhone);
            // Also try with original just in case? No, repo matches exact string.
            // Let's stick to passing `phone` as is if the original code did so, to avoid breaking legacy data that might be unformatted.
            // BUT, if I want to improve, I should normalize.
            // I'll stick to passing `phone` to be safe with existing data state.
            const userRaw = await this.userRepository.findUserByPhone(phone);
            if (userRaw) return userRaw;
        }

        return null;
    }

    /**
     * Crea un nuevo Usuario con rol "cliente".
     */
    /**
     * Creates a new User with role "cliente".
     * @param {Object} userData - { nombre, email, telefono }
     * @returns {Promise<Object>} Created user
     */
    async createClient(userData) {
        try {
            const newUser = {
                nombre: userData.nombre,
                email: userData.email,
                telefono: userData.telefono,
                role: 'cliente',
                fechaRegistro: new Date().toISOString(),
                origen: 'web_lead_form',
                onboardingCompleto: false,
            };

            return await this.userRepository.createUser(newUser);
        } catch (error) {
            console.error("Error creating client:", error);
            throw error;
        }
    }

    /**
     * Actualiza los datos de contacto de un cliente existente si son más recientes.
     */
    /**
     * Updates client contact details.
     * @param {string} uid - User ID
     * @param {Object} newData - Data to update
     */
    async updateClientContact(uid, newData) {
        try {
            await this.userRepository.updateUser(uid, newData);
        } catch (error) {
            console.error("Error updating client:", error);
            // No lanzamos error para no bloquear el flujo principal
        }
    }

    /**
     * Finaliza el proceso de onboarding guardando el perfil financiero y preferencias.
     * @param {string} uid - ID del usuario.
     * @param {Object} profileData - Datos del perfil financiero (capital, mensualidad, etc).
     */
    async completeOnboarding(uid, profileData) {
        try {
            const updates = {
                uid: uid, // Redundant but consistent
                ultimoAcceso: new Date().toISOString(),
                perfilFinanciero: profileData,
                onboardingCompleto: true
            };

            // If profileData contains name/email, we might want to update root fields too, but 
            // the component logic seemed to only update them if they were part of the auth provider result.
            // For now, we strictly follow the component's logic: update profile items.

            await this.userRepository.updateUser(uid, updates);
            return true;
        } catch (error) {
            console.error("Error completing onboarding:", error);
            throw error;
        }
    }
}
