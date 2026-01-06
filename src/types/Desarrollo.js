import { procesarImagenes, parseCoord } from '../utils/dataHelpers';

export const mapDesarrollo = (docSnapshot) => {
    const data = docSnapshot.data();
    const imgs = procesarImagenes(data);

    return {
        ...data,
        id: docSnapshot.id,
        nombre: data.nombre || 'Desarrollo',
        info_comercial: data.infoComercial || data.info_comercial || {},
        amenidades: Array.isArray(data.amenidades) ? data.amenidades : [],
        keywords: Array.isArray(data.keywords) ? data.keywords : [],
        precioDesde: (data.precios && data.precios.desde) ? data.precios.desde : (data.precioDesde || 0),
        precios: data.precios || {},
        imagen: imgs.imagen,
        multimedia: {
            portada: imgs.imagen,
            galeria: imgs.imagenes,
            video: data.media?.video || data.multimedia?.video || null,
            brochure: data.media?.brochure || data.multimedia?.brochure || null
        },
        ubicacion: data.ubicacion || {},
        zona: data.ubicacion?.zona || '',
        latitud: parseCoord(data.ubicacion?.latitud),
        longitud: parseCoord(data.ubicacion?.longitud),
        activo: data.activo !== false
    };
};
