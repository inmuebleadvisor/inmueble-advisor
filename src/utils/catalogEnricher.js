import { IMAGES } from '../config/constants';

const FALLBACK_IMG = IMAGES.FALLBACK_PROPERTY;

/**
 * Enriches models with parent development data.
 */
export const enrichModels = (models, developments) => {
    if (!models || !developments) return models || [];
    return models.map(m => {
        const idDev = m.idDesarrollo || m.id_desarrollo;
        if (!idDev) return m;

        const parentDev = developments.find(d => String(d.id) === String(idDev));
        if (!parentDev) return m;

        return {
            ...m,
            colonia: m.colonia || parentDev.ubicacion?.colonia || '',
            zona: m.zona || parentDev.zona || parentDev.ubicacion?.zona || '',
            constructora: m.constructora || parentDev.constructora || '',
            tipoVivienda: m.tipoVivienda || parentDev.tipoVivienda || parentDev.tipo || 'Propiedad',
            ubicacion: {
                ...m.ubicacion,
                colonia: m.ubicacion?.colonia || parentDev.ubicacion?.colonia || '',
                zona: m.ubicacion?.zona || parentDev.ubicacion?.zona || parentDev.zona || ''
            }
        };
    });
};

/**
 * Applies platform-level quality business rules.
 */
export const applyQualityFilters = (models, settings = {}) => {
    if (!models) return [];
    return models.filter(m => {
        if (settings.hideNoPriceModels && (Number(m.precioNumerico) || 0) <= 0) return false;
        if (settings.hideNoPhotosModels) {
            const hasImage = m.imagen || m.media?.render;
            const hasPlans = m.media?.plantasArquitectonicas?.length > 0 || m.plantas?.length > 0;
            const hasVirtual = m.media?.recorridoVirtual || m.recorrido360;
            if (!hasImage && !hasPlans && !hasVirtual) return false;
        }
        return true;
    });
};

/**
 * Hydrates a list of inventory items with full catalog data.
 */
export const hydrateInventoryList = (items, catalogo) => {
    if (!items || items.length === 0) return [];
    return items.map(itemUsuario => {
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
};
