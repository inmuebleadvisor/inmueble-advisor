// functions/migrator.js
// ÚLTIMA MODIFICACION: 02/12/2025

const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const db = getFirestore();

async function ejecutarReestructuracionV2() {
    console.log(">>> INICIANDO REESTRUCTURACIÓN COMPLETA V2.1...");
    const batchSize = 400;
    
    // --- A. MIGRAR DESARROLLOS ---
    const desarrollosRef = db.collection('desarrollos');
    const snapshotDes = await desarrollosRef.get();
    let batch = db.batch();
    let contador = 0;

    for (const doc of snapshotDes.docs) {
        const data = doc.data();
        let update = {};

        // 1. Corregir STATUS (Traducción)
        if (data.status === 'IMMEDIATE') update.status = 'Entrega Inmediata';
        else if (data.status === 'PRESALE') update.status = 'Pre-Venta';
        else if (!data.status) update.status = 'Entrega Inmediata'; // Default

        // 2. Reestructurar Info Comercial
        // Si ya existen datos sueltos, muévelos aquí, si no, inicializa en 0
        update.infoComercial = {
            fechaEntrega: data.info_comercial?.fecha_entrega || data.fecha_entrega || null,
            unidadesTotales: data.info_comercial?.unidades_proyectadas || 0,
            unidadesVendidas: data.info_comercial?.unidades_vendidas || 0,
            // Calculamos disponibles si es posible
            unidadesDisponibles: (data.info_comercial?.unidades_proyectadas || 0) - (data.info_comercial?.unidades_vendidas || 0),
            cantidadModelos: 0, // Se llenará después o manual
            plusvaliaPromedio: 0,
            fechaInicioVenta: null
        };

        // 3. Ubicación: Asegurar campo 'localidad'
        if (data.ubicacion) {
            update.ubicacion = {
                ...data.ubicacion,
                localidad: data.ubicacion.localidad || data.ubicacion.ciudad // Default ciudad si no hay localidad
            };
        }

        // 4. Media: Asegurar brochure
        if (!data.media?.brochure) {
            update["media.brochure"] = null;
        }

        batch.update(doc.ref, update);
        contador++;
        if (contador >= batchSize) { await batch.commit(); batch = db.batch(); contador = 0; }
    }
    if (contador > 0) await batch.commit();


    // --- B. MIGRAR MODELOS ---
    const modelosRef = db.collection('modelos');
    const snapshotMod = await modelosRef.get();
    batch = db.batch(); // Reiniciar
    contador = 0;

    for (const doc of snapshotMod.docs) {
        const data = doc.data();
        let update = {};
        let deletes = {};

        // 1. ELIMINAR esPreventa (Ahora vive en Desarrollo)
        deletes.esPreventa = FieldValue.delete();
        deletes.precioNumerico = FieldValue.delete(); // Borramos el campo viejo

        // 2. Precios
        const pBase = data.precioNumerico || 0;
        update.precios = {
            base: pBase,
            inicial: pBase, // Mismo valor inicial
            maximo: pBase,
            metroCuadrado: 0, // Calcular después: precio / m2
            mantenimientoMensual: data.mantenimiento || 0,
            moneda: "MXN"
        };

        // 3. Info Comercial Nueva
        update.infoComercial = {
            unidadesVendidas: 0,
            plusvaliaEstimada: 0,
            fechaInicioVenta: null
        };

        // 4. Media Nueva
        update.media = {
            ...data.media,
            plantasArquitectonicas: [],
            videoPromocional: null,
            recorridoVirtual: data.recorridoVirtual || null
        };
        
        // Ejecutar Update + Delete
        batch.update(doc.ref, { ...update, ...deletes });
        
        contador++;
        if (contador >= batchSize) { await batch.commit(); batch = db.batch(); contador = 0; }
    }
    if (contador > 0) await batch.commit();

    console.log(">>> MIGRACIÓN V2.1 FINALIZADA.");
    return { status: "OK" };
}

module.exports = { ejecutarReestructuracionV2 };