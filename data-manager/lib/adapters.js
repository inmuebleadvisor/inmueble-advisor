import { Timestamp } from 'firebase-admin/firestore';
import { parseDateWithTimezone } from './timezones.js';

const parseDateHelper = (str) => {
    if (!str) return null;
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
};

// Helper: Convert JS Date (from timezone parser) to Firestore Timestamp
const toTimestamp = (date) => {
    return date ? Timestamp.fromDate(date) : null;
};

export const adaptDesarrollo = (row) => {
    const out = {};

    // 1. Identifiers
    if (row.id) out.id = row.id;
    if (row.nombre) out.nombre = row.nombre.trim();
    if (row.descripcion) out.descripcion = row.descripcion;
    if (row.constructora) out.constructora = row.constructora.trim();
    // Status REMOVED from Desarrollos

    if (row.activo !== undefined) out.activo = row.activo;
    if (row.score) out.scoreDesarrollo = row.score;
    if (row.keywords) out.keywords = row.keywords;

    // 2. Ubicacion
    const ubicacion = {};
    if (row.calle || row['ubicacion.calle']) ubicacion.calle = row.calle || row['ubicacion.calle'];
    if (row.colonia || row['ubicacion.colonia']) ubicacion.colonia = row.colonia || row['ubicacion.colonia'];
    if (row.localidad || row['ubicacion.localidad']) ubicacion.localidad = row.localidad || row['ubicacion.localidad'];
    if (row.ciudad || row['ubicacion.ciudad']) ubicacion.ciudad = row.ciudad || row['ubicacion.ciudad'];
    if (row.estado || row['ubicacion.estado']) ubicacion.estado = row.estado || row['ubicacion.estado'];
    if (row.zona || row['ubicacion.zona']) ubicacion.zona = row.zona || row['ubicacion.zona'];
    if (row.latitud || row['ubicacion.latitud']) ubicacion.latitud = row.latitud || row['ubicacion.latitud'];
    if (row.longitud || row['ubicacion.longitud']) ubicacion.longitud = row.longitud || row['ubicacion.longitud'];
    if (Object.keys(ubicacion).length > 0) out.ubicacion = ubicacion;

    // 3. Precios
    const precios = {};
    if (row.precio_desde || row['precios.desde']) precios.desde = row.precio_desde || row['precios.desde'];
    if (row['precios.moneda']) precios.moneda = row['precios.moneda'];
    if (Object.keys(precios).length > 0) out.precios = precios;

    // 4. Info Comercial
    const info = {};
    if (row.fecha_entrega || row['infoComercial.fechaEntrega']) info.fechaEntrega = row.fecha_entrega || row['infoComercial.fechaEntrega'];
    if (row.fecha_inicio || row['infoComercial.fechaInicioVenta']) info.fechaInicioVenta = row.fecha_inicio || row['infoComercial.fechaInicioVenta'];
    if (row.num_modelos || row['infoComercial.cantidadModelos']) info.cantidadModelos = row.num_modelos || row['infoComercial.cantidadModelos'];
    if (row.plusvalia_pct || row['infoComercial.plusvaliaPromedio']) info.plusvaliaPromedio = row.plusvalia_pct || row['infoComercial.plusvaliaPromedio'];

    const rawTotales = row.unidades_totales || row['infoComercial.unidadesTotales'];
    const rawVendidas = row.unidades_vendidas || row['infoComercial.unidadesVendidas'];
    const rawDisponibles = row.unidades_disponibles || row['infoComercial.unidadesDisponibles'];

    if (rawTotales) {
        const uT = parseFloat(rawTotales) || 0;
        info.unidadesTotales = uT;

        let uV = parseFloat(rawVendidas);
        let uD = parseFloat(rawDisponibles);

        if (!isNaN(uV) && isNaN(uD)) {
            info.unidadesVendidas = uV;
            info.unidadesDisponibles = (uT - uV) > 0 ? (uT - uV) : 0;
        }
        else if (isNaN(uV) && !isNaN(uD)) {
            info.unidadesDisponibles = uD;
            info.unidadesVendidas = (uT - uD) > 0 ? (uT - uD) : 0;
        }
        else if (!isNaN(uV) && !isNaN(uD)) {
            info.unidadesVendidas = uV;
            info.unidadesDisponibles = uD;
        }
    } else {
        if (rawVendidas) info.unidadesVendidas = parseFloat(rawVendidas);
        if (rawDisponibles) info.unidadesDisponibles = parseFloat(rawDisponibles);
    }

    if (Object.keys(info).length > 0) out.infoComercial = info;

    // 5. Financiamiento
    const fin = {};
    if (row.fin_creditos || row['financiamiento.aceptaCreditos']) fin.aceptaCreditos = row.fin_creditos || row['financiamiento.aceptaCreditos'];
    if (row.fin_apartado || row['financiamiento.apartadoMinimo']) fin.apartadoMinimo = row.fin_apartado || row['financiamiento.apartadoMinimo'];
    if (row.fin_enganche || row['financiamiento.engancheMinimoPorcentaje']) fin.engancheMinimoPorcentaje = row.fin_enganche || row['financiamiento.engancheMinimoPorcentaje'];
    if (Object.keys(fin).length > 0) out.financiamiento = fin;

    // 6. Media
    const media = {};
    if (row.img_cover || row['media.cover']) media.cover = row.img_cover || row['media.cover'];
    if (row.img_galeria || row['media.gallery']) media.gallery = row.img_galeria || row['media.gallery'];
    if (row.url_brochure || row['media.brochure']) media.brochure = row.url_brochure || row['media.brochure'];
    if (row.url_video || row['media.video']) media.video = row.url_video || row['media.video'];
    if (Object.keys(media).length > 0) out.media = media;

    // 7. Legal
    if (row.regimen || row['legal.regimenPropiedad']) out.legal = { regimenPropiedad: row.regimen || row['legal.regimenPropiedad'] };

    // 8. Amenidades & Entorno
    if (row.amenidades) out.amenidades = row.amenidades;
    if (row.entorno) out.entorno = row.entorno;

    // 9. Analisis IA
    const analisis = {};
    if (row.ia_resumen) analisis.resumen = row.ia_resumen;
    if (row.ia_fuertes) analisis.puntosFuertes = row.ia_fuertes;
    if (row.ia_debiles) analisis.puntosDebiles = row.ia_debiles;
    if (Object.keys(analisis).length > 0) out.analisisIA = analisis;

    // 10. PROMOCION (New)
    const prom = {};
    if (row.promocion_nombre || row['promocion.nombre']) prom.nombre = row.promocion_nombre || row['promocion.nombre'];

    // Timezone safe parsing: Use City from same row (if csv has it)
    const city = out.ubicacion?.ciudad || 'Mexico City';

    // Start Date
    const startStr = row.promocion_inicio || row['promocion.fecha_inicio'];
    if (startStr) {
        // Try parsing assuming YYYY-MM-DD in City Time
        // Check if user provided ISO? If so, map directly?
        // Guide says: "Regla de Oro: La vigencia ... alineados a la zona horaria de la ciudad"
        // We assume CSV gives YYYY-MM-DD
        const d = parseDateWithTimezone(startStr, city, false);
        if (d) prom.fecha_inicio = toTimestamp(d);
        // If not parsed (maybe full ISO), try basic parse
        else if (parseDateHelper(startStr)) prom.fecha_inicio = toTimestamp(parseDateHelper(startStr));
    }

    // End Date
    const endStr = row.promocion_fin || row['promocion.fecha_fin'];
    if (endStr) {
        const d = parseDateWithTimezone(endStr, city, true); // End of day
        if (d) prom.fecha_fin = toTimestamp(d);
        else if (parseDateHelper(endStr)) prom.fecha_fin = toTimestamp(parseDateHelper(endStr));
    }

    if (Object.keys(prom).length > 0) out.promocion = prom;

    return out;
};

