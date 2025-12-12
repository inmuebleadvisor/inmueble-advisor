import fs from 'fs';
import csv from 'csv-parser';
import colors from 'colors';
import { Timestamp } from 'firebase-admin/firestore';
import { initializeFirebase } from './utils.js';
import { recalculateDevelopmentStats, recalculateCityHighlights } from './calculations.js';
import { logger } from './logger.js';
import { DesarrolloSchema, ModeloSchema } from './schemas.js';
import { adaptDesarrollo, adaptModelo } from './adapters.js';

export const importCollection = async (collectionName, filePath) => {
    const db = initializeFirebase();
    console.log(colors.yellow(`⏳ Iniciando importación a '${collectionName}' desde '${filePath}'...`));

    if (!fs.existsSync(filePath)) {
        logger.error(`Archivo no encontrado: ${filePath}`);
        return;
    }

    const rows = [];
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => rows.push(data))
        .on('end', async () => {
            console.log(colors.cyan(`📥 Procesando ${rows.length} registros...`));

            let batch = db.batch();
            let batchCount = 0;
            let successCount = 0;
            let errorCount = 0;

            const affectedDevelopmentIds = new Set();
            const affectedCities = new Set(); // Track cities for highlights
            const errors = [];

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const rowNum = i + 1; // 1-based index for logs

                try {
                    let adaptedData;
                    let validationResult;

                    if (collectionName === 'desarrollos') {
                        adaptedData = adaptDesarrollo(row);

                        // Link ID by Name if missing
                        if (!adaptedData.id && adaptedData.nombre) {
                            const snapshot = await db.collection('desarrollos')
                                .where('nombre', '==', adaptedData.nombre)
                                .limit(1)
                                .get();

                            if (!snapshot.empty) {
                                adaptedData.id = snapshot.docs[0].id;
                                console.log(colors.gray(`   🔗 Vinculado: '${adaptedData.nombre}' -> ${adaptedData.id}`));
                            }
                        }

                        validationResult = DesarrolloSchema.safeParse(adaptedData);

                    } else if (collectionName === 'modelos') {
                        adaptedData = adaptModelo(row);
                        validationResult = ModeloSchema.safeParse(adaptedData);
                    } else {
                        // Generic fallback (no validation)
                        adaptedData = row;
                        validationResult = { success: true, data: row };
                    }

                    if (!validationResult.success) {
                        const errMsg = validationResult.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
                        logger.warn(`Row ${rowNum} validation failed`, { row: row, errors: errMsg });
                        errorCount++;
                        process.stdout.write(colors.red('x'));
                        continue; // Skip invalid rows
                    }

                    const finalData = validationResult.data;

                    // ID Handling
                    let docRef;
                    if (finalData.id) {
                        docRef = db.collection(collectionName).doc(String(finalData.id));
                    } else {
                        docRef = db.collection(collectionName).doc();
                        finalData.id = docRef.id;
                        logger.info(`Row ${rowNum}: Auto-generated ID ${finalData.id}`);
                    }

                    // Metadata
                    finalData.updatedAt = Timestamp.now();

                    batch.set(docRef, finalData, { merge: true });

                    // Stats Tracking
                    if (collectionName === 'desarrollos') {
                        affectedDevelopmentIds.add(String(finalData.id));
                        if (finalData.ubicacion?.ciudad) affectedCities.add(finalData.ubicacion.ciudad);
                    } else if (collectionName === 'modelos') {
                        affectedDevelopmentIds.add(String(finalData.idDesarrollo));
                        // For models, we need the city. Usually dev has it. 
                        // Optimization: We re-calc stats anyway, so we can fetch city then?
                        // Better: If we import models, we can assume we might want to check DB for dev city or pass it in CSV?
                        // The CSV doesn't strictly have 'ciudad' for models.
                        // Option: Just rely on fetching dev later? Or query dev now?
                        // Let's add 'recalculateCityHighlights' step to query devs of affectedDevelopmentIds to find cities efficiently later.
                    }

                    batchCount++;
                    successCount++;
                    process.stdout.write(colors.green('.'));

                } catch (err) {
                    logger.error(`Row ${rowNum} unexpected error`, { error: err.message, row });
                    errorCount++;
                    process.stdout.write(colors.red('E'));
                }

                // Batch Commit Logic
                if (batchCount >= 400) {
                    await batch.commit();
                    batch = db.batch();
                    batchCount = 0;
                }
            }

            if (batchCount > 0) {
                await batch.commit();
            }

            console.log(colors.green(`\n✅ Importación finalizada.`));
            console.log(`   Exitosos: ${successCount}`);
            console.log(`   Errores:  ${errorCount} (Ver logs para detalles)`);
            logger.info(`Import finished. Success: ${successCount}, Errors: ${errorCount}`);

            // Trigger recalculation if developments or models were touched
            if (affectedDevelopmentIds.size > 0) {
                // If dev info changed (precioDesde manually set in CSV?), we might overwrite it with recalc.
                // But typically recalc is desired to keep sync.
                // 4. Recalculate Development Stats (Precio Desde, etc.)
                process.stdout.write(`\n🔄 Iniciando recálculo automático para ${affectedDevelopmentIds.size} desarrollos...`);
                // We can capture cities here while updating devs
                const citiesFound = new Set();
                if (affectedCities.size > 0) affectedCities.forEach(c => citiesFound.add(c));

                // existing logic... we need to modify recalculateDevelopmentStats to return cities or we query them separately?
                // Let's just run dev stats first.
                await recalculateDevelopmentStats(db, Array.from(affectedDevelopmentIds));
                process.stdout.write(`\n✅ Recálculo completado. ${affectedDevelopmentIds.size} desarrollos actualizados.`);

                // 5. Detect Cities from Affected Developments to trigger Highlights
                // Since models import implies updates to dev stats, we can query these devs to find their cities.
                process.stdout.write(`\n🔍 Identificando ciudades para actualizar Highlights...`);
                // Note: Firestore 'in' query limited to 10. We might have many devs.
                // Let's perform a simple loop or use the fact that we might have many IDs.
                // It's safer to read the modified devs one by one or in batches.
                const devIdsArray = Array.from(affectedDevelopmentIds);
                // We can batch read 10 at a time or just iterate since it's a CLI tool.

                for (const devId of devIdsArray) {
                    const devDoc = await db.collection('desarrollos').doc(devId).get();
                    const data = devDoc.data();
                    if (data?.ubicacion?.ciudad) {
                        citiesFound.add(data.ubicacion.ciudad);
                    }
                }

                // 6. Recalculate Highlights for Affected Cities
                if (citiesFound.size > 0) {
                    console.log(`\n🏆 Actualizando Highlights para [${Array.from(citiesFound).join(', ')}]...`);
                    for (const city of citiesFound) {
                        await recalculateCityHighlights(db, city);
                    }
                }
            }
        });
};
