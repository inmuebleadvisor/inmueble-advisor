import fs from 'fs';
import csv from 'csv-parser';
import colors from 'colors';
import { Timestamp } from 'firebase-admin/firestore';
import { initializeFirebase } from './utils.js';
import { recalculateDevelopmentStats, recalculateCityHighlights, recalculateDesarrolladorStats } from './calculations.js';
import { logger } from './logger.js';
import { DesarrolloSchema, ModeloSchema, DesarrolladorSchema } from './schemas.js';
import { adaptDesarrollo, adaptModelo, adaptDesarrollador } from './adapters.js';

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
            const affectedDeveloperIds = new Set();
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

                    } else if (collectionName === 'desarrolladores') {
                        adaptedData = adaptDesarrollador(row);
                        validationResult = DesarrolladorSchema.safeParse(adaptedData);

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
                    } else if (collectionName === 'desarrolladores') {
                        affectedDeveloperIds.add(String(finalData.id));
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

            // Trigger recalculation ONLY if models were imported.
            // If we import 'desarrollos', we want to keep the manual values from CSV, not overwrite them with empty model stats.
            if (collectionName === 'modelos' && affectedDevelopmentIds.size > 0) {
                // 4. Recalculate Development Stats (Precio Desde, etc.)
                process.stdout.write(`\n🔄 Iniciando recálculo automático para ${affectedDevelopmentIds.size} desarrollos...`);

                await recalculateDevelopmentStats(db, Array.from(affectedDevelopmentIds));
                process.stdout.write(`\n✅ Recálculo completado. ${affectedDevelopmentIds.size} desarrollos actualizados.`);

                // 5. Detect Cities from Affected Developments to trigger Highlights
                // Since models import implies updates to dev stats, we can query these devs to find their cities.
                process.stdout.write(`\n🔍 Identificando ciudades para actualizar Highlights...`);

                const citiesFound = new Set();
                if (affectedCities.size > 0) affectedCities.forEach(c => citiesFound.add(c));

                const devIdsArray = Array.from(affectedDevelopmentIds);

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
            } else if (collectionName === 'desarrollos' && affectedCities.size > 0) {
                // If importing developments, we might want to update highlights in case city names changed or new devs appeared?
                // But highlights are model-based. If I add a dev, it doesn't have active models yet.
                // So skipping highlights for dev import is generally safe and cleaner.
            }

            if (collectionName === 'desarrolladores' && affectedDeveloperIds.size > 0) {
                await recalculateDesarrolladorStats(db, Array.from(affectedDeveloperIds));
            }
        });
};
