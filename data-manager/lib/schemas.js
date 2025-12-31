
import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';
import { parseBoolean, parseNumber, parseArray, parseDate } from './shared/zod-utils.js';

// --- SCHEMAS ---

export const UbicacionSchema = z.object({
    calle: z.string().optional(),
    colonia: z.string().optional(),
    localidad: z.string().optional(),
    cp: z.preprocess(parseNumber, z.number().optional()),
    ciudad: z.string().optional(),
    estado: z.string().optional(),
    zona: z.string().optional(),
    latitud: z.preprocess(parseNumber, z.number().optional()),
    longitud: z.preprocess(parseNumber, z.number().optional()),
}).strict(); // Data hygiene

export const FinanciamientoSchema = z.object({
    aceptaCreditos: z.preprocess(parseArray, z.array(z.string()).optional()),
    apartadoMinimo: z.preprocess(parseNumber, z.number().optional()),
    engancheMinimoPorcentaje: z.preprocess(parseNumber, z.number().optional()),
}).strict();

export const InfoComercialDesarrolloSchema = z.object({
    cantidadModelos: z.preprocess(parseNumber, z.number().optional()),
    fechaInicioVenta: z.preprocess(parseDate, z.custom((val) => val === null || val instanceof Timestamp).optional()),
    plusvaliaPromedio: z.preprocess(parseNumber, z.number().optional()),
    unidadesTotales: z.preprocess(parseNumber, z.number().optional()),
    unidadesVendidas: z.preprocess(parseNumber, z.number().optional()),
    unidadesDisponibles: z.preprocess(parseNumber, z.number().optional()),
}).strict();

export const AnalisisIASchema = z.object({
    resumen: z.string().optional(),
    puntosFuertes: z.preprocess(parseArray, z.array(z.string()).optional()),
    puntosDebiles: z.preprocess(parseArray, z.array(z.string()).optional()),
}).strict();

export const MediaDesarrolloSchema = z.object({
    cover: z.string().optional(),
    gallery: z.preprocess(parseArray, z.array(z.string()).optional()),
    brochure: z.string().optional(),
    video: z.string().optional(),
}).strict();

export const PromocionSchema = z.object({
    nombre: z.string().optional(),
    fecha_inicio: z.preprocess(parseDate, z.custom((val) => val === null || val instanceof Timestamp).optional()),
    fecha_fin: z.preprocess(parseDate, z.custom((val) => val === null || val instanceof Timestamp).optional()),
}).strict().refine((data) => {
    if (data.fecha_inicio && data.fecha_fin) {
        return data.fecha_fin.seconds > data.fecha_inicio.seconds;
    }
    return true;
}, { message: "La fecha final debe ser posterior a la fecha de inicio" });

export const CaracteristicasDesarrolloSchema = z.object({
    amenidades: z.preprocess(parseArray, z.array(z.string()).optional()),
    entorno: z.preprocess(parseArray, z.array(z.string()).optional()),
}).strict();

export const ComisionesDesarrolloSchema = z.object({
    overridePct: z.preprocess(parseNumber, z.number().optional()),
}).strict();

export const DesarrolloSchema = z.object({
    id: z.string().optional(),
    nombre: z.string().min(1, "Nombre es requerido"),
    descripcion: z.string().optional(),
    constructora: z.string().min(1, "Constructora es requerida"),

    activo: z.preprocess(parseBoolean, z.boolean().default(true)),
    geografiaId: z.string().optional(),

    ubicacion: UbicacionSchema.optional(),
    caracteristicas: CaracteristicasDesarrolloSchema.optional(),
    financiamiento: FinanciamientoSchema.optional(),

    media: MediaDesarrolloSchema.optional(),

    comisiones: ComisionesDesarrolloSchema.optional(),

    infoComercial: InfoComercialDesarrolloSchema.optional(),

    precios: z.object({
        desde: z.preprocess(parseNumber, z.number().optional()),
        moneda: z.string().optional()
    }).strict().optional(),

    // Protected / Calculated Fields 
    stats: z.object({
        rangoPrecios: z.array(z.number()).optional(),
        inventario: z.number().optional()
    }).strict().optional(),

    scoreCard: z.record(z.unknown()).optional(),

    legal: z.object({
        regimenPropiedad: z.string().default('Condominio')
    }).strict().optional(),

    analisisIA: AnalisisIASchema.optional(),
    promocion: PromocionSchema.optional(),

    updatedAt: z.custom((val) => val instanceof Timestamp).optional(),
}).strict();


// --- MODELO SCHEMA ---

export const AcabadosSchema = z.object({
    cocina: z.string().optional(),
    pisos: z.string().optional(),
}).strict();

export const MediaModeloSchema = z.object({
    cover: z.string().optional(),
    gallery: z.preprocess(parseArray, z.array(z.string()).optional()),
    plantasArquitectonicas: z.preprocess(parseArray, z.array(z.string()).optional()),
    recorridoVirtual: z.string().optional(),
    videoPromocional: z.string().optional(),
}).strict();

export const InfoComercialModeloSchema = z.object({
    fechaInicioVenta: z.preprocess(parseDate, z.custom((val) => val === null || val instanceof Timestamp).optional()),
    plusvaliaEstimada: z.preprocess(parseNumber, z.number().optional()),
    unidadesVendidas: z.preprocess(parseNumber, z.number().optional()),
    tiempoEntrega: z.string().optional(),
}).strict();

