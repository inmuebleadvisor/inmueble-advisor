
import {
    generateId,
    slugify,
    standardizeLocation
} from '../shared/normalization.js';

import {
    getStr,
    getNum,
    getPipes,
    getHitos,
    getPhone,
    getEmail,
    getValue
} from '../shared/row-utils.js';

import {
    parseSimpleDate,
    extractPromoDates
} from '../shared/date-utils.js';


export const adaptDesarrollo = (row) => {
    const out = {};

    // 1. Identifiers & Deterministic ID
    const nombre = getStr(row, ['nombre', 'Nombre']);
    const constructora = getStr(row, ['constructora', 'Constructora']);

    if (nombre) out.nombre = nombre;
    if (constructora) out.constructora = constructora;

    const desc = getStr(row, ['descripcion']);
    if (desc) out.descripcion = desc;

    const activoRaw = getValue(row, ['activo']);
    if (activoRaw !== undefined) {
        const val = String(activoRaw).toUpperCase();
        out.activo = (val === 'TRUE' || val === '1' || val === 'ON');
    }

    // ID Generation: slug(constructora + "-" + nombre)
    if (nombre && constructora) {
        out.id = generateId(constructora, nombre);
    } else if (row.id) {
        out.id = row.id;
    }

    // 2. Ubicacion
    const ubicacion = {};
    const calle = getStr(row, ['calle', 'ubicacion.calle']);
    if (calle) ubicacion.calle = calle;

    const colonia = getStr(row, ['colonia', 'ubicacion.colonia']);
    if (colonia) ubicacion.colonia = colonia;

    const localidad = getStr(row, ['localidad', 'ubicacion.localidad']);
    if (localidad) ubicacion.localidad = localidad;

    const cp = getNum(row, ['codigopostal', 'ubicacion.cp']);
    if (cp) ubicacion.cp = cp;

    const ciudad = getStr(row, ['ciudad', 'ubicacion.ciudad']);
    if (ciudad) ubicacion.ciudad = ciudad;

    const estado = getStr(row, ['estado', 'ubicacion.estado']);
    if (estado) ubicacion.estado = estado;

    const zona = getStr(row, ['zona', 'ubicacion.zona']);
    if (zona) ubicacion.zona = zona;

    const lat = getNum(row, ['latitud', 'ubicacion.latitud']);
    if (lat) ubicacion.latitud = lat;

    const lon = getNum(row, ['longitud', 'ubicacion.longitud']);
    if (lon) ubicacion.longitud = lon;

    // Geo-Tagging Implementation
    if (ubicacion.ciudad) {
        const std = standardizeLocation(ubicacion.ciudad, ubicacion.estado);
        if (std) {
            ubicacion.ciudad = std.ciudad;
            if (std.estado) ubicacion.estado = std.estado;
            out.geografiaId = std.geografiaId;
        }
    }

    // Always assign ubicacion object to satisfy schema type (schema validates content)
    out.ubicacion = ubicacion;

    // 3. Caracteristicas (Amenidades & Entorno) - Pipes
    const caracteristicas = {};
    const amenidades = getPipes(row, ['amenidades']);
    if (amenidades.length) caracteristicas.amenidades = amenidades;

    const entorno = getPipes(row, ['entorno']);
    if (entorno.length) caracteristicas.entorno = entorno;

    if (Object.keys(caracteristicas).length > 0) out.caracteristicas = caracteristicas;

    // 4. Financiamiento
    const fin = {};
    const creditos = getPipes(row, ['acepta_creditos']);
    if (creditos.length) fin.aceptaCreditos = creditos;

    const apartado = getNum(row, ['apartado_monto']);
    if (apartado) fin.apartadoMinimo = apartado;

    const enganche = getNum(row, ['enganche_pct']);
    if (enganche) fin.engancheMinimoPorcentaje = enganche;

    if (Object.keys(fin).length > 0) out.financiamiento = fin;

    // 5. Media
    const media = {};
    const cover = getValue(row, ['url_cover']);
    if (cover) media.cover = cover;

    // Check if pipes or single url? adaptDesarrollo used parsePipes for gallery but adaptModelo used simple. Assume pipes for gallery.
    const gallery = getPipes(row, ['url_gallery']);
    if (gallery.length) media.gallery = gallery;

    const brochure = getValue(row, ['url_brochure']);
    if (brochure) media.brochure = brochure;

    const video = getValue(row, ['url_video']);
    if (video) media.video = video;

    if (Object.keys(media).length > 0) out.media = media;

    // 6. Comisiones
    const override = getNum(row, ['override_comision']);
    if (override) {
        out.comisiones = { overridePct: override };
    }

    // 7. Info Comercial
    const info = {};
    const totales = getNum(row, ['unidades.totales', 'unidades_totales', 'infoComercial.unidadesTotales']);
    if (totales !== undefined) info.unidadesTotales = totales;

    const vendidas = getNum(row, ['unidades.vendidas', 'unidades_vendidas', 'infoComercial.unidadesVendidas']);
    if (vendidas !== undefined) info.unidadesVendidas = vendidas;

    const disponibles = getNum(row, ['unidades.disponibles', 'unidades_disponibles', 'infoComercial.unidadesDisponibles']);
    if (disponibles !== undefined) info.unidadesDisponibles = disponibles;

    const numModelos = getNum(row, ['num_modelos']);
    if (numModelos) info.cantidadModelos = numModelos;

    if (Object.keys(info).length > 0) out.infoComercial = info;


    // 8. Precios
    const precios = {};
    const moneda = getStr(row, ['moneda']);
    if (moneda) precios.moneda = moneda;
    if (Object.keys(precios).length > 0) out.precios = precios;


    const regimen = getStr(row, ['regimen']);
    if (regimen) out.legal = { regimenPropiedad: regimen };

    const analisis = {};
    const iaResumen = getStr(row, ['ia_resumen']);
    if (iaResumen) analisis.resumen = iaResumen;

    const iaFuertes = getPipes(row, ['ia_fuertes']);
    if (iaFuertes.length) analisis.puntosFuertes = iaFuertes;

    const iaDebiles = getPipes(row, ['ia_debiles']);
    if (iaDebiles.length) analisis.puntosDebiles = iaDebiles;

    if (Object.keys(analisis).length > 0) out.analisisIA = analisis;

    // 10. PROMOCION
    const prom = {};
    const pNombre = getStr(row, ['promocion.nombre', 'promocion_nombre', 'Promocion.nombre']);
    if (pNombre) prom.nombre = pNombre;

    // Timezone safe parsing: Use City from same row
    const city = out.ubicacion?.ciudad || 'Mexico City';

    // Start Date
    // Start & End Date (Timezone Safe)
    const dates = extractPromoDates(row, city);
    if (dates.fecha_inicio) prom.fecha_inicio = dates.fecha_inicio;
    if (dates.fecha_fin) prom.fecha_fin = dates.fecha_fin;

    if (Object.keys(prom).length > 0) out.promocion = prom;

    return out;
};

