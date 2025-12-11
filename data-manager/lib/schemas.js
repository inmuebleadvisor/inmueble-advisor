import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';

// --- UTILS & TRANSFORMS ---

const parseBoolean = (val) => {
    if (typeof val === 'boolean') return val;
    if (val === undefined || val === null || val === '') return false;
    const s = String(val).trim().toLowerCase();
    return ['true', '1', 'yes', 'si', 'on', 'activo', 'active'].includes(s);
};

const parseNumber = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const num = parseFloat(String(val).replace(/[$,]/g, ''));
    return isNaN(num) ? 0 : num;
};

const parseArray = (val) => {
    if (Array.isArray(val)) return val;
    if (!val) return [];
    return String(val).split('|').map(s => s.trim()).filter(s => s !== "");
};

const parseDate = (val) => {
    if (val instanceof Timestamp) return val;
    if (!val) return null;
    try {
        const date = new Date(val);
        if (isNaN(date.getTime())) return null;
        return Timestamp.fromDate(date);
    } catch (e) {
        return null;
    }
};

// --- SCHEMAS ---

export const UbicacionSchema = z.object({
    calle: z.string().optional(),
    colonia: z.string().optional(),
    localidad: z.string().optional(),
    ciudad: z.string().optional(),
    estado: z.string().optional(),
    zona: z.string().optional(),
    localidad: z.string().optional(),
    latitud: z.preprocess(parseNumber, z.number().optional()),
    longitud: z.preprocess(parseNumber, z.number().optional()),
});

export const FinanciamientoSchema = z.object({
    aceptaCreditos: z.preprocess(parseArray, z.array(z.string()).optional()),
    apartadoMinimo: z.preprocess(parseNumber, z.number().optional()),
    engancheMinimoPorcentaje: z.preprocess(parseNumber, z.number().optional()),
});

export const InfoComercialDesarrolloSchema = z.object({
    cantidadModelos: z.preprocess(parseNumber, z.number().optional()),
    fechaEntrega: z.preprocess(parseDate, z.custom((val) => val === null || val instanceof Timestamp).optional()),
    fechaInicioVenta: z.preprocess(parseDate, z.custom((val) => val === null || val instanceof Timestamp).optional()),
    plusvaliaPromedio: z.preprocess(parseNumber, z.number().optional()),
    unidadesTotales: z.preprocess(parseNumber, z.number().optional()),
    unidadesVendidas: z.preprocess(parseNumber, z.number().optional()),
    unidadesDisponibles: z.preprocess(parseNumber, z.number().optional()),
});

export const AnalisisIASchema = z.object({
    resumen: z.string().optional(),
    puntosFuertes: z.preprocess(parseArray, z.array(z.string()).optional()),
    puntosDebiles: z.preprocess(parseArray, z.array(z.string()).optional()),
});

export const MediaDesarrolloSchema = z.object({
    cover: z.string().optional(),
    gallery: z.preprocess(parseArray, z.array(z.string()).optional()),
    brochure: z.string().optional(),
    video: z.string().optional(),
});

export const DesarrolloSchema = z.object({
    id: z.string().optional(), // Can be optional on input (auto-generated or linked)
    nombre: z.string().min(1, "Nombre es requerido"),
    descripcion: z.string().optional(),
    constructora: z.string().optional(),
    status: z.string().default('Entrega Inmediata'),
    activo: z.preprocess(parseBoolean, z.boolean().default(false)),
    scoreDesarrollo: z.preprocess(parseNumber, z.number().optional()),
    precioDesde: z.preprocess(parseNumber, z.number().optional()),
    keywords: z.preprocess(parseArray, z.array(z.string()).optional()),
    amenidades: z.preprocess(parseArray, z.array(z.string()).optional()),
    entorno: z.preprocess(parseArray, z.array(z.string()).optional()),
    // Nested Objects
    ubicacion: UbicacionSchema.optional(),
    financiamiento: FinanciamientoSchema.optional(),
    precios: z.object({
        desde: z.preprocess(parseNumber, z.number().optional()),
        moneda: z.string().default('MXN'),
    }).optional(),
    infoComercial: InfoComercialDesarrolloSchema.optional(),
    legal: z.object({
        regimenPropiedad: z.string().default('Condominio')
    }).optional(),
    media: MediaDesarrolloSchema.optional(),
    analisisIA: AnalisisIASchema.optional(),

    // Internal
    updatedAt: z.custom((val) => val instanceof Timestamp).optional(),
});


// --- MODELO SCHEMA ---

export const AcabadosSchema = z.object({
    cocina: z.string().optional(),
    pisos: z.string().optional(),
});

export const MediaModeloSchema = z.object({
    cover: z.string().optional(),
    gallery: z.preprocess(parseArray, z.array(z.string()).optional()),
    plantasArquitectonicas: z.preprocess(parseArray, z.array(z.string()).optional()),
    recorridoVirtual: z.string().optional(),
    videoPromocional: z.string().optional(),
});

export const InfoComercialModeloSchema = z.object({
    fechaInicioVenta: z.preprocess(parseDate, z.custom((val) => val === null || val instanceof Timestamp).optional()),
    plusvaliaEstimada: z.preprocess(parseNumber, z.number().optional()),
    unidadesVendidas: z.preprocess(parseNumber, z.number().optional()),
});

export const PreciosModeloSchema = z.object({
    base: z.preprocess(parseNumber, z.number().min(0)),
    inicial: z.preprocess(parseNumber, z.number().optional()),
    metroCuadrado: z.preprocess(parseNumber, z.number().optional()),
    mantenimientoMensual: z.preprocess(parseNumber, z.number().optional()),
    moneda: z.string().default('MXN'),
});


export const ModeloSchema = z.object({
    id: z.string().optional(),
    idDesarrollo: z.string().min(1, "ID Desarrollo es requerido"),
    // Renamed ActivoModelo -> activo, but support legacy input
    activo: z.preprocess((val, ctx) => {
        // Fallback for ActivoModelo
        const v = val !== undefined ? val : ctx?.parent?.ActivoModelo;
        return parseBoolean(v);
    }, z.boolean().default(true)),

    nombreModelo: z.string().min(1, "Nombre Modelo es requerido"),
    descripcion: z.string().optional(),
    tipoVivienda: z.string().default('Casas'),

    // Specs
    m2: z.preprocess(parseNumber, z.number().optional()),
    terreno: z.preprocess(parseNumber, z.number().optional()),
    recamaras: z.preprocess(parseNumber, z.number().optional()),
    banos: z.preprocess(parseNumber, z.number().optional()),
    niveles: z.preprocess(parseNumber, z.number().optional()),
    cajones: z.preprocess(parseNumber, z.number().optional()),

    amenidades: z.preprocess(parseArray, z.array(z.string()).optional()),

    // Nested
    acabados: AcabadosSchema.optional(),
    precios: PreciosModeloSchema.optional(),
    infoComercial: InfoComercialModeloSchema.optional(),
    media: MediaModeloSchema.optional(),
    analisisIA: AnalisisIASchema.optional(),

    updatedAt: z.custom((val) => val instanceof Timestamp).optional(),
});
