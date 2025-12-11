import fs from 'fs';
import csv from 'csv-parser';
import { initializeFirebase } from './utils.js';
import colors from 'colors';
import { Timestamp } from 'firebase-admin/firestore';

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

const getMaxDesarrolloId = async (db) => {
    const snapshot = await db.collection('desarrollos').get();
    let max = 0;
    snapshot.forEach(doc => {
        const num = parseInt(doc.id);
        if (!isNaN(num) && num > max) max = num;
    });
    // Si no hay ids, iniciamos en 1000? O en 0? Asumiremos 0 -> 0001 si está vacía, o lo que diga el max.
    // El usuario mencionó 4 dígitos. Si max es 0, quizás deberíamos empezar en 1000.
    return max > 0 ? max : 999;
};

// --- MAPEO DINÁMICO (Soporta Partial Updates) ---
const mapearDesarrollo = (row) => {
    const out = {};

    // Identificadores
    if ('id' in row && row.id) {
        out.id = row.id;
    }
    // NOTA: Se eliminó la generación automática de slugs por corrección del usuario (IDs numéricos de 4 dígitos)

    if ('nombre' in row) out.nombre = row.nombre;
    if ('status' in row) out.status = row.status || 'Entrega Inmediata';
    if ('constructora' in row) out.constructora = row.constructora;
    if ('descripcion' in row) out.descripcion = row.descripcion;
    if ('keywords' in row) out.keywords = parseArray(row.keywords);
    if ('score' in row) out.scoreDesarrollo = parseNumber(row.score);

    // Ubicacion
    const ubicacion = {};
    if ('calle' in row) ubicacion.calle = row.calle;
    if ('colonia' in row) ubicacion.colonia = row.colonia;
    if ('localidad' in row) ubicacion.localidad = row.localidad || row.ciudad;
    if ('ciudad' in row) ubicacion.ciudad = row.ciudad;
    if ('estado' in row) ubicacion.estado = row.estado;
    if ('zona' in row) ubicacion.zona = row.zona;
    if ('latitud' in row) ubicacion.latitud = parseNumber(row.latitud);
    if ('longitud' in row) ubicacion.longitud = parseNumber(row.longitud);
    if (Object.keys(ubicacion).length > 0) out.ubicacion = ubicacion;

    // Precios
    const precios = {};
    if ('precio_desde' in row) precios.desde = parseNumber(row.precio_desde);
    if (Object.keys(precios).length > 0) {
        precios.moneda = 'MXN'; // Default si tocamos precios
        out.precios = precios;
    }

    // Financiamiento
    const fin = {};
    if ('fin_creditos' in row) fin.aceptaCreditos = parseArray(row.fin_creditos);
    if ('fin_apartado' in row) fin.apartadoMinimo = parseNumber(row.fin_apartado);
    if ('fin_enganche' in row) fin.engancheMinimoPorcentaje = parseNumber(row.fin_enganche);
    if (Object.keys(fin).length > 0) out.financiamiento = fin;

    // Info Comercial
    const info = {};
    if ('fecha_entrega' in row) info.fechaEntrega = parseDate(row.fecha_entrega);
    if ('fecha_inicio' in row) info.fechaInicioVenta = parseDate(row.fecha_inicio);
    if ('num_modelos' in row) info.cantidadModelos = parseNumber(row.num_modelos);
    if ('plusvalia_pct' in row) info.plusvaliaPromedio = parseNumber(row.plusvalia_pct);
    // Calculados solo si están las columnas base
    if ('unidades_totales' in row) info.unidadesTotales = parseNumber(row.unidades_totales);
    if ('unidades_vendidas' in row) info.unidadesVendidas = parseNumber(row.unidades_vendidas);
    if ('unidades_totales' in row && 'unidades_vendidas' in row) {
        const disp = parseNumber(row.unidades_totales) - parseNumber(row.unidades_vendidas);
        info.unidadesDisponibles = disp < 0 ? 0 : disp;
    }
    if (Object.keys(info).length > 0) out.infoComercial = info;

    // Amenidades
    if ('amenidades' in row) out.amenidades = parseArray(row.amenidades);

    // Media
    const media = {};
    if ('img_cover' in row) media.cover = row.img_cover;
    if ('img_galeria' in row) media.gallery = parseArray(row.img_galeria);
    if ('url_brochure' in row) media.brochure = row.url_brochure;
    if ('url_video' in row) media.video = row.url_video;
    if (Object.keys(media).length > 0) out.media = media;

    // Legal
    if ('regimen' in row) out.legal = { regimenPropiedad: row.regimen || 'Condominio' };
    else if (!row.id) out.legal = { regimenPropiedad: 'Condominio' }; // Solo default en creación

    return out;
};