export const adaptModelo = (row) => {
    const out = {};

    // 1. Identifiers
    let idDesarrollo = getStr(row, ['idDesarrollo', 'id_desarrollo']);
    const nombreModelo = getStr(row, ['nombreModelo', 'nombre_modelo']);

    if (!idDesarrollo) {
        const nombreDes = getStr(row, ['nombreDesarrollo', 'nombre_desarrollo', 'desarrollo']);
        const constructora = getStr(row, ['constructora', 'Constructora', 'desarrollador']);

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

    const desc = getStr(row, ['descripcion']);
    if (desc) out.descripcion = desc;

    const highlight = getStr(row, ['highlight', 'destacado']);
    if (highlight) {
        out.highlights = [highlight];
    }

    const activoRaw = getValue(row, ['activo']);
    if (activoRaw !== undefined) {
        const val = String(activoRaw).toUpperCase();
        out.activo = (val === 'TRUE' || val === '1' || val === 'ON');
    }

    const tipo = getStr(row, ['tipo_vivienda', 'tipoVivienda']);
    if (tipo) out.tipoVivienda = tipo;

    // STATUS (Array support)
    const rawStatus = getStr(row, ['status', 'estado']);
    if (rawStatus) {
        if (rawStatus.includes('|')) {
            out.status = rawStatus.split('|').map(s => s.trim()).filter(s => s);
        } else {
            out.status = rawStatus.trim();
        }
    }

    // 2. Precios
    const precios = {};
    const pBase = getNum(row, ['precio_inicial', 'precio_base', 'precios.base']);
    if (pBase) precios.base = pBase;

    const pInit = getNum(row, ['precio_orig_lista', 'precios.inicial']);
    if (pInit) precios.inicial = pInit;

    const pM2 = getNum(row, ['precio_m2', 'precios.metroCuadrado']);
    if (pM2) precios.metroCuadrado = pM2;

    const pMant = getNum(row, ['mantenimiento', 'precios.mantenimientoMensual']);
    if (pMant) precios.mantenimientoMensual = pMant;

    const pMoneda = getStr(row, ['moneda', 'precios.moneda']);
    if (pMoneda) precios.moneda = pMoneda;

    if (Object.keys(precios).length > 0) out.precios = precios;

    // 3. Info Comercial
    const info = {};
    const iVend = getNum(row, ['unidades_vendidas', 'infoComercial.unidadesVendidas']);
    if (iVend) info.unidadesVendidas = iVend;

    const iPlus = getNum(row, ['plusvalia_pct', 'infoComercial.plusvaliaEstimada']);
    if (iPlus) info.plusvaliaEstimada = iPlus;

    const iFecha = getStr(row, ['fecha_inicio', 'infoComercial.fechaInicioVenta']);
    if (iFecha) info.fechaInicioVenta = iFecha;

    const iEntrega = getStr(row, ['tiempo_entrega', 'infoComercial.tiempoEntrega']);
    if (iEntrega) info.tiempoEntrega = iEntrega;

    if (Object.keys(info).length > 0) out.infoComercial = info;

    // 4. Specs
    const simpleSpecs = ['recamaras', 'banos', 'niveles', 'cajones', 'frente', 'fondo'];
    simpleSpecs.forEach(spec => {
        const val = getNum(row, [spec]);
        if (val) out[spec] = val;
    });

    const m2 = getNum(row, ['m2_const', 'm2']);
    if (m2) out.m2 = m2;

    const terr = getNum(row, ['m2_terreno', 'terreno']);
    if (terr) out.terreno = terr;

    const amenidades = getPipes(row, ['amenidades']);
    if (amenidades.length) out.amenidades = amenidades;

    // 5. Acabados
    const acabados = {};
    const aCocina = getStr(row, ['acabado_cocina', 'acabados.cocina']);
    if (aCocina) acabados.cocina = aCocina;

    const aPisos = getStr(row, ['acabado_pisos', 'acabados.pisos']);
    if (aPisos) acabados.pisos = aPisos;

    if (Object.keys(acabados).length > 0) out.acabados = acabados;

    // 6. Media
    const media = {};
    const imgCover = getValue(row, ['img_cover', 'media.cover']);
    if (imgCover) media.cover = imgCover;

    const imgGal = getPipes(row, ['img_galeria', 'media.gallery', 'media.galeria']);
    if (imgGal.length) media.gallery = imgGal;

    const plantas = getPipes(row, ['url_plantas', 'media.plantasArquitectonicas']);
    if (plantas.length) media.plantasArquitectonicas = plantas;

    const tour = getValue(row, ['url_tour', 'media.recorridoVirtual']);
    if (tour) media.recorridoVirtual = tour;

    const vid = getValue(row, ['url_video', 'media.videoPromocional', 'media.video']);
    if (vid) media.videoPromocional = vid;

    if (Object.keys(media).length > 0) out.media = media;

    // 7. Analisis IA
    const analisis = {};
    const rIa = getStr(row, ['ia_resumen']);
    if (rIa) analisis.resumen = rIa;

    const pIa = getPipes(row, ['ia_fuertes']);
    if (pIa.length) analisis.puntosFuertes = pIa;

    const dIa = getPipes(row, ['ia_debiles']);
    if (dIa.length) analisis.puntosDebiles = dIa;

    if (Object.keys(analisis).length > 0) out.analisisIA = analisis;

    // 8. PROMOCION
    const prom = {};
    const promName = getStr(row, ['promocion.nombre', 'promocion_nombre', 'Promocion.nombre']);
    if (promName) prom.nombre = promName;

    const city = getStr(row, ['ciudad', 'timezone_city']) || 'Mexico City';

    const dates = extractPromoDates(row, city);
    if (dates.fecha_inicio) prom.fecha_inicio = dates.fecha_inicio;
    if (dates.fecha_fin) prom.fecha_fin = dates.fecha_fin;

    if (Object.keys(prom).length > 0) out.promocion = prom;

    // --- CALCULATIONS ---

    if (out.precios?.base && out.m2 > 0) {
        out.precios.metroCuadrado = Number((out.precios.base / out.m2).toFixed(2));
    }

    if (out.precios?.base && out.precios?.inicial > 0 && out.infoComercial?.fechaInicioVenta) {
        const current = out.precios.base;
        const initial = out.precios.inicial;
        const startDate = parseSimpleDate(out.infoComercial.fechaInicioVenta);

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
    const nombre = getStr(row, ['Nombre', 'nombre']);

    // 1. ID Slug Generation
    const idRow = getStr(row, ['ID', 'id']);
    if (idRow) {
        out.id = idRow;
    } else if (nombre) {
        out.id = slugify(nombre);
    }

    if (nombre) out.nombre = nombre;

    const status = getStr(row, ['Status', 'status']) || 'activo';
    out.status = status.toLowerCase();

    // 2. Fiscal
    const razon = getStr(row, ['RazonSocial', 'razon_social', 'fiscal.razonSocial']);
    if (razon) out.fiscal = { razonSocial: razon };

    // 3. Comisiones
    const comisiones = {};
    const basePct = getNum(row, ['ComisionBase', 'comision_base', 'comisiones.porcentajeBase']);
    if (basePct !== undefined) comisiones.porcentajeBase = basePct;

    const hitos = {};
    const hCredito = getHitos(row, ['HitosCredito', 'hitos_credito', 'pago_hitos_credito', 'comisiones.hitos.credito']);
    if (hCredito.length > 0) hitos.credito = hCredito;

    const hContado = getHitos(row, ['HitosContado', 'hitos_contado', 'pago_hitos_contado', 'comisiones.hitos.contado']);
    if (hContado.length > 0) hitos.contado = hContado;

    const hDirecto = getHitos(row, ['HitosDirecto', 'hitos_directo', 'pago_hitos_directo', 'comisiones.hitos.directo']);
    if (hDirecto.length > 0) hitos.directo = hDirecto;

    if (Object.keys(hitos).length > 0) comisiones.hitos = hitos;
    if (Object.keys(comisiones).length > 0) out.comisiones = comisiones;

    // 4. Contacto (Principal y Secundario)
    const contacto = {};
    const principal = {};
    const pNom = getStr(row, ['ContactoNombre', 'contacto_nombre_principal', 'contacto_nom_1', 'contacto.principal.nombre']);
    if (pNom) principal.nombre = pNom;

    const pTel = getPhone(row, ['ContactoTelefono', 'contacto_telefono_principal', 'contacto_tel_1', 'contacto.principal.telefono']);
    if (pTel) principal.telefono = pTel;

    const pMail = getEmail(row, ['ContactoEmail', 'contacto_email_principal', 'contacto_mail_1', 'contacto.principal.email']);
    if (pMail) principal.email = pMail;

    const pPuesto = getStr(row, ['ContactoPuesto', 'contacto_puesto_principal', 'contacto_puesto_1', 'contacto.principal.puesto']);
    if (pPuesto) principal.puesto = pPuesto;

    if (Object.keys(principal).length > 0) contacto.principal = principal;

    const secundario = {};
    const sNom = getStr(row, ['ContactoSecundarioNombre', 'contacto_nombre_secundario', 'contacto_nom_2', 'contacto.secundario.nombre']);
    if (sNom) secundario.nombre = sNom;

    const sTel = getPhone(row, ['ContactoSecundarioTelefono', 'contacto_telefono_secundario', 'contacto_tel_2', 'contacto.secundario.telefono']);
    if (sTel) secundario.telefono = sTel;

    const sMail = getEmail(row, ['ContactoSecundarioEmail', 'contacto_email_secundario', 'contacto_mail_2', 'contacto.secundario.email']);
    if (sMail) secundario.email = sMail;

    const sPuesto = getStr(row, ['ContactoSecundarioPuesto', 'contacto_puesto_secundario', 'contacto.secundario.puesto']);
    if (sPuesto) secundario.puesto = sPuesto;

    if (Object.keys(secundario).length > 0) contacto.secundario = secundario;

    if (Object.keys(contacto).length > 0) out.contacto = contacto;

    return out;
};

