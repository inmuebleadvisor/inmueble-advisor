
import { Timestamp } from 'firebase-admin/firestore';
import { parseDateWithTimezone } from './timezones.js';
import {
    cleanStr,
    generateId,
    standardizeLocation,
    cleanEmail,
    cleanPhone
} from './shared/normalization.js';
import { parsePipes, parseHitos } from './shared/transformers.js';

// Helper: Convert JS Date (from timezone parser) to Firestore Timestamp
const toTimestamp = (date) => {
    return date ? Timestamp.fromDate(date) : null;
};

// Date helper for simple strings if timezone not critical (though we prefer timezone aware)
const parseDateHelper = (str) => {
    if (!str) return null;
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
};

export const adaptDesarrollo = (row) => {
    const out = {};

    // 1. Identifiers & Deterministic ID
    const nombre = cleanStr(row.nombre || row.Nombre);
    const constructora = cleanStr(row.constructora || row.Constructora);

    if (nombre) out.nombre = nombre;
    if (constructora) out.constructora = constructora;
    if (row.descripcion) out.descripcion = row.descripcion;
    if (row.activo !== undefined) out.activo = row.activo;

    // ID Generation: slug(constructora + "-" + nombre)
    if (nombre && constructora) {
        out.id = generateId(constructora, nombre);
    } else if (row.id) {
        out.id = row.id;
    }

    // 2. Ubicacion
    const ubicacion = {};
    if (row.calle || row['ubicacion.calle']) ubicacion.calle = row.calle || row['ubicacion.calle'];
    if (row.colonia || row['ubicacion.colonia']) ubicacion.colonia = row.colonia || row['ubicacion.colonia'];
    if (row.localidad || row['ubicacion.localidad']) ubicacion.localidad = row.localidad || row['ubicacion.localidad'];

    // CP & Localidad (User specific headers: "codigopostal", "localidad")
    if (row.codigopostal) ubicacion.cp = parseFloat(row.codigopostal);

    if (row.ciudad || row['ubicacion.ciudad']) ubicacion.ciudad = row.ciudad || row['ubicacion.ciudad'];
    if (row.estado || row['ubicacion.estado']) ubicacion.estado = row.estado || row['ubicacion.estado'];
    if (row.zona || row['ubicacion.zona']) ubicacion.zona = row.zona || row['ubicacion.zona'];

    // Coerce Coords
    if (row.latitud || row['ubicacion.latitud']) ubicacion.latitud = parseFloat(row.latitud || row['ubicacion.latitud']);
    if (row.longitud || row['ubicacion.longitud']) ubicacion.longitud = parseFloat(row.longitud || row['ubicacion.longitud']);

    // Geo-Tagging Implementation
    if (ubicacion.ciudad) {
        const std = standardizeLocation(ubicacion.ciudad, ubicacion.estado);
        if (std) {
            ubicacion.ciudad = std.ciudad;
            if (std.estado) ubicacion.estado = std.estado;
            out.geografiaId = std.geografiaId;
        }
    }

    if (Object.keys(ubicacion).length > 0) out.ubicacion = ubicacion;

    // 3. Caracteristicas (Amenidades & Entorno) - Pipes
    const caracteristicas = {};

    if (row.amenidades) caracteristicas.amenidades = parsePipes(row.amenidades);
    if (row.entorno) caracteristicas.entorno = parsePipes(row.entorno);

    if (Object.keys(caracteristicas).length > 0) out.caracteristicas = caracteristicas;

    // 4. Financiamiento
    const fin = {};
    if (row.acepta_creditos) fin.aceptaCreditos = parsePipes(row.acepta_creditos);
    if (row.apartado_monto) fin.apartadoMinimo = parseFloat(row.apartado_monto);
    if (row.enganche_pct) fin.engancheMinimoPorcentaje = parseFloat(row.enganche_pct);

    if (Object.keys(fin).length > 0) out.financiamiento = fin;

    // 5. Media
    const media = {};
    if (row.url_cover) media.cover = row.url_cover;
    if (row.url_gallery) media.gallery = parsePipes(row.url_gallery);
    if (row.url_brochure) media.brochure = row.url_brochure;
    if (row.url_video) media.video = row.url_video;

    if (Object.keys(media).length > 0) out.media = media;

    // 6. Comisiones
    if (row.override_comision) {
        out.comisiones = { overridePct: parseFloat(row.override_comision) };
    }

    // 7. Info Comercial
    const info = {};
    const rawTotales = row['unidades.totales'] || row.unidades_totales || row['infoComercial.unidadesTotales'];
    const rawVendidas = row['unidades.vendidas'] || row.unidades_vendidas || row['infoComercial.unidadesVendidas'];
    const rawDisponibles = row['unidades.disponibles'] || row.unidades_disponibles || row['infoComercial.unidadesDisponibles'];

    if (rawTotales !== undefined && rawTotales !== '' && rawTotales !== null) {
        const val = parseFloat(rawTotales);
        if (!isNaN(val)) info.unidadesTotales = val;
    }

    if (rawVendidas !== undefined && rawVendidas !== '' && rawVendidas !== null) {
        const val = parseFloat(rawVendidas);
        if (!isNaN(val)) info.unidadesVendidas = val;
    }

    if (rawDisponibles !== undefined && rawDisponibles !== '' && rawDisponibles !== null) {
        const val = parseFloat(rawDisponibles);
        if (!isNaN(val)) info.unidadesDisponibles = val;
    }

    if (row.num_modelos) info.cantidadModelos = parseFloat(row.num_modelos);

    if (Object.keys(info).length > 0) out.infoComercial = info;


    // 8. Precios
    const precios = {};
    if (row.moneda) precios.moneda = row.moneda;
    if (Object.keys(precios).length > 0) out.precios = precios;


    if (row.regimen) out.legal = { regimenPropiedad: row.regimen };

    const analisis = {};
    if (row.ia_resumen) analisis.resumen = row.ia_resumen;
    if (row.ia_fuertes) {
        analisis.puntosFuertes = parsePipes(row.ia_fuertes);
    }
    if (row.ia_debiles) {
        analisis.puntosDebiles = parsePipes(row.ia_debiles);
    }
    if (Object.keys(analisis).length > 0) out.analisisIA = analisis;

    // 10. PROMOCION
    const prom = {};
    const pNombre = row['promocion.nombre'] || row.promocion_nombre || row['Promocion.nombre'];
    if (pNombre) prom.nombre = pNombre;

    // Timezone safe parsing: Use City from same row
    const city = out.ubicacion?.ciudad || 'Mexico City';

    // Start Date
    const startStr = row['promocion.inicio'] || row['promocion.fechainicio'] || row.promocion_inicio || row['promocion.fecha_inicio'];
    if (startStr) {
        const d = parseDateWithTimezone(startStr, city, false);
        if (d) prom.fecha_inicio = toTimestamp(d);
        else if (parseDateHelper(startStr)) prom.fecha_inicio = toTimestamp(parseDateHelper(startStr));
    }

    // End Date
    const endStr = row['promocion.final'] || row['promocion.fechafinal'] || row.promocion_fin || row['promocion.fecha_fin'];
    if (endStr) {
        const d = parseDateWithTimezone(endStr, city, true);
        if (d) prom.fecha_fin = toTimestamp(d);
        else if (parseDateHelper(endStr)) prom.fecha_fin = toTimestamp(parseDateHelper(endStr));
    }

    if (Object.keys(prom).length > 0) out.promocion = prom;

    return out;
};