const mapearModelo = (row) => {
    const out = {};

    // ID Handling
    if ('id' in row && row.id) {
        out.id = row.id;
    } else if ('id_desarrollo' in row && 'nombre_modelo' in row) {
        // Estructura estricta: ID_DESARROLLO + NOMBRE_MODELO (Slug)
        // Ejemplo: "torre-centro-modelo-a"
        const slugModelo = row.nombre_modelo.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        out.id = `${row.id_desarrollo}-${slugModelo}`;
    }

    if ('id_desarrollo' in row) out.idDesarrollo = row.id_desarrollo;
    if ('nombre_modelo' in row) out.nombreModelo = row.nombre_modelo;
    if ('tipo_vivienda' in row) out.tipoVivienda = row.tipo_vivienda || 'Casas';

    // Precios
    const precios = {};
    if ('precio_inicial' in row) {
        precios.base = parseNumber(row.precio_inicial);
        precios.inicial = parseNumber(row.precio_inicial);
        precios.maximo = parseNumber(row.precio_max) || parseNumber(row.precio_inicial);
    }
    if ('precio_m2' in row) precios.metroCuadrado = parseNumber(row.precio_m2);
    if ('mantenimiento' in row) precios.mantenimientoMensual = parseNumber(row.mantenimiento);
    if (Object.keys(precios).length > 0) {
        precios.moneda = 'MXN';
        out.precios = precios;
    }

    // Info
    const info = {};
    if ('unidades_vendidas' in row) info.unidadesVendidas = parseNumber(row.unidades_vendidas);
    if ('plusvalia_pct' in row) info.plusvaliaEstimada = parseNumber(row.plusvalia_pct);
    if ('fecha_inicio' in row) info.fechaInicioVenta = parseDate(row.fecha_inicio);
    if (Object.keys(info).length > 0) out.infoComercial = info;

    // Specs
    if ('recamaras' in row) out.recamaras = parseNumber(row.recamaras);
    if ('banos' in row) out.banos = parseNumber(row.banos);
    if ('niveles' in row) out.niveles = parseNumber(row.niveles);
    if ('cajones' in row) out.cajones = parseNumber(row.cajones);
    if ('m2_const' in row) out.m2 = parseNumber(row.m2_const);
    if ('m2_terreno' in row) out.terreno = parseNumber(row.m2_terreno);

    // Acabados
    const acabados = {};
    if ('acabado_cocina' in row) acabados.cocina = row.acabado_cocina;
    if ('acabado_pisos' in row) acabados.pisos = row.acabado_pisos;
    if (Object.keys(acabados).length > 0) out.acabados = acabados;

    // Amenidades
    if ('amenidades' in row) out.amenidades = parseArray(row.amenidades);

    // Media
    const media = {};
    if ('img_cover' in row) media.cover = row.img_cover;
    if ('img_galeria' in row) media.gallery = parseArray(row.img_galeria);
    if ('url_plantas' in row) media.plantasArquitectonicas = parseArray(row.url_plantas);
    if ('url_tour' in row) media.recorridoVirtual = row.url_tour;
    if ('url_video' in row) media.videoPromocional = row.url_video;
    if (Object.keys(media).length > 0) out.media = media;

    // Ubicacion (Placeholder/Copy)
    // Si el CSV trae lat/long para modelo, genial. Si no, no tocamos.
    if ('latitud' in row || 'longitud' in row) {
        out.ubicacion = {
            latitud: parseNumber(row.latitud),
            longitud: parseNumber(row.longitud)
        };
    }

    return out;
};

export const importCollection = async (collectionName, filePath) => {
    const db = initializeFirebase();
    console.log(colors.yellow(`⏳ Iniciando importación a '${collectionName}' desde '${filePath}'...`));

    if (!fs.existsSync(filePath)) {
        console.error(colors.red('❌ El archivo no existe.'));
        return;
    }

    const rows = [];
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => rows.push(data))
        .on('end', async () => {
            console.log(colors.cyan(`📥 Procesando ${rows.length} registros...`));

            let batch = db.batch();
            let count = 0;
            let totalProcessed = 0;

            for (const row of rows) {
                let docData;
                let docRef;

                if (collectionName === 'desarrollos') {
                    docData = mapearDesarrollo(row);
                    // Lógica de recuperación de ID por Nombre (Para el flujo de 2 archivos)
                    if (!docData.id && docData.nombre) {
                        const snapshot = await db.collection('desarrollos')
                            .where('nombre', '==', docData.nombre)
                            .limit(1)
                            .get();

                        if (!snapshot.empty) {
                            docData.id = snapshot.docs[0].id;
                            console.log(colors.gray(`   🔗 Vinculado por nombre: '${docData.nombre}' -> ID: ${docData.id}`));
                        }
                    }
                } else if (collectionName === 'modelos') {
                    docData = mapearModelo(row);
                } else {
                    docData = row;
                }

                if (docData.id) {
                    docRef = db.collection(collectionName).doc(String(docData.id));
                } else {
                    // Si sigue sin ID (es nuevo y no trae ID), generamos uno nuevo o error?
                    // Para desarrollos con ID numérico estricto, esto debería idealmente venir en el CSV.
                    // Si no viene, Firebase asigna uno aleatorio (Auto-ID), lo cual rompe el formato 4 digitos.
                    // Warn user?
                    docRef = db.collection(collectionName).doc();
                    if (collectionName === 'desarrollos') {
                        console.warn(colors.yellow(`   ⚠️ ALERTA: Desarrollo '${docData.nombre}' sin ID. Se asignó Auto-ID: ${docRef.id}. Esto podría no ser lo que buscas.`));
                    }
                    docData.id = docRef.id;
                }

                docData.updatedAt = Timestamp.now();
                batch.set(docRef, docData, { merge: true });
                count++;
                totalProcessed++;

                if (count >= 400) { // Batch limit is 500
                    await batch.commit();
                    batch = db.batch();
                    count = 0;
                    process.stdout.write('.');
                }
            }

            if (count > 0) {
                await batch.commit();
            }

            console.log(colors.green(`\n✅ Importación completada. ${totalProcessed} documentos procesados.`));
        });
};