export const PreciosModeloSchema = z.object({
    base: z.preprocess(parseNumber, z.number().min(0)),
    inicial: z.preprocess(parseNumber, z.number().optional()),
    metroCuadrado: z.preprocess(parseNumber, z.number().optional()),
    mantenimientoMensual: z.preprocess(parseNumber, z.number().optional()),
    moneda: z.string().default('MXN'),
}).strict();

export const PrecioHistoricoSchema = z.object({
    fecha: z.custom((val) => val instanceof Timestamp),
    precio: z.number()
}).strict();



export const ModeloSchema = z.object({
    id: z.string().optional(),
    idDesarrollo: z.string().min(1, "ID Desarrollo es requerido"),

    // Status ADDED to Modelo (Flexible: string or array)
    status: z.union([z.string(), z.array(z.string())]).optional(),

    // Renamed ActivoModelo -> activo, but support legacy input
    activo: z.preprocess((val, ctx) => {
        // Fallback for ActivoModelo
        const v = val !== undefined ? val : ctx?.parent?.ActivoModelo;
        return parseBoolean(v);
    }, z.boolean().default(true)),

    nombreModelo: z.string().min(1, "Nombre Modelo es requerido"),
    descripcion: z.string().optional(),
    highlights: z.array(z.string()).optional(),
    tipoVivienda: z.string().default('Casas'),

    // Specs
    m2: z.preprocess(parseNumber, z.number().default(0)),
    terreno: z.preprocess(parseNumber, z.number().default(0)),
    frente: z.preprocess(parseNumber, z.number().optional()),
    fondo: z.preprocess(parseNumber, z.number().optional()),

    recamaras: z.preprocess(parseNumber, z.number().default(0)),
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

    // Price History & Real Growth
    preciosHistoricos: z.array(PrecioHistoricoSchema).optional(),
    plusvaliaReal: z.number().optional(),

    promocion: PromocionSchema.optional(),

    updatedAt: z.custom((val) => val instanceof Timestamp).optional(),
}).strict();

// --- DESARROLLADOR SCHEMA ---

export const ContactoSchema = z.object({
    nombre1: z.string().optional(),
    telefono1: z.string().optional(),
    mail1: z.string().optional(),
    puesto1: z.string().optional(),
    nombre2: z.string().optional(),
    telefono2: z.string().optional(),
    mail2: z.string().optional(),
    puesto2: z.string().optional(),
}).strict();

export const EsquemaPagoSchema = z.object({
    apartado: z.preprocess(parseNumber, z.number().optional()),
    enganche: z.preprocess(parseNumber, z.number().optional()),
    aprobacionCredito: z.preprocess(parseNumber, z.number().optional()),
    escrituracion: z.preprocess(parseNumber, z.number().optional()),
}).strict();

export const DesarrolladorSchema = z.object({
    id: z.string().optional(),
    nombre: z.string().min(1, "Nombre es requerido"),
    status: z.string().default("activo"),

    fiscal: z.object({
        razonSocial: z.string().optional()
    }).strict().optional(),

    comisiones: z.object({
        porcentajeBase: z.preprocess(parseNumber, z.number().default(3)),
        hitos: z.object({
            credito: z.array(z.number()).optional(),
            contado: z.array(z.number()).optional(),
            directo: z.array(z.number()).optional()
        }).strict().optional().refine((data) => {
            if (!data) return true;
            const validateSum = (arr) => {
                if (!arr || arr.length === 0) return true;
                const sum = arr.reduce((a, b) => a + b, 0);
                return Math.abs(sum - 100) < 0.1; // Float tolerance
            };

            if (!validateSum(data.credito)) return false;
            if (!validateSum(data.contado)) return false;
            if (!validateSum(data.directo)) return false;
            return true;
        }, { message: "La suma de los hitos de comisión debe ser 100%" })
    }).strict().optional(),

    contacto: z.object({
        principal: z.object({
            nombre: z.string().optional(),
            telefono: z.string().optional(),
            email: z.string().toLowerCase().optional(),
            puesto: z.string().optional()
        }).strict().optional(),
        secundario: z.object({
            nombre: z.string().optional(),
            telefono: z.string().optional(),
            email: z.string().toLowerCase().optional(),
            puesto: z.string().optional()
        }).strict().optional()
    }).strict().optional(),


    asesoresDesarrollo: z.preprocess(parseArray, z.array(z.string()).optional()),
    desarrollos: z.preprocess(parseArray, z.array(z.string()).optional()),

    // Operation fields (Protected)
    operacion: z.object({
        asesoresAutorizados: z.array(z.string()).optional(),
        asesoresConLeads: z.array(z.string()).optional()
    }).strict().optional(),

    // Calculated fields
    ciudades: z.array(z.string()).optional(),
    ofertaTotal: z.preprocess(parseNumber, z.number().optional()),
    viviendasxVender: z.preprocess(parseNumber, z.number().optional()),
    stats: z.object({
        ofertaTotal: z.number().optional(),
        viviendasxVender: z.number().optional()
    }).strict().optional(),

    updatedAt: z.custom((val) => val instanceof Timestamp).optional(),
}).strict();