export const adaptModelo = (row) => {
    const out = {};

    // 1. Identifiers
    let idDesarrollo = row.idDesarrollo || row.id_desarrollo;
    const nombreModelo = row.nombreModelo || row.nombre_modelo;

    if (!idDesarrollo) {
        const nombreDes = cleanStr(row.nombreDesarrollo || row.nombre_desarrollo || row.desarrollo);
        const constructora = cleanStr(row.constructora || row.Constructora || row.desarrollador);
        if (nombreDes && constructora) {
            idDesarrollo = generateId(constructora, nombreDes);
        }
    }

    if (row.id) {
        out.id = row.id;
    } else if (idDesarrollo && nombreModelo) {
        out.id = generateId(idDesarrollo, nombreModelo);
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

    // STATUS
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
    if (row.moneda || row['precios.moneda']) precios.moneda = row.moneda || row['precios.moneda'];
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
    if (row.ia_fuertes) analisis.puntosFuertes = parsePipes(row.ia_fuertes);
    if (row.ia_debiles) analisis.puntosDebiles = parsePipes(row.ia_debiles);
    if (Object.keys(analisis).length > 0) out.analisisIA = analisis;

    // 8. PROMOCION
    const prom = {};
    const mPNombre = row['promocion.nombre'] || row.promocion_nombre || row['Promocion.nombre'];
    if (mPNombre) prom.nombre = mPNombre;

    const city = row.ciudad || row.timezone_city || 'Mexico City';

    const startStr = row['promocion.inicio'] || row.promocion_inicio || row['promocion.fecha_inicio'];
    if (startStr) {
        const d = parseDateWithTimezone(startStr, city, false);
        if (d) prom.fecha_inicio = toTimestamp(d);
        else if (parseDateHelper(startStr)) prom.fecha_inicio = toTimestamp(parseDateHelper(startStr));
    }

    const endStr = row['promocion.final'] || row.promocion_fin || row['promocion.fecha_fin'];
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
    const nombre = cleanStr(row.Nombre || row.nombre);

    // 1. ID Slug Generation
    if (row.ID || row.id) {
        out.id = cleanStr(row.ID || row.id);
    } else if (nombre) {
        // Simple slug for dev as fallback, though users should provide ID hopefully
        out.id = nombre.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    if (nombre) out.nombre = nombre;
    out.status = cleanStr(row.Status || row.status || 'activo').toLowerCase();

    // 2. Fiscal
    const razonSocial = cleanStr(row.RazonSocial || row.razon_social || row['fiscal.razonSocial']);
    if (razonSocial) out.fiscal = { razonSocial };

    // 3. Comisiones
    const comisiones = {};
    const basePct = parseFloat(row.ComisionBase || row.comision_base || row['comisiones.porcentajeBase']);
    if (!isNaN(basePct)) comisiones.porcentajeBase = basePct;

    const hitos = {};
    const hCredito = parseHitos(row.HitosCredito || row.hitos_credito || row.pago_hitos_credito || row['comisiones.hitos.credito']);
    if (hCredito.length > 0) hitos.credito = hCredito;

    const hContado = parseHitos(row.HitosContado || row.hitos_contado || row.pago_hitos_contado || row['comisiones.hitos.contado']);
    if (hContado.length > 0) hitos.contado = hContado;

    const hDirecto = parseHitos(row.HitosDirecto || row.hitos_directo || row.pago_hitos_directo || row['comisiones.hitos.directo']);
    if (hDirecto.length > 0) hitos.directo = hDirecto;

    if (Object.keys(hitos).length > 0) comisiones.hitos = hitos;
    if (Object.keys(comisiones).length > 0) out.comisiones = comisiones;

    // 4. Contacto (Principal y Secundario)
    const contacto = {};
    const principal = {};
    const pNombre = cleanStr(row.ContactoNombre || row.contacto_nombre_principal || row.contacto_nom_1 || row['contacto.principal.nombre']);
    if (pNombre) principal.nombre = pNombre;

    const pTel = cleanPhone(row.ContactoTelefono || row.contacto_telefono_principal || row.contacto_tel_1 || row['contacto.principal.telefono']);
    if (pTel) principal.telefono = pTel;

    const pMail = cleanEmail(row.ContactoEmail || row.contacto_email_principal || row.contacto_mail_1 || row['contacto.principal.email']);
    if (pMail) principal.email = pMail;

    const pPuesto = cleanStr(row.ContactoPuesto || row.contacto_puesto_principal || row.contacto_puesto_1 || row['contacto.principal.puesto']);
    if (pPuesto) principal.puesto = pPuesto;

    if (Object.keys(principal).length > 0) contacto.principal = principal;

    const secundario = {};
    const sNombre = cleanStr(row.ContactoSecundarioNombre || row.contacto_nombre_secundario || row.contacto_nom_2 || row['contacto.secundario.nombre']);
    if (sNombre) secundario.nombre = sNombre;

    const sTel = cleanPhone(row.ContactoSecundarioTelefono || row.contacto_telefono_secundario || row.contacto_tel_2 || row['contacto.secundario.telefono']);
    if (sTel) secundario.telefono = sTel;

    const sMail = cleanEmail(row.ContactoSecundarioEmail || row.contacto_email_secundario || row.contacto_mail_2 || row['contacto.secundario.email']);
    if (sMail) secundario.email = sMail;

    const sPuesto = cleanStr(row.ContactoSecundarioPuesto || row.contacto_puesto_secundario || row['contacto.secundario.puesto']);
    if (sPuesto) secundario.puesto = sPuesto;

    if (Object.keys(secundario).length > 0) contacto.secundario = secundario;

    if (Object.keys(contacto).length > 0) out.contacto = contacto;

    return out;
};
