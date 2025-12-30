import { IMAGES } from '../config/constants';

const FALLBACK_IMG = IMAGES.FALLBACK_PROPERTY;
const UNRELIABLE_PLACEHOLDER = "via.placeholder.com";

export const parseCoord = (val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

export const procesarImagenes = (data) => {
    let listaImagenes = [];
    let portada = null;

    if (data.media) {
        if (data.media.cover) {
            portada = data.media.cover;
            listaImagenes.push(portada);
        }
        if (Array.isArray(data.media.gallery)) {
            listaImagenes = [...listaImagenes, ...data.media.gallery];
        }
    }
    else if (data.multimedia) {
        if (data.multimedia.portada) {
            portada = data.multimedia.portada;
            if (!listaImagenes.includes(portada)) listaImagenes.push(portada);
        }
        if (Array.isArray(data.multimedia.galeria)) {
            listaImagenes = [...listaImagenes, ...data.multimedia.galeria];
        }
    }
    else if (data.imagen) {
        portada = data.imagen;
        listaImagenes.push(data.imagen);
    }

    if (listaImagenes.length === 0 && data.media && Array.isArray(data.media.plantasArquitectonicas) && data.media.plantasArquitectonicas.length > 0) {
        listaImagenes = [...data.media.plantasArquitectonicas];
        if (!portada) portada = listaImagenes[0];
    }

    listaImagenes = listaImagenes.filter(url =>
        url && typeof url === 'string' && url.length > 10 && !url.includes(UNRELIABLE_PLACEHOLDER) && !url.includes('static.wixstatic.com')
    );
    listaImagenes = [...new Set(listaImagenes)];

    if (listaImagenes.length === 0) {
        listaImagenes.push(FALLBACK_IMG);
        if (!portada) portada = FALLBACK_IMG;
    }

    if (!portada && listaImagenes.length > 0) {
        portada = listaImagenes[0];
    }

    return { imagen: portada, imagenes: listaImagenes };
};
