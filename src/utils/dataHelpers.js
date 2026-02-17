import { IMAGES } from '../config/constants';

const FALLBACK_IMG = IMAGES.FALLBACK_PROPERTY;
const UNRELIABLE_PLACEHOLDER = "via.placeholder.com";
const BLOCKED_DOMAINS = [UNRELIABLE_PLACEHOLDER, 'static.wixstatic.com'];

/**
 * Parsea una coordenada a número.
 * @param {any} val - Valor a parsear.
 * @returns {number} Coordenada parseada o 0.
 */
export const parseCoord = (val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

/**
 * Valida si una URL de imagen es aceptable.
 * @param {string} url - URL a validar.
 * @returns {boolean} True si es válida.
 */
const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string' || url.length <= 10) return false;
    return !BLOCKED_DOMAINS.some(domain => url.includes(domain));
};

/**
 * Extrae imágenes de diferentes estructuras de datos posibles.
 * @param {object} data - Objeto de datos de propiedad.
 * @returns {object} { portada, galeria }
 */
const extractRawImages = (data) => {
    const m = data.media || data.multimedia;
    if (!m) return { portada: data.imagen || null, galeria: [] };

    return {
        portada: m.cover || m.portada,
        galeria: Array.isArray(m.gallery || m.galeria) ? (m.gallery || m.galeria) : []
    };
};

/**
 * Procesa y normaliza las imágenes de una propiedad.
 * @param {object} data - Datos de la propiedad.
 * @returns {object} { imagen (portada), imagenes (lista completa) }
 */
export const procesarImagenes = (data) => {
    let { portada, galeria } = extractRawImages(data);
    let listaImagenes = portada ? [portada, ...galeria] : [...galeria];

    const plantas = data.media?.plantasArquitectonicas;
    if (listaImagenes.length === 0 && plantas?.length > 0) {
        listaImagenes = [...plantas];
        portada = listaImagenes[0];
    }

    listaImagenes = [...new Set(listaImagenes.filter(isValidImageUrl))];

    if (listaImagenes.length === 0) {
        listaImagenes = [FALLBACK_IMG];
        portada = FALLBACK_IMG;
    }

    if (!isValidImageUrl(portada) || !listaImagenes.includes(portada)) {
        portada = listaImagenes[0];
    }

    return { imagen: portada, imagenes: listaImagenes };
};