export const adaptModelo = (row) => {
    const out = {};

    // 1. Identifiers
    const idDesarrollo = row.idDesarrollo || row.id_desarrollo;
    const nombreModelo = row.nombreModelo || row.nombre_modelo;

    if (row.id) {
        out.id = row.id;
    } else if (idDesarrollo && nombreModelo) {
        const slugModelo = nombreModelo.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        out.id = `${idDesarrollo}-${slugModelo}`;
    }

    if (idDesarrollo) out.idDesarrollo = idDesarrollo;
    if (nombreModelo) out.nombreModelo = nombreModelo;
    if (row.descripcion) out.descripcion = row.descripcion;

    if (row.highlight || row.destacado) {
        out.highlights = [row.highlight || row.destacado];
    }

    if (row.ActivoModelo !== undefined) out.activo = row.ActivoModelo;
    else if (row.activo_modelo !== undefined) out.activo = row.activo_modelo;
    else if (row.activo !== undefined) out.activo = row.activo;

    if (row.tipo_vivienda || row.tipoVivienda) out.tipoVivienda = row.tipo_vivienda || row.tipoVivienda;

    // STATUS (New in Model)
    // Supports flexible (string or pipe-separated)
    const rawStatus = row.status || row.estado;
    if (rawStatus) {
        if (rawStatus.includes('|')) {
            out.status = rawStatus.split('|').map(s => s.trim()).filter(s => s);
        } else {
            out.status = rawStatus.trim();
        }
    }

    // 2. Precios
    const precios = {};
    if (row.precio_inicial || row.precio_base || row['precios.base']) precios.base = row.precio_inicial || row.precio_base || row['precios.base'];
    if (row.precio_orig_lista || row['precios.inicial']) precios.inicial = row.precio_orig_lista || row['precios.inicial'];
    if (row.precio_m2 || row['precios.metroCuadrado']) precios.metroCuadrado = row.precio_m2 || row['precios.metroCuadrado'];
    if (row.mantenimiento || row['precios.mantenimientoMensual']) precios.mantenimientoMensual = row.mantenimiento || row['precios.mantenimientoMensual'];
    if (row['precios.moneda']) precios.moneda = row['precios.moneda'];
    if (Object.keys(precios).length > 0) out.precios = precios;

    // 3. Info Comercial
    const info = {};
    if (row.unidades_vendidas || row['infoComercial.unidadesVendidas']) info.unidadesVendidas = row.unidades_vendidas || row['infoComercial.unidadesVendidas'];
    if (row.plusvalia_pct || row['infoComercial.plusvaliaEstimada']) info.plusvaliaEstimada = row.plusvalia_pct || row['infoComercial.plusvaliaEstimada'];
    if (row.fecha_inicio || row['infoComercial.fechaInicioVenta']) info.fechaInicioVenta = row.fecha_inicio || row['infoComercial.fechaInicioVenta'];
    if (row.tiempo_entrega || row['infoComercial.tiempoEntrega']) info.tiempoEntrega = row.tiempo_entrega || row['infoComercial.tiempoEntrega'];
    if (Object.keys(info).length > 0) out.infoComercial = info;

    // 4. Specs
    if (row.recamaras) out.recamaras = row.recamaras;
    if (row.banos) out.banos = row.banos;
    if (row.niveles) out.niveles = row.niveles;
    if (row.cajones) out.cajones = row.cajones;
    if (row.m2_const || row.m2) out.m2 = row.m2_const || row.m2;
    if (row.m2_terreno || row.terreno) out.terreno = row.m2_terreno || row.terreno;
    if (row.frente) out.frente = row.frente;
    if (row.fondo) out.fondo = row.fondo;
    if (row.amenidades) out.amenidades = row.amenidades;

    // 5. Acabados
    const acabados = {};
    if (row.acabado_cocina || row['acabados.cocina']) acabados.cocina = row.acabado_cocina || row['acabados.cocina'];
    if (row.acabado_pisos || row['acabados.pisos']) acabados.pisos = row.acabado_pisos || row['acabados.pisos'];
    if (Object.keys(acabados).length > 0) out.acabados = acabados;

    // 6. Media
    const media = {};
    if (row.img_cover || row['media.cover']) media.cover = row.img_cover || row['media.cover'];
    if (row.img_galeria || row['media.gallery'] || row['media.galeria']) media.gallery = row.img_galeria || row['media.gallery'] || row['media.galeria'];
    if (row.url_plantas || row['media.plantasArquitectonicas']) media.plantasArquitectonicas = row.url_plantas || row['media.plantasArquitectonicas'];
    if (row.url_tour || row['media.recorridoVirtual']) media.recorridoVirtual = row.url_tour || row['media.recorridoVirtual'];
    if (row.url_video || row['media.videoPromocional'] || row['media.video']) media.videoPromocional = row.url_video || row['media.videoPromocional'] || row['media.video'];
    if (Object.keys(media).length > 0) out.media = media;

    // 7. Analisis IA
    const analisis = {};
    if (row.ia_resumen) analisis.resumen = row.ia_resumen;
    if (Object.keys(analisis).length > 0) out.analisisIA = analisis;

    // 8. PROMOCION (New)
    const prom = {};
    if (row.promocion_nombre || row['promocion.nombre']) prom.nombre = row.promocion_nombre || row['promocion.nombre'];

    // Timezone safe parsing for Models
    // Issue: We might not have City here.
    // Solution: If 'ciudad' or 'timezone_city' is passed in CSV, use it. Else default to Mexico City.
    const city = row.ciudad || row.timezone_city || 'Mexico City';

    const startStr = row.promocion_inicio || row['promocion.fecha_inicio'];
    if (startStr) {
        const d = parseDateWithTimezone(startStr, city, false);
        if (d) prom.fecha_inicio = toTimestamp(d);
        else if (parseDateHelper(startStr)) prom.fecha_inicio = toTimestamp(parseDateHelper(startStr));
    }

    const endStr = row.promocion_fin || row['promocion.fecha_fin'];
    if (endStr) {
        const d = parseDateWithTimezone(endStr, city, true);
        if (d) prom.fecha_fin = toTimestamp(d);
        else if (parseDateHelper(endStr)) prom.fecha_fin = toTimestamp(parseDateHelper(endStr));
    }

    if (Object.keys(prom).length > 0) out.promocion = prom;

    // --- CALCULATIONS ---

    if (out.precios?.base && out.m2 > 0) {
        out.precios.metroCuadrado = Number((out.precios.base / out.m2).toFixed(2));
    }

    if (out.precios?.base && out.precios?.inicial > 0 && out.infoComercial?.fechaInicioVenta) {
        const current = out.precios.base;
        const initial = out.precios.inicial;
        const startDate = parseDateHelper(out.infoComercial.fechaInicioVenta);

        if (startDate) {
            const now = new Date();
            const yearsDiff = now.getFullYear() - startDate.getFullYear();
            const monthsDiff = (yearsDiff * 12) + (now.getMonth() - startDate.getMonth());
            const safeMonths = monthsDiff < 1 ? 1 : monthsDiff;
            const totalGrowthPct = ((current - initial) / initial);
            const annualizedGrowth = (totalGrowthPct / safeMonths) * 12;
            out.infoComercial.plusvaliaEstimada = Number((annualizedGrowth * 100).toFixed(2));
        }
    }

    return out;
};


