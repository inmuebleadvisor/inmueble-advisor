import { IMAGES } from '../config/constants';
import { filterCatalog, findClosestByPrice } from '../utils/catalogFilters';
import { enrichModels, applyQualityFilters, hydrateInventoryList } from '../utils/catalogEnricher';

const FALLBACK_IMG = IMAGES.FALLBACK_PROPERTY;

/**
 * Service for handling Catalog Data (Developments and Models).
 * Manages caching and retrieval of inventory.
 * Follows Dependency Injection pattern.
 */
export class CatalogService {
  /**
   * @param {import('../repositories/catalog.repository').CatalogRepository} catalogRepository 
   */
  constructor(catalogRepository) {
    this.repository = catalogRepository;
    this.cacheModelos = null;
    this.lastCityCached = null;
    this.cacheDesarrollos = null;
  }

  /**
   * Retrieves unified models with optional city filtering.
   * @param {string|null} ciudadFilter - City name to filter by
   * @returns {Promise<Array>} List of models
   */
  async obtenerDatosUnificados(ciudadFilter = null) {
    if (this.cacheModelos && this.lastCityCached === ciudadFilter) return this.cacheModelos;

    try {
      let modelos = [];

      if (ciudadFilter) {
        // Option A: Get desarrollos by city, then models by those IDs.
        // This logic was in the original service to optimize (?) or ensure consistency.
        // We will keep the flow but delegate data fetching to repository.
        let devIds = [];

        // Check local cache for desarrollos first if available? 
        // Original code checked cacheDesarrollos.
        if (this.cacheDesarrollos) {
          devIds = this.cacheDesarrollos
            .filter(d => d.ubicacion?.ciudad === ciudadFilter)
            .map(d => d.id);
        } else {
          const desarrollos = await this.repository.getDesarrollosByCiudad(ciudadFilter);
          devIds = desarrollos.map(d => d.id);
        }

        if (devIds.length === 0) {
          console.warn(`⚠️ No se encontraron desarrollos en ${ciudadFilter}`);
          return [];
        }

        modelos = await this.repository.getModelosByDesarrolloIds(devIds);

      } else {
        modelos = await this.repository.getAllModelos();
      }

      this.cacheModelos = modelos;
      this.lastCityCached = ciudadFilter;

      return modelos;
    } catch (error) {
      console.error("Error obteniendo modelos:", error);
      return [];
    }
  }

  /**
   * Gets a list of distinct cities available in the inventory.
   * @returns {Promise<string[]>} Sorted list of city names
   */
  async obtenerCiudadesDisponibles() {
    const desarrollos = await this.obtenerInventarioDesarrollos();
    const ciudades = new Set();
    desarrollos.forEach(d => {
      const city = d.ubicacion?.ciudad;
      if (city) {
        ciudades.add(city.trim());
      }
    });
    return Array.from(ciudades).sort();
  }

  /**
   * Retrieves all developments (cached).
   * @returns {Promise<Array>} List of developments
   */
  async obtenerInventarioDesarrollos() {
    if (this.cacheDesarrollos) return this.cacheDesarrollos;
    try {
      const desarrollos = await this.repository.getAllDesarrollos();
      this.cacheDesarrollos = desarrollos;
      return desarrollos;
    } catch (error) {
      console.error("Error obteniendo desarrollos:", error);
      return [];
    }
  }

  async obtenerTopAmenidades() {
    const desarrollos = await this.obtenerInventarioDesarrollos();
    const conteo = {};
    desarrollos.forEach(d => {
      if (Array.isArray(d.amenidades)) {
        d.amenidades.forEach(am => {
          if (am) {
            const cleanAm = am.trim();
            conteo[cleanAm] = (conteo[cleanAm] || 0) + 1;
          }
        });
      }
    });
    return Object.keys(conteo).sort((a, b) => conteo[b] - conteo[a]).slice(0, 5);
  }

  async obtenerInformacionDesarrollo(id) {
    try {
      const desarrolloData = await this.repository.getDesarrolloById(id);
      if (!desarrolloData) return null;

      const modelos = await this.repository.getModelosByDesarrolloId(id);

      return { ...desarrolloData, modelos };
    } catch (error) {
      console.error("Error en detalle desarrollo:", error);
      return null;
    }
  }

  /**
   * Enriches the advisor's personal inventory list with full catalog data.
   * @param {Array} listaInventarioUsuario - List of minimal inventory items from user profile
   * @returns {Promise<Array>} Hydrated inventory list
   */
  async hidratarInventarioAsesor(listaInventarioUsuario) {
    const catalogo = await this.obtenerInventarioDesarrollos();
    return hydrateInventoryList(listaInventarioUsuario, catalogo);
  }

  // --- Static Wrappers for Backward Compatibility & Clean Access ---

  /**
   * Enriches models with parent development data.
   * @param {Array} models - Raw models
   * @param {Array} developments - Raw developments
   * @returns {Array} Enriched models
   */
  static enrichModels(models, developments) {
    return enrichModels(models, developments);
  }

  /**
   * Applies platform-level quality business rules.
   * @param {Array} models - Enriched models
   * @param {Object} settings - Platform settings (hideNoPrice, hideNoPhotos, etc.)
   * @returns {Array} Models passing quality rules
   */
  static applyQualityFilters(models, settings = {}) {
    return applyQualityFilters(models, settings);
  }

  /**
   * Pure logic to filter catalog items based on criteria.
   * @param {Array} dataMaestra - List of models
   * @param {Array} desarrollos - List of developments
   * @param {Object} filters - Filter criteria
   * @param {string} searchTerm - Search query
   * @returns {Array} Filtered list
   */
  static filterCatalog(dataMaestra, desarrollos, filters, searchTerm) {
    return filterCatalog(dataMaestra, desarrollos, filters, searchTerm);
  }

  static findClosestByPrice(allModels, filters, limit = 3) {
    return findClosestByPrice(allModels, filters, limit);
  }
}

// --- Soporte para Mocks de Tests (Legacy Compatibility) ---
// Estos exports permiten que los tests unitarios antiguos utilicen vi.mock() a nivel de módulo
// sin romper la estructura de la nueva clase.
export const obtenerInventarioDesarrollos = () => { };
export const obtenerTopAmenidades = () => { };
export const obtenerDatosUnificados = () => { };

// --- BACKWARD COMPATIBILITY EXPORTS (Optional/Deprecated) ---
// For now, we allow importing the static functions directly if needed,
// OR we guide consumers to use CatalogService.filterCatalog.
// To avoid "export const" conflicts with class, we attach 'em to class logic or export them as consts if they are outside.
// I kept them INSIDE as static methods. I will NOT export them separately to enforce class usage,
// UNLESS I want to make the refactor strictly 'service' and leave utilities adjacent.
// Plan said: "filterCatalog is logic. I'll make them static methods".
// So I am sticking to static methods.
