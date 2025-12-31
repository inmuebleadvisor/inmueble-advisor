import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';

// Helper for Firestore Timestamps or Dates
const TimestampSchema = z.custom((val) => {
    return val instanceof Timestamp || val instanceof Date;
}, { message: "Must be a Firestore Timestamp or Date" });

// --- 1. DESARROLLADORES ---
export const DesarrolladorSchema = z.object({
    id: z.string().min(1),
    nombre: z.string().min(1),
    status: z.enum(['activo', 'inactivo', 'suspendido']).default('activo'),
    fiscal: z.object({
        razonSocial: z.string().optional(),
    }).optional(),
    comisiones: z.object({
        porcentajeBase: z.number().optional(),
        hitos: z.object({
            credito: z.array(z.number()).optional(),
            contado: z.array(z.number()).optional(),
            directo: z.array(z.number()).optional(),
        }).optional(),
    }).optional(),
    contacto: z.object({
        principal: z.object({
            nombre: z.string().optional(),
            telefono: z.string().optional(),
            email: z.string().email().optional(),
            puesto: z.string().optional()
        }).optional(),
        secundario: z.object({
            nombre: z.string().optional(),
            telefono: z.string().optional(),
            email: z.string().email().optional(),
            puesto: z.string().optional()
        }).optional(),
    }).optional(),
    // Protected/Calculated fields (Optional in schema to allow read, but usually generated)
    operacion: z.object({
        asesoresAutorizados: z.array(z.string()).optional(),
        asesoresConLeads: z.array(z.string()).optional(),
    }).optional(),
    stats: z.object({
        ofertaTotal: z.number().optional(),
        viviendasxVender: z.number().optional()
    }).optional(),
    ciudades: z.array(z.string()).optional(),
    desarrollos: z.array(z.string()).optional(),
    updatedAt: TimestampSchema.optional(),
});

// --- 2. DESARROLLOS ---
export const DesarrolloSchema = z.object({
    id: z.string().min(1),
    nombre: z.string().min(1),
    descripcion: z.string().optional(),
    constructora: z.string().min(1),
    activo: z.boolean().default(true),
    geografiaId: z.string().optional(), // mx-est-ciu
    ubicacion: z.object({
        calle: z.string().optional(),
        colonia: z.string().optional(),
        cp: z.number().optional(),
        localidad: z.string().optional(),
        ciudad: z.string().optional(), // Was .min(1), relaxed for draft imports
        estado: z.string().optional(),
        zona: z.string().optional(),
        latitud: z.number().optional(),
        longitud: z.number().optional(),
    }).optional(),
    caracteristicas: z.object({
        amenidades: z.array(z.string()).optional(),
        entorno: z.array(z.string()).optional(),
    }).optional(),
    financiamiento: z.object({
        aceptaCreditos: z.array(z.string()).optional(),
        apartadoMinimo: z.number().optional(),
        engancheMinimoPorcentaje: z.number().optional(),
    }).optional(),
    media: z.object({
        cover: z.string().url().optional(),
        gallery: z.array(z.string().url()).optional(),
        brochure: z.string().url().optional(),
        video: z.string().url().optional(),
    }).optional(),
    comisiones: z.object({
        overridePct: z.number().optional(),
    }).optional(),
    infoComercial: z.object({
        cantidadModelos: z.number().optional(),
        fechaInicioVenta: TimestampSchema.or(z.string()).optional(), // Adapters usually format it, but flexibility here helps
        unidadesTotales: z.number().optional(),
        unidadesVendidas: z.number().optional(),
        unidadesDisponibles: z.number().optional(),
        plusvaliaPromedio: z.number().optional(),
    }).optional(),
    precios: z.object({
        desde: z.number().optional(),
        moneda: z.string().optional(),
    }).optional(),
    stats: z.object({
        rangoPrecios: z.array(z.number()).optional(),
        inventario: z.number().optional(),
    }).optional(),
    promocion: z.object({
        nombre: z.string().optional(),
        fecha_inicio: TimestampSchema.optional(),
        fecha_fin: TimestampSchema.optional(),
    }).optional(),
    analisisIA: z.object({
        resumen: z.string().optional(),
        puntosFuertes: z.array(z.string()).optional(),
        puntosDebiles: z.array(z.string()).optional(),
    }).optional(),
    legal: z.object({
        regimenPropiedad: z.string().optional(),
    }).optional(),
    updatedAt: TimestampSchema.optional(),
});

// --- 3. MODELOS ---
export const ModeloSchema = z.object({
    id: z.string().min(1),
    idDesarrollo: z.string().min(1),
    nombreModelo: z.string().min(1),
    activo: z.boolean().default(true),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    tipoVivienda: z.string().default('Casa'),

    // Specs (Direct mapping)
    recamaras: z.number().optional(),
    banos: z.number().optional(),
    niveles: z.number().optional(),
    cajones: z.number().optional(),
    m2: z.number().optional(),
    terreno: z.number().optional(),
    frente: z.number().optional(),
    fondo: z.number().optional(),
    amenidades: z.array(z.string()).optional(),

    precios: z.object({
        base: z.number().min(0),
        inicial: z.number().optional(),
        metroCuadrado: z.number().optional(),
        mantenimientoMensual: z.number().optional(),
        moneda: z.string().optional(),
    }).optional(),
    preciosHistoricos: z.array(z.object({
        fecha: TimestampSchema,
        precio: z.number()
    })).optional(),
    plusvaliaReal: z.number().optional(),
    acabados: z.object({
        cocina: z.string().optional(),
        pisos: z.string().optional(),
    }).optional(),
    media: z.object({
        cover: z.string().url().optional(),
        gallery: z.array(z.string().url()).optional(),
        plantasArquitectonicas: z.array(z.string().url()).optional(),
        recorridoVirtual: z.string().url().optional(),
        videoPromocional: z.string().url().optional(),
    }).optional(),
    highlights: z.array(z.string()).optional(),
    promocion: z.object({
        nombre: z.string().optional(),
        fecha_inicio: TimestampSchema.optional(),
        fecha_fin: TimestampSchema.optional(),
    }).optional(),
    analisisIA: z.object({
        resumen: z.string().optional(),
        puntosFuertes: z.array(z.string()).optional(),
        puntosDebiles: z.array(z.string()).optional(),
    }).optional(),
    infoComercial: z.object({
        unidadesVendidas: z.number().optional(),
        plusvaliaEstimada: z.number().optional(),
        fechaInicioVenta: z.string().optional(),
        tiempoEntrega: z.string().optional(),
    }).optional(),
    updatedAt: TimestampSchema.optional(),
});
