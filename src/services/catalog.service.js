import { normalizar } from '../utils/formatters';
import { IMAGES, STATUS } from '../config/constants';
import { CatalogRepository } from '../repositories/catalog.repository';

const FALLBACK_IMG = IMAGES.FALLBACK_PROPERTY;

export class CatalogService {
  constructor(db) {
    this.repository = new CatalogRepository(db);
    this.cacheModelos = null;
    this.lastCityCached = null;
    this.cacheDesarrollos = null;
  }

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

  async hidratarInventarioAsesor(listaInventarioUsuario) {
    if (!listaInventarioUsuario || listaInventarioUsuario.length === 0) return [];
    const catalogo = await this.obtenerInventarioDesarrollos();

    return listaInventarioUsuario.map(itemUsuario => {
      if (itemUsuario.tipo === 'db') {
        const dataReal = catalogo.find(d => d.id === itemUsuario.idDesarrollo);
        if (dataReal) {
          return {
            ...itemUsuario,
            nombre: dataReal.nombre,
            constructora: dataReal.constructora,
            zona: dataReal.zona || dataReal.ubicacion?.ciudad || 'Zona N/A',
            imagen: dataReal.imagen
          };
        }
      }
      return {
        ...itemUsuario,
        nombre: itemUsuario.nombreManual || 'Desarrollo Desconocido',
        constructora: 'Manual',
        zona: 'N/A',
        imagen: FALLBACK_IMG
      };
    });
  }

  // Static Pure Logic Methods
  static filterCatalog(dataMaestra, desarrollos, filters, searchTerm) {
    if (!dataMaestra) return [];
    const term = normalizar(searchTerm);

    return dataMaestra.filter(item => {
      const desarrollo = desarrollos.find(d => String(d.id) === String(item.idDesarrollo));
      if (item.activo === false) return false;
      if (desarrollo && desarrollo.activo === false) return false;

      const precio = Number(item.precioNumerico) || 0;
      if (!filters.showNoPrice && precio <= 0) return false;
      if (precio > 0) {
        if (precio > filters.precioMax) return false;
        if (filters.precioMin && precio < filters.precioMin) return false;
      }

      const recamaras = Number(item.recamaras) || 0;
      if (filters.habitaciones > 0 && recamaras < filters.habitaciones) return false;

      let hasPreventa = false;
      let hasInmediata = false;

      // Helper to process status value(s)
      const processStatus = (val) => {
        if (!val) return;
        const values = Array.isArray(val) ? val : [val];
        values.forEach(v => {
          if (!v) return;
          const s = String(v).toUpperCase().trim();

          // Check Preventa
          if (
            s === 'PRE-VENTA' ||
            s === 'PREVENTA' ||
            s === STATUS.DEV_PREALE ||
            s.includes('PRE-VENTA')
          ) {
            hasPreventa = true;
          }

          // Check Inmediata
          if (
            s === 'ENTREGA INMEDIATA' ||
            s === 'INMEDIATA' ||
            s === STATUS.DEV_IMMEDIATE ||
            s.includes('ENTREGA INMEDIATA')
          ) {
            hasInmediata = true;
          }
        });
      };

      // 1. Check Desarrollo Status
      if (desarrollo && desarrollo.status) {
        processStatus(desarrollo.status);
      }

      // 2. Check Item (Model) Status - Override or Additive? 
      //    Usually additive or specific to the unit. 
      //    If the model says "Entrega Inmediata" specifically, it should count.
      if (item.status) {
        processStatus(item.status);
      }

      // Legacy field check (just in case)
      if (item.esPreventa) hasPreventa = true;

      // Filter Logic
      // "En caso de estar en blanco o tener el valor 'Sin definir' no debe aparecer si se filtra"
      // This is implicit: if hasPreventa/hasInmediata are false, they won't match the below checks.

      if (filters.status === 'inmediata' && !hasInmediata) return false;
      if (filters.status === 'preventa' && !hasPreventa) return false;

      if (filters.tipo !== 'all') {
        const tipoItem = normalizar(item.tipoVivienda);
        const tipoFiltro = normalizar(filters.tipo);
        if (!tipoItem.includes(tipoFiltro)) {
          if (tipoFiltro === 'departamento' && (tipoItem.includes('loft') || tipoItem.includes('studio'))) return false;
          return false;
        }
      }

      if (filters.amenidad) {
        const amenidadBuscada = normalizar(filters.amenidad);
        const amDesarrollo = Array.isArray(desarrollo?.amenidades) ? desarrollo.amenidades : [];
        const amModelo = Array.isArray(item.amenidades) ? item.amenidades : [];
        const amModeloDesarrollo = Array.isArray(item.amenidadesDesarrollo) ? item.amenidadesDesarrollo : [];
        const todasAmenidades = [...new Set([...amDesarrollo, ...amModelo, ...amModeloDesarrollo])];
        const tieneAmenidad = todasAmenidades.some(a => normalizar(a).includes(amenidadBuscada));
        if (!tieneAmenidad) return false;
      }

      if (term) {
        const keywordsModelo = Array.isArray(item.keywords) ? item.keywords : [];
        const keywordsDesarrollo = desarrollo && Array.isArray(desarrollo.keywords) ? desarrollo.keywords : [];
        const allKeywords = [...keywordsModelo, ...keywordsDesarrollo];

        if (allKeywords.length > 0) {
          const match = allKeywords.some(k => normalizar(k).includes(term));
          if (!match) {
            const amenidadesTexto = [...(Array.isArray(item.amenidadesDesarrollo) ? item.amenidadesDesarrollo : []), ...(desarrollo?.amenidades || [])].join(' ');
            const searchTarget = `
                   ${normalizar(item.nombre)} ${normalizar(item.nombre_modelo)} ${normalizar(item.nombreDesarrollo)}
                   ${normalizar(item.constructora)} ${normalizar(item.tipoVivienda)}
                   ${normalizar(item.colonia)} ${normalizar(item.ciudad)}
                   ${normalizar(item.zona)} ${normalizar(amenidadesTexto)}
                   ${normalizar(desarrollo?.nombre || '')}
                 `;
            if (!searchTarget.includes(term)) return false;
          }
        } else {
          const amenidadesTexto = [...(Array.isArray(item.amenidadesDesarrollo) ? item.amenidadesDesarrollo : []), ...(desarrollo?.amenidades || [])].join(' ');
          const searchTarget = `
              ${normalizar(item.nombre)} ${normalizar(item.nombre_modelo)} ${normalizar(item.nombreDesarrollo)}
              ${normalizar(item.constructora)} ${normalizar(item.tipoVivienda)}
              ${normalizar(item.colonia)} ${normalizar(item.ciudad)}
              ${normalizar(item.zona)} ${normalizar(amenidadesTexto)}
              ${normalizar(desarrollo?.nombre || '')}
            `;
          if (!searchTarget.includes(term)) return false;
        }
      }
      return true;
    });
  }

