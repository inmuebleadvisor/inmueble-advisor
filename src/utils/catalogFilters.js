import { normalizar } from './formatters';
import { STATUS } from '../config/constants';

/**
 * Pure logic to filter catalog items based on criteria.
 */
export const filterCatalog = (dataMaestra, desarrollos, filters, searchTerm) => {
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

        const processStatus = (val) => {
            if (!val) return;
            const values = Array.isArray(val) ? val : [val];
            values.forEach(v => {
                if (!v) return;
                const s = String(v).toUpperCase().trim();
                if (s === 'PRE-VENTA' || s === 'PREVENTA' || s === STATUS.DEV_PREALE || s.includes('PRE-VENTA')) {
                    hasPreventa = true;
                }
                if (s === 'ENTREGA INMEDIATA' || s === 'INMEDIATA' || s === STATUS.DEV_IMMEDIATE || s.includes('ENTREGA INMEDIATA')) {
                    hasInmediata = true;
                }
            });
        };

        if (desarrollo && desarrollo.status) processStatus(desarrollo.status);
        if (item.status) processStatus(item.status);
        if (item.esPreventa) hasPreventa = true;

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
                    const searchTarget = `${normalizar(item.nombre)} ${normalizar(item.nombre_modelo)} ${normalizar(item.nombreDesarrollo)} ${normalizar(item.constructora)} ${normalizar(item.tipoVivienda)} ${normalizar(item.colonia)} ${normalizar(item.ciudad)} ${normalizar(item.zona)} ${normalizar(amenidadesTexto)} ${normalizar(desarrollo?.nombre || '')}`;
                    if (!searchTarget.includes(term)) return false;
                }
            } else {
                const amenidadesTexto = [...(Array.isArray(item.amenidadesDesarrollo) ? item.amenidadesDesarrollo : []), ...(desarrollo?.amenidades || [])].join(' ');
                const searchTarget = `${normalizar(item.nombre)} ${normalizar(item.nombre_modelo)} ${normalizar(item.nombreDesarrollo)} ${normalizar(item.constructora)} ${normalizar(item.tipoVivienda)} ${normalizar(item.colonia)} ${normalizar(item.ciudad)} ${normalizar(item.zona)} ${normalizar(amenidadesTexto)} ${normalizar(desarrollo?.nombre || '')}`;
                if (!searchTarget.includes(term)) return false;
            }
        }
        return true;
    });
};

/**
 * Finds closest models to a target price.
 */
export const findClosestByPrice = (allModels, filters, limit = 3) => {
    if (!allModels || allModels.length === 0) return [];
    let targetPrice = 0;
    if (filters.precioMax < 20000000 && filters.precioMax > 0) {
        targetPrice = filters.precioMin > 0 ? (filters.precioMin + filters.precioMax) / 2 : filters.precioMax;
    }

    const candidates = allModels.filter(m => m.activo && (m.precioNumerico || 0) > 0);
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
};
