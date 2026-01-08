
/**
 * Service for managing External Advisors (Developers' Sales Reps).
 * Handles registration and directory listing.
 */
export class ExternalAdvisorService {
    constructor(externalAdvisorRepository, catalogRepository) {
        this.repository = externalAdvisorRepository;
        this.catalogRepository = catalogRepository;
    }

    /**
     * Registers a new external advisor.
     * @param {Object} data 
     * @param {string} data.idDesarrollador
     * @param {string} data.nombre
     * @param {string} data.whatsapp
     * @param {string} [data.email]
     * @param {string} [data.puesto]
     */
    async registerAdvisor(data) {
        const { idDesarrollador, nombre, whatsapp, email, puesto } = data;

        if (!idDesarrollador || !nombre || !whatsapp) {
            throw new Error("Missing required fields: idDesarrollador, nombre, whatsapp");
        }

        // Basic validation for whatsapp (numbers only, simplified)
        if (!/^\d+$/.test(whatsapp)) {
            throw new Error("WhatsApp must contain only numbers");
        }

        const newAdvisor = {
            idDesarrollador,
            nombre,
            whatsapp,
            email: email || "",
            puesto: puesto || "Asesor Comercial",
            activo: true,
            leadsAsignadosAcumulados: 0,
            leadsCerrados: 0,
            ratioConversion: 0,
            ultimoLeadAsignadoAt: null,
            // Additional metadata if needed
        };

        return await this.repository.create(newAdvisor);
    }

    /**
     * Retrieves the directory of developers and their advisors.
     * @returns {Promise<Array>} Array of developers with an 'advisors' array property.
     */
    async getDirectory() {
        // 1. Fetch all developers
        const developers = await this.catalogRepository.getAllDevelopers();

        // 2. Fetch all advisors 
        const advisors = await this.repository.getAll();

        // 3. Group advisors by developer
        return developers.map(dev => {
            const devAdvisors = advisors.filter(a => a.idDesarrollador === dev.id);
            return {
                ...dev,
                advisors: devAdvisors
            };
        });
    }
    /**
     * Gets advisors for a specific developer.
     * @param {string} developerId 
     * @returns {Promise<Array>} List of advisors
     */
    async getByDeveloper(developerId) {
        if (!developerId) return [];
        return await this.repository.getAdvisorsByDeveloper(developerId);
    }
}