  static findClosestByPrice(allModels, filters, limit = 3) {
    if (!allModels || allModels.length === 0) return [];
    let targetPrice = 0;
    if (filters.precioMax < 20000000 && filters.precioMax > 0) {
      if (filters.precioMin > 0) {
        targetPrice = (filters.precioMin + filters.precioMax) / 2;
      } else {
        targetPrice = filters.precioMax;
      }
    }

    const candidates = allModels.filter(m => {
      if (!m.activo) return false;
      const p = m.precioNumerico || 0;
      return p > 0;
    });

    if (candidates.length === 0) return [];

    const IS_DEFAULT_MAX = filters.precioMax >= 15000000;
    if (targetPrice === 0 || (filters.precioMin === 0 && IS_DEFAULT_MAX)) {
      return candidates.sort((a, b) => (a.precioNumerico || 0) - (b.precioNumerico || 0)).slice(0, limit);
    }

    return candidates.sort((a, b) => {
      const distA = Math.abs((a.precioNumerico || 0) - targetPrice);
      const distB = Math.abs((b.precioNumerico || 0) - targetPrice);
      return distA - distB;
    }).slice(0, limit);
  }
}

// --- BACKWARD COMPATIBILITY EXPORTS (Optional/Deprecated) ---
// For now, we allow importing the static functions directly if needed,
// OR we guide consumers to use CatalogService.filterCatalog.
// To avoid "export const" conflicts with class, we attach 'em to class logic or export them as consts if they are outside.
// I kept them INSIDE as static methods. I will NOT export them separately to enforce class usage,
// UNLESS I want to make the refactor strictly 'service' and leave utilities adjacent.
// Plan said: "filterCatalog is logic. I'll make them static methods".
// So I am sticking to static methods.
