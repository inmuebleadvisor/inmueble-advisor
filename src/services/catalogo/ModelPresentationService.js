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
        const niveles      = modelo.niveles
                          || modelo.caracteristicas?.niveles
                          || 0;

        // Baños: si tiene fracción .5, mostrarlo como "1.5"
        const banos = banosRaw % 1 !== 0 ? `${Math.floor(banosRaw)}.5` : banosRaw;

        return { recamaras, banos, construccion, terreno, niveles };
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
            : `Información sobre ${modelo.nombre_modelo || 'este modelo'} no disponible por el momento. Solicite detalles con nuestro asesor.`;

        const amenidades = [];
        if (Array.isArray(modelo.amenidades) && modelo.amenidades.length > 0) {
            amenidades.push(...modelo.amenidades);
        }
        
        // Evitar el supuesto de que se llama 'estacionamientos' cuando la BD dice 'cajones'
        const estacionamientos = modelo.cajones || modelo.estacionamientos || modelo.caracteristicas?.estacionamientos;
        if (
            estacionamientos > 0 &&
            !amenidades.some(a => a.toLowerCase().includes('estacionamiento') || a.toLowerCase().includes('cochera'))
        ) {
            amenidades.push(`Cochera para ${estacionamientos} auto${estacionamientos > 1 ? 's' : ''}`);
        }

        return { descripcion, amenidades };
    }

    /**
     * Extrae de forma segura los highlights o ganchos de venta de un modelo.
     * @param {Object} modelo 
     * @returns {string[]}
     */
    getHighlights(modelo) {
        if (!modelo || !Array.isArray(modelo.highlights)) return [];
        return modelo.highlights.filter(h => typeof h === 'string' && h.trim() !== '');
    }

    /**
     * Extrae los textos promocionales o comerciales del objeto infoComercial.
     * Devuelve solo los valores que son strings descriptivas para inyectar en conversión.
     * @param {Object} modelo 
     * @param {Object} desarrollo 
     * @returns {string[]}
     */
    getInfoComercial(modelo, desarrollo = null) {
        if (!modelo) return [];
        const modelInfo = modelo.infoComercial || {};
        const devInfo = desarrollo?.info_comercial || {};
        
        const bullets = [];
        
        // No suponemos llaves estáticas; recolectamos cualquier string de valor promo/texto
        // que no sea un id o fecha técnica, con fallback al desarrollo padre.
        const knownKeys = ['promocion', 'texto_venta', 'enganche_texto', 'apartado_texto', 'nota', 'bono'];
        
        knownKeys.forEach(key => {
            const val = modelInfo[key] || devInfo[key];
            if (val && typeof val === 'string' && val.trim() !== '') {
                bullets.push(val.trim());
            }
        });

        // 2. Montos numéricos o mixtos (Apartado, Enganche) con fallback al Desarrollo
        const apartadoRaw = modelInfo.apartado || modelo.apartado || modelInfo.monto_apartado || modelo.precios?.apartado 
                            || devInfo.apartado || devInfo.monto_apartado || desarrollo?.precios?.apartado
                            || modelo.financiamiento?.apartadoMinimo || desarrollo?.financiamiento?.apartadoMinimo;
                            
        if (apartadoRaw) {
            if (typeof apartadoRaw === 'number') {
                const formateado = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(apartadoRaw);
                bullets.push(`Aparta desde ${formateado}`);
            } else if (typeof apartadoRaw === 'string') {
                bullets.push(`Apartado: ${apartadoRaw}`);
            }
        }

        const engancheRaw = modelInfo.enganche || modelo.enganche || modelo.precios?.enganche 
                            || devInfo.enganche || desarrollo?.enganche || desarrollo?.precios?.enganche;
                            
        if (engancheRaw) {
            if (typeof engancheRaw === 'number' && engancheRaw <= 1) {
                bullets.push(`Enganche desde ${Math.round(engancheRaw * 100)}%`);
            } else if (typeof engancheRaw === 'number' && engancheRaw > 1) {
                const formateado = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(engancheRaw);
                bullets.push(`Enganche desde ${formateado}`);
            } else if (typeof engancheRaw === 'string') {
                bullets.push(`Enganche: ${engancheRaw}`);
            }
        }

        return [...new Set(bullets)]; // Deduplicación segura
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
