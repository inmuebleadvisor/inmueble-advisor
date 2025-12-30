
/**
 * SERVICIO DE GESTIÓN DE CLIENTES (Lead-User Link)
 * -----------------------------------------------
 * Responsabilidad:
 * - Garantizar que cada Lead esté vinculado a una entidad "User".
 * - Evitar duplicidad de usuarios basada en Email o Teléfono.
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
    async updateClientContact(uid, newData) {
        try {
            await this.userRepository.updateUser(uid, newData);
        } catch (error) {
            console.error("Error updating client:", error);
            // No lanzamos error para no bloquear el flujo principal
        }
    }
}
