import { IMAGES } from '../../config/constants';

/**
 * @class ModelPresentationService
 * @description Servicio puro para manejar la lógica de presentación del detalle de modelos.
 * Separa las reglas de negocio, formateo y mapeo de datos de los componentes React (SRP).
 */
export class ModelPresentationService {

    /**
     * Resuelve el arreglo unificado de imágenes y videos prioritarios para el carrusel.
     * @param {Object} modelo 
     * @returns {Array<{url: string, type: 'video' | 'image'}>}
     */
    getGaleriaImagenes(modelo) {
        if (!modelo) return [];

        const items = (modelo.imagenes || []).map(url => ({ url, type: 'image' }));

        const videoPrincipal = modelo.media?.video || modelo.media?.videoPromocional || modelo.video;
        if (videoPrincipal) {
            items.unshift({ url: videoPrincipal, type: 'video' });
        }

        if (items.length === 0) {
            items.push({ url: IMAGES.FALLBACK_PROPERTY, type: 'image' });
        }

        return items;
    }

    /**
     * Formatea un valor numérico a moneda MXN estándar.
     * @param {number|string} val 
     * @returns {string} Precio formateado o 'Precio Pendiente'
     */
    formatoMoneda(val) {
        if (val === null || val === undefined || isNaN(val)) {
            return 'Precio Pendiente';
        }
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            maximumFractionDigits: 0
        }).format(val);
    }

    /**
     * Construye el payload mapeado requerido por el componente MortgageSimulatorModal.
     * @param {Object} modelo 
     * @param {Object} desarrollo 
     * @returns {Object} Payload estructurado para el simulador
     */
    buildSimulatorPayload(modelo, desarrollo) {
        if (!modelo) return {};

        return {
            title: modelo.nombre_modelo || 'Modelo',
            developmentName: desarrollo?.nombre || '',
            subtitle: modelo.tipoVivienda || 'Vivienda',
            deliveryStatus: typeof modelo.esPreventa === 'boolean'
                ? (modelo.esPreventa ? 'Preventa' : 'Entrega Inmediata')
                : '',
            image: modelo.imagenes?.[0] || '',
            bedrooms: modelo.recamaras,
            bathrooms: modelo.banos,
            area: modelo.m2 || modelo.superficieConstruccion || modelo.superficieTotal,
            url: window?.location?.href || ''
        };
    }
}
