
import { UserRepository } from '../repositories/user.repository';
import { LeadRepository } from '../repositories/lead.repository';
import { CatalogRepository } from '../repositories/catalog.repository';

/**
 * Service for Administrative Management
 * Responsibility: Access to global data (Users, Leads, Inventory) and permission control.
 */
export class AdminService {
    /**
     * @param {UserRepository} userRepository 
     * @param {LeadRepository} leadRepository 
     * @param {CatalogRepository} catalogRepository 
     */
    constructor(userRepository, leadRepository, catalogRepository) {
        this.userRepository = userRepository;
        this.leadRepository = leadRepository;
        this.catalogRepository = catalogRepository;
    }

    // --- 1. GLOBAL DATA GETTERS ---

    /**
     * Get all users (Advisors and Clients)
     */
    async getAllUsers() {
        try {
            return await this.userRepository.getAllUsers();
        } catch (error) {
            console.error("Error fetching all users:", error);
            return [];
        }
    }

    /**
     * Get all leads for general metrics
     */
    async getAllLeads() {
        try {
            return await this.leadRepository.getAllLeads();
        } catch (error) {
            console.error("Error fetching all leads:", error);
            return [];
        }
    }

    /**
     * Get all developments
     */
    async getAllDesarrollos() {
        try {
            return await this.catalogRepository.getAllDesarrollos();
        } catch (error) {
            console.error("Error fetching desarrollos:", error);
            return [];
        }
    }

    /**
     * Get all models (for global reports)
     */
    async getAllModelos() {
        try {
            return await this.catalogRepository.getAllModelos();
        } catch (error) {
            console.error("Error fetching modelos:", error);
            return [];
        }
    }
}
