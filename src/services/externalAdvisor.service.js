
/**
 * Servicio para la Gestión de Asesores Externos (Developments Sales Team)
 */
export class ExternalAdvisorService {
    /**
     * @param {import('../repositories/externalAdvisor.repository').ExternalAdvisorRepository} repository 
     */
    constructor(repository) {
        this.repository = repository;
    }

    /**
     * Busca un asesor externo por su número de teléfono.
     * @param {string} telefono - Teléfono a buscar.
     */
    async findByPhone(telefono) {
        if (!telefono) return null;
        // Limpieza básica del teléfono para mejorar el match
        // Nota: Si el repo ya no hace limpieza, la hacemos aquí. 
        // El repo anterior hacía query directo.
        const cleanPhone = telefono.replace(/\D/g, '');
        // Ojo: En el código original la limpieza estaba en el servicio antes del query.
        // Mi repo actual hace where('telefono', '==', telefono).
        // Así que debo pasarle el teléfono limpio O mantener la lógica original.
        // El original decía: const cleanPhone = telefono.replace(/\D/g, ''); 
        // pero luego usaba `where('telefono', '==', telefono)` (usaba el param original? NO, error mío en lectura anterior?)
        // Re-reading original file step 23:
        // const cleanPhone = ...
        // const q = query(..., where('telefono', '==', telefono)); <--- USABA EL ORIGINAL
        // OK, mantengo la lógica exacta: no usaba cleanPhone en el query.

        return await this.repository.findByPhone(telefono);
    }

    /**
     * Crea o Actualiza un asesor externo.
     * @param {Object} advisorData - { nombre, telefono, email, desarrolloId(opcional) }
     */
    async createOrUpdate(advisorData) {
        const existingAdvisor = await this.findByPhone(advisorData.telefono);

        if (existingAdvisor) {
            // Actualizar si es necesario
            await this.repository.update(existingAdvisor.id, {
                nombre: advisorData.nombre,
                // No actualizamos teléfono porque es la llave de búsqueda
            });
            return { id: existingAdvisor.id, ...advisorData };
        } else {
            // Crear Nuevo
            return await this.repository.create(advisorData);
        }
    }

    async getAll() {
        return await this.repository.getAll();
    }

    async addLeadToHistory(advisorId, leadSummary) {
        return await this.repository.addLeadToHistory(advisorId, leadSummary);
    }
}