export const adaptDesarrollador = (row) => {
    const out = {};

    if (row.ID || row.id) out.id = String(row.ID || row.id).trim();
    if (row.Nombre || row.nombre) out.nombre = String(row.Nombre || row.nombre).trim();

    // Contacto
    const contacto = {};
    if (row['Contacto.Nombre1'] || row.contacto_nombre1) contacto.nombre1 = row['Contacto.Nombre1'] || row.contacto_nombre1;
    if (row['Contacto.Telefono1'] || row.contacto_telefono1) contacto.telefono1 = row['Contacto.Telefono1'] || row.contacto_telefono1;
    if (row['Contacto.Mail1'] || row.contacto_mail1) contacto.mail1 = row['Contacto.Mail1'] || row.contacto_mail1;
    if (row['Contacto.Puesto1'] || row.contacto_puesto1) contacto.puesto1 = row['Contacto.Puesto1'] || row.contacto_puesto1;

    if (row['Contacto.Nombre2'] || row.contacto_nombre2) contacto.nombre2 = row['Contacto.Nombre2'] || row.contacto_nombre2;
    if (row['Contacto.Telefono2'] || row.contacto_telefono2) contacto.telefono2 = row['Contacto.Telefono2'] || row.contacto_telefono2;
    if (row['Contacto.Mail2'] || row.contacto_mail2) contacto.mail2 = row['Contacto.Mail2'] || row.contacto_mail2;
    if (row['Contacto.Puesto2'] || row.contacto_puesto2) contacto.puesto2 = row['Contacto.Puesto2'] || row.contacto_puesto2;

    if (Object.keys(contacto).length > 0) out.contacto = contacto;

    // EsquemaPago
    const pago = {};
    if (row['EsquemaPago.Apartado'] || row.pago_apartado) pago.apartado = row['EsquemaPago.Apartado'] || row.pago_apartado;
    if (row['EsquemaPago.Enganche'] || row.pago_enganche) pago.enganche = row['EsquemaPago.Enganche'] || row.pago_enganche;
    if (row['EsquemaPago.AprobacionCredito'] || row.pago_aprobacion) pago.aprobacionCredito = row['EsquemaPago.AprobacionCredito'] || row.pago_aprobacion;
    if (row['EsquemaPago.Escrituracion'] || row.pago_escrituracion) pago.escrituracion = row['EsquemaPago.Escrituracion'] || row.pago_escrituracion;

    if (Object.keys(pago).length > 0) out.esquemaPago = pago;

    // Arrays
    if (row.AsesoresDesarrollo) out.asesoresDesarrollo = row.AsesoresDesarrollo;
    if (row.Desarrollos) out.desarrollos = row.Desarrollos;

    // Note: 'Ciudades', 'Ofertatotal', 'ViviendasxVender' are typically calculated, 
    // but if provided in csv we can allow import (though recalc will overwrite).
    if (row.Ciudades) out.ciudades = row.Ciudades;

    return out;
};
