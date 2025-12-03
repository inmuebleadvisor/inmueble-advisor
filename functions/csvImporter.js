// functions/csvImporter.js
// ÚLTIMA MODIFICACION: 02/12/2025

const { Timestamp } = require("firebase-admin/firestore");

// --- UTILIDADES ---
const parseArray = (str) => (!str ? [] : str.split('|').map(s => s.trim()).filter(s => s !== ""));
const parseNumber = (str) => {
    if (!str) return 0;
    const num = parseFloat(String(str).replace(/[$,]/g, ''));
    return isNaN(num) ? 0 : num;
};
const parseDate = (str) => {
    if (!str) return null;
    try { return Timestamp.fromDate(new Date(str)); } catch (e) { return null; }
};

// --- MAPEO DESARROLLOS ---
const mapearDesarrolloV2 = (row) => {
    // Cálculo automático de faltantes
    const totales = parseNumber(row.unidades_totales);
    const vendidas = parseNumber(row.unidades_vendidas);
    const disponibles = totales - vendidas;

    return {
        id: row.id, 
        nombre: row.nombre,
        status: row.status || 'Entrega Inmediata', // Texto corregido
        constructora: row.constructora || '',
        descripcion: row.descripcion || '',
        keywords: parseArray(row.keywords),

        ubicacion: {
            calle: row.calle || '',
            colonia: row.colonia || '',
            localidad: row.localidad || row.ciudad || '', // Localidad nueva
            ciudad: row.ciudad || '',
            estado: row.estado || '',
            zona: row.zona || '',
            latitud: parseNumber(row.latitud),
            longitud: parseNumber(row.longitud)
        },

        precios: {
            desde: parseNumber(row.precio_desde),
            moneda: 'MXN'
        },
        financiamiento: {
            aceptaCreditos: parseArray(row.fin_creditos),
            apartadoMinimo: parseNumber(row.fin_apartado),
            engancheMinimoPorcentaje: parseNumber(row.fin_enganche)
        },

        infoComercial: {
            fechaEntrega: parseDate(row.fecha_entrega),
            fechaInicioVenta: parseDate(row.fecha_inicio),
            unidadesTotales: totales,
            unidadesVendidas: vendidas,
            unidadesDisponibles: disponibles < 0 ? 0 : disponibles, // Evitar negativos
            cantidadModelos: parseNumber(row.num_modelos),
            plusvaliaPromedio: parseNumber(row.plusvalia_pct)
        },

        amenidades: parseArray(row.amenidades),
        
        media: {
            cover: row.img_cover || null,
            gallery: parseArray(row.img_galeria),
            brochure: row.url_brochure || null, // URL PDF
            video: row.url_video || null
        },

        legal: { regimenPropiedad: 'Condominio' }, // Default por ahora
        scoreDesarrollo: parseNumber(row.score),
        entorno: [] 
    };
};

// --- MAPEO MODELOS ---
const mapearModeloV2 = (row) => {
    const rawId = row.id || `${row.id_desarrollo}-${row.nombre_modelo.replace(/\s+/g, '-').toLowerCase()}`;

    return {
        id: rawId,
        idDesarrollo: row.id_desarrollo,
        nombreModelo: row.nombre_modelo,
        tipoVivienda: row.tipo_vivienda || 'Casas',
        // 'esPreventa' ELIMINADO

        precios: {
            base: parseNumber(row.precio_inicial),
            inicial: parseNumber(row.precio_inicial),
            maximo: parseNumber(row.precio_max) || parseNumber(row.precio_inicial),
            metroCuadrado: parseNumber(row.precio_m2),
            mantenimientoMensual: parseNumber(row.mantenimiento),
            moneda: 'MXN'
        },

        infoComercial: {
            unidadesVendidas: parseNumber(row.unidades_vendidas),
            plusvaliaEstimada: parseNumber(row.plusvalia_pct),
            fechaInicioVenta: parseDate(row.fecha_inicio)
        },

        recamaras: parseNumber(row.recamaras),
        banos: parseNumber(row.banos),
        niveles: parseNumber(row.niveles),
        cajones: parseNumber(row.cajones),
        m2: parseNumber(row.m2_const),
        terreno: parseNumber(row.m2_terreno),
        
        acabados: {
            cocina: row.acabado_cocina || '',
            pisos: row.acabado_pisos || ''
        },
        amenidades: parseArray(row.amenidades),

        media: {
            cover: row.img_cover || null,
            gallery: parseArray(row.img_galeria),
            plantasArquitectonicas: parseArray(row.url_plantas), // URLs Planos
            recorridoVirtual: row.url_tour || null,
            videoPromocional: row.url_video || null
        },
        
        promociones: [],
        
        ubicacion: { // Copia del CSV o defaults (se puede mejorar luego)
            latitud: 0, 
            longitud: 0 
        }
    };
};

module.exports = { mapearDesarrolloV2, mapearModeloV2 };