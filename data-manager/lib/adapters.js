const parseDateHelper = (str) => {
    if (!str) return null;
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
};

export const adaptDesarrollo = (row) => {
    const out = {};

    // 1. Identifiers
    if (row.id) out.id = row.id;
    if (row.nombre) out.nombre = row.nombre;
    if (row.descripcion) out.descripcion = row.descripcion;
    if (row.constructora) out.constructora = row.constructora;
    if (row.status) out.status = row.status;
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
    // Inventory Calculation Logic (Bidirectional)
    // If we have Total + Sold -> Calc Available
    // If we have Total + Available -> Calc Sold
    const rawTotales = row.unidades_totales || row['infoComercial.unidadesTotales'];
    const rawVendidas = row.unidades_vendidas || row['infoComercial.unidadesVendidas'];
    const rawDisponibles = row.unidades_disponibles || row['infoComercial.unidadesDisponibles'];

    if (rawTotales) {
        const uT = parseFloat(rawTotales) || 0;
        info.unidadesTotales = uT;

        let uV = parseFloat(rawVendidas);
        let uD = parseFloat(rawDisponibles); // Assuming CSV might have this column

        // Case 1: Total & Sold defined -> Calc Available
        if (!isNaN(uV) && isNaN(uD)) {
            info.unidadesVendidas = uV;
            info.unidadesDisponibles = (uT - uV) > 0 ? (uT - uV) : 0;
        }
        // Case 2: Total & Available defined -> Calc Sold
        else if (isNaN(uV) && !isNaN(uD)) {
            info.unidadesDisponibles = uD;
            info.unidadesVendidas = (uT - uD) > 0 ? (uT - uD) : 0;
        }
        // Case 3: Both defined (Trust inputs or validate?) -> Trust inputs usually, but let's store both.
        else if (!isNaN(uV) && !isNaN(uD)) {
            info.unidadesVendidas = uV;
            info.unidadesDisponibles = uD;
        }
        // Case 4: Only Total. Can't infer much.
    } else {
        // Fallbacks if total is missing but others exist
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

    // 9. Analisis IA (New)
    const analisis = {};
    if (row.ia_resumen) analisis.resumen = row.ia_resumen;
    if (row.ia_fuertes) analisis.puntosFuertes = row.ia_fuertes; // Pipe separated
    if (row.ia_debiles) analisis.puntosDebiles = row.ia_debiles; // Pipe separated
    if (Object.keys(analisis).length > 0) out.analisisIA = analisis;

    return out;
};

export const adaptModelo = (row) => {
    const out = {};

    // 1. Identifiers
    // ID construction logic
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

    // Mapping ActivoModelo legacy to active
    // The schema handles 'activo' or 'ActivoModelo', but here we map to 'activo' property or leave row props.
    // Let's rely on strict mapping.
    if (row.ActivoModelo !== undefined) out.activo = row.ActivoModelo;
    else if (row.activo_modelo !== undefined) out.activo = row.activo_modelo;
    else if (row.activo !== undefined) out.activo = row.activo;

    if (row.tipo_vivienda || row.tipoVivienda) out.tipoVivienda = row.tipo_vivienda || row.tipoVivienda;

    // 2. Precios
    const precios = {};
    if (row.precio_inicial || row.precio_base || row['precios.base']) precios.base = row.precio_inicial || row.precio_base || row['precios.base'];
    if (row.precio_orig_lista || row['precios.inicial']) precios.inicial = row.precio_orig_lista || row['precios.inicial']; // New field mapping
    if (row.precio_m2 || row['precios.metroCuadrado']) precios.metroCuadrado = row.precio_m2 || row['precios.metroCuadrado']; // New field mapping
    if (row.mantenimiento || row['precios.mantenimientoMensual']) precios.mantenimientoMensual = row.mantenimiento || row['precios.mantenimientoMensual'];
    if (row['precios.moneda']) precios.moneda = row['precios.moneda'];
    if (Object.keys(precios).length > 0) out.precios = precios;

    // 3. Info Comercial
    const info = {};
    if (row.unidades_vendidas || row['infoComercial.unidadesVendidas']) info.unidadesVendidas = row.unidades_vendidas || row['infoComercial.unidadesVendidas'];
    if (row.plusvalia_pct || row['infoComercial.plusvaliaEstimada']) info.plusvaliaEstimada = row.plusvalia_pct || row['infoComercial.plusvaliaEstimada'];
    if (row.fecha_inicio || row['infoComercial.fechaInicioVenta']) info.fechaInicioVenta = row.fecha_inicio || row['infoComercial.fechaInicioVenta'];
    if (Object.keys(info).length > 0) out.infoComercial = info;

    // 4. Specs
    if (row.recamaras) out.recamaras = row.recamaras;
    if (row.banos) out.banos = row.banos;
    if (row.niveles) out.niveles = row.niveles;
    if (row.cajones) out.cajones = row.cajones;
    if (row.m2_const || row.m2) out.m2 = row.m2_const || row.m2;
    if (row.m2_terreno || row.terreno) out.terreno = row.m2_terreno || row.terreno;
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

    // 7. Analisis IA (New)
    const analisis = {};
    if (row.ia_resumen) analisis.resumen = row.ia_resumen;
    if (Object.keys(analisis).length > 0) out.analisisIA = analisis;

    // --- CALCULATIONS (Row Level) ---

    // 1. Precio por m2
    // precios.metroCuadrado = precios.base / m2
    if (out.precios?.base && out.m2 > 0) {
        out.precios.metroCuadrado = Number((out.precios.base / out.m2).toFixed(2));
    }

    // 2. Plusvalia Estimada (Anualizada)
    // Formula: ((Current - Initial) / Initial) * 100 -> Total %
    // Annualized: (Total % / MonthsSinceStart) * 12
    if (out.precios?.base && out.precios?.inicial > 0 && out.infoComercial?.fechaInicioVenta) {
        const current = out.precios.base;
        const initial = out.precios.inicial;
        const startDate = parseDateHelper(out.infoComercial.fechaInicioVenta);

        if (startDate) {
            const now = new Date();
            // Diff in months
            const yearsDiff = now.getFullYear() - startDate.getFullYear();
            const monthsDiff = (yearsDiff * 12) + (now.getMonth() - startDate.getMonth());

            // Avoid division by zero or negative time. Minimum 1 month.
            const safeMonths = monthsDiff < 1 ? 1 : monthsDiff;

            const totalGrowthPct = ((current - initial) / initial); // e.g. 0.5 for 50%
            const annualizedGrowth = (totalGrowthPct / safeMonths) * 12; // Annualized rate e.g. 0.6

            // Store as percentage number (e.g. 60.0 instead of 0.6)
            out.infoComercial.plusvaliaEstimada = Number((annualizedGrowth * 100).toFixed(2));
        }
    }

    // 3. Unidades Disponibles (Model Internal Logic)
    // Usually 'unidadesDisponibles' is on Development, but models might carry this?
    // Schema says Models have 'unidadesVendidas'. 'unidadesTotales' is usually Dev level,
    // but sometimes Models have a limit. Schema for Models doesn't explicit 'unidadesTotales' or 'disponibles'.
    // It only has 'unidadesVendidas'. So we skip specific inventory calc for Model unless we infer it.

    return out;
};
