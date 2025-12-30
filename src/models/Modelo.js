import { procesarImagenes, parseCoord } from '../utils/dataHelpers';

export const mapModelo = (docSnapshot) => {
    const data = docSnapshot.data();
    const imgs = procesarImagenes(data);

    let precioFinal = 0;
    if (data.precios && typeof data.precios.base === 'number') {
        precioFinal = data.precios.base;
    } else if (data.precioNumerico) {
        precioFinal = Number(data.precioNumerico);
    }

    return {
        ...data,
        id: docSnapshot.id,
        idDesarrollo: data.idDesarrollo || data.id_desarrollo || data.desarrollo_id || '',
        nombre_modelo: data.nombreModelo || data.nombre_modelo || 'Modelo',
        nombreDesarrollo: data.nombreDesarrollo || '',
        constructora: data.constructora || '',
        precioNumerico: precioFinal,
        precios: data.precios || {},
        imagen: imgs.imagen,
        imagenes: imgs.imagenes,
        recamaras: Number(data.recamaras) || 0,
        banos: Number(data.banos) || 0,
        niveles: Number(data.niveles) || 0,
        cajones: Number(data.cajones) || 0,
        m2: Number(data.m2) || 0,
        terreno: Number(data.terreno) || 0,
        zona: data.ubicacion?.zona || '',
        ciudad: data.ubicacion?.ciudad || '',
        colonia: data.ubicacion?.colonia || '',
        latitud: parseCoord(data.ubicacion?.latitud),
        longitud: parseCoord(data.ubicacion?.longitud),
        ubicacion: data.ubicacion || {},
        amenidades: Array.isArray(data.amenidades) ? data.amenidades : [],
        amenidadesDesarrollo: Array.isArray(data.amenidadesDesarrollo) ? data.amenidadesDesarrollo : [],
        keywords: Array.isArray(data.keywords) ? data.keywords : [],
        tipoVivienda: data.tipoVivienda || 'Propiedad',
        esPreventa: (data.esPreventa === true || data.esPreventa === 'true' || data.esPreventa === 1),
        infoComercial: data.infoComercial || {},
        activo: data.activo !== undefined ? data.activo !== false : (data.ActivoModelo !== false),
        plantas: (data.media && Array.isArray(data.media.plantasArquitectonicas)) ? data.media.plantasArquitectonicas : []
    };
};
