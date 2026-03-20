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
     * Extrae las características físicas del modelo con lectura defensiva.
     * Fuente de verdad única para UI (ModelHeaderInfo) y generador de PDF.
     * Soporta campos en la raíz del objeto Y anidados en `caracteristicas.*`.
     *
     * @param {Object} modelo - Objeto del modelo de Firestore
     * @returns {{ recamaras: number, banos: number|string, construccion: number, terreno: number }}
     */
    getCaracteristicas(modelo) {
        if (!modelo) return { recamaras: 0, banos: 0, construccion: 0, terreno: 0 };

        const recamaras    = modelo.recamaras    ?? modelo.caracteristicas?.recamaras    ?? 0;
        const banosRaw     = modelo.banos        ?? modelo.caracteristicas?.banos        ?? 0;
        const construccion = modelo.m2
                          || modelo.superficieConstruccion
                          || modelo.caracteristicas?.metrosConstruccion
                          || 0;
        const terreno      = modelo.superficieTotal
                          || modelo.terreno
                          || modelo.caracteristicas?.metrosTerreno
                          || 0;

        // Baños: si tiene fracción .5, mostrarlo como "1.5"
        const banos = banosRaw % 1 !== 0 ? `${Math.floor(banosRaw)}.5` : banosRaw;

        return { recamaras, banos, construccion, terreno };
    }

    /**
     * Resuelve el texto descriptivo y las amenidades del modelo.
     * Fuente de verdad única para UI (ModelDescription) y generador de PDF.
     *
     * @param {Object} modelo - Objeto del modelo de Firestore
     * @returns {{ descripcion: string, amenidades: string[] }}
     */
    getDescripcionYAmenidades(modelo) {
        if (!modelo) return { descripcion: '', amenidades: [] };

        const descripcion = modelo.descripcion
            ? modelo.descripcion
            : `Modelo ${modelo.nombre_modelo}: Una excelente propiedad diseñada con gran aprovechamiento de sus espacios y luz natural. Ideal para quienes buscan seguridad y confort en una zona de alta plusvalía.`;

        const amenidades = [];
        if (Array.isArray(modelo.amenidades) && modelo.amenidades.length > 0) {
            amenidades.push(...modelo.amenidades);
        }
        const estacionamientos = modelo.estacionamientos || modelo.caracteristicas?.estacionamientos;
        if (
            estacionamientos > 0 &&
            !amenidades.some(a => a.toLowerCase().includes('estacionamiento') || a.toLowerCase().includes('cochera'))
        ) {
            amenidades.push(`Cochera para ${estacionamientos} auto${estacionamientos > 1 ? 's' : ''}`);
        }

        return { descripcion, amenidades };
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
