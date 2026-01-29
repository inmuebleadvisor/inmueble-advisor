
import { UserRepository } from '../repositories/user.repository';
import { LeadRepository } from '../repositories/lead.repository';
import { CatalogRepository } from '../repositories/catalog.repository';
import { cleanField, parseDate } from '../utils/exportUtils';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

/**
 * Service for Administrative Management
 * Responsibility: Access to global data (Users, Leads, Inventory) and permission control.
 * Refactored: Includes data mapping for reports to decouple UI from data structures.
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

    // --- 2. REPORT MAPPERS (DECOUPLING) ---

    /**
     * Orchestrates the development data for CSV export.
     */
    async getDesarrollosExportData() {
        const docs = await this.getAllDesarrollos();
        const headers = [
            "id", "nombre", "status", "constructora", "geografiaId",
            "ubicacion.calle", "ubicacion.colonia", "ubicacion.ciudad",
            "ubicacion.estado", "ubicacion.zona", "ubicacion.latitud",
            "ubicacion.longitud", "precios.desde", "stats.ofertaTotal",
            "stats.viviendasxVender", "infoComercial.fechaInicioVenta",
            "infoComercial.unidadesTotales", "infoComercial.unidadesVendidas",
            "infoComercial.unidadesDisponibles", "keywords", "caracteristicas.amenidades"
        ];

        const rows = docs.map(data => {
            const ubicacion = data.ubicacion || {};
            const info = data.info_comercial || {};
            const stats = data.stats || {};
            const amenidadesStr = Array.isArray(data.amenidades) ? data.amenidades.join(' | ') : '';
            const keywordsStr = Array.isArray(data.keywords) ? data.keywords.join(' | ') : '';

            return [
                cleanField(data.id),
                cleanField(data.nombre),
                cleanField(data.active ? 'activo' : 'inactivo'),
                cleanField(data.constructora),
                cleanField(data.geografiaId),
                cleanField(ubicacion.calle),
                cleanField(ubicacion.colonia),
                cleanField(ubicacion.ciudad),
                cleanField(ubicacion.estado),
                cleanField(data.zona || ubicacion.zona),
                cleanField(data.latitud),
                cleanField(data.longitud),
                cleanField(data.precioDesde),
                cleanField(stats.ofertaTotal),
                cleanField(stats.viviendasxVender),
                cleanField(parseDate(info.fechaInicioVenta)),
                cleanField(info.unidadesTotales),
                cleanField(info.unidadesVendidas),
                cleanField(info.unidadesDisponibles),
                cleanField(keywordsStr),
                cleanField(amenidadesStr)
            ].join(',');
        });

        return { headers, rows };
    }

    /**
     * Orchestrates the model data for CSV export.
     */
    async getModelosExportData() {
        const docs = await this.getAllModelos();
        const headers = [
            "id", "idDesarrollo", "nombreModelo", "nombreDesarrollo",
            "tipoVivienda", "esPreventa", "precios.base", "precios.mantenimientoMensual",
            "recamaras", "banos", "niveles", "cajones", "m2", "terreno",
            "frente", "fondo", "ubicacion.latitud", "ubicacion.longitud", "amenidades"
        ];

        const rows = docs.map(data => {
            const amenidadesStr = Array.isArray(data.amenidades) ? data.amenidades.join(' | ') : '';

            return [
                cleanField(data.id),
                cleanField(data.idDesarrollo),
                cleanField(data.nombre_modelo),
                cleanField(data.nombreDesarrollo),
                cleanField(data.tipoVivienda),
                cleanField(data.esPreventa ? 'SI' : 'NO'),
                cleanField(data.precioNumerico),
                cleanField(data.precios?.mantenimientoMensual),
                cleanField(data.recamaras),
                cleanField(data.banos),
                cleanField(data.niveles),
                cleanField(data.cajones),
                cleanField(data.m2),
                cleanField(data.terreno),
                cleanField(data.frente || data.specs?.frente || ''), // Fixed gap identified in audit
                cleanField(data.fondo || data.specs?.fondo || ''),
                cleanField(data.latitud),
                cleanField(data.longitud),
                cleanField(amenidadesStr)
            ].join(',');
        });

        return { headers, rows };
    }

    /**
     * Promotes any user to advisor.
     * Uses the secure promoteToAdvisor Cloud Function.
     */
    async promoteUser(uid) {
        try {
            const promoteFn = httpsCallable(functions, 'promoteToAdvisor');
            await promoteFn({ uid });
            return true;
        } catch (error) {
            console.error("AdminService.promoteUser error:", error);
            throw error;
        }
    }
}
