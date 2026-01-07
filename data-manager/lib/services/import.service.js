
import fs from 'fs';
import csv from 'csv-parser';
import colors from 'colors';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';


// Imports from new Structure
import { initializeFirebase as initFirebase } from '../utils.js';
import { recalculateDevelopmentStats, recalculateCityHighlights, recalculateDesarrolladorStats } from './stats.service.js';
import { logger } from '../logger.js';
import { DesarrolloSchema, ModeloSchema, DesarrolladorSchema } from '../models/schemas.js';
import { adaptDesarrollo, adaptModelo, adaptDesarrollador } from '../adapters/index.js';

export const importCollection = async (collectionName, filePath, options = {}) => {
    const db = initFirebase();
    console.log(colors.yellow(`⏳ Iniciando importación a '${collectionName}' desde '${filePath}'...`));
    if (options.region) console.log(colors.blue(`   🎯 Region Filter Active: '${options.region}'`));

    if (!fs.existsSync(filePath)) {
        logger.error(`Archivo no encontrado: ${filePath}`);
        return;
    }

    // Pre-cache Developers for Deduplication if needed
    let existingDevelopers = [];
    if (collectionName === 'desarrolladores') {
        console.log(colors.cyan(`🔍 Precargando desarrolladores para detección de duplicados...`));
        let query = db.collection('desarrolladores');

        if (options.region) {
            query = query.where('ciudades', 'array-contains', options.region);
        }

        const snap = await query.select('nombre').get();
        snap.forEach(doc => {
            const d = doc.data();
            if (d.nombre) existingDevelopers.push({ id: doc.id, nombre: d.nombre });
        });
        console.log(colors.gray(`   > ${existingDevelopers.length} desarrolladores en memoria.`));
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
            const affectedConstructorNames = new Set();
            const affectedCities = new Set();

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const rowNum = i + 1;

                try {
                    let adaptedData;
                    let validationResult;

                    if (collectionName === 'desarrollos') {
                        adaptedData = adaptDesarrollo(row);
                        validationResult = DesarrolloSchema.safeParse(adaptedData);
                    } else if (collectionName === 'desarrolladores') {
                        adaptedData = adaptDesarrollador(row);

                        // Deduplication Logic
                        if (options.fuzzy && adaptedData.nombre) {
                            const { checkDeveloperDuplicate, logDuplicate } = await import('./dedup.service.js');
                            const result = checkDeveloperDuplicate(adaptedData.nombre, existingDevelopers);

                            if (result.match) {
                                adaptedData.id = result.id;
                                logDuplicate(adaptedData.nombre, result.name, result.score);
                            }
                        }
                        validationResult = DesarrolladorSchema.safeParse(adaptedData);

                    } else if (collectionName === 'modelos') {
                        adaptedData = adaptModelo(row);
                        validationResult = ModeloSchema.safeParse(adaptedData);
                    } else {
                        adaptedData = row;
                        validationResult = { success: true, data: row };
                    }

                    if (!validationResult.success) {
                        const errMsg = validationResult.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
                        logger.warn(`Row ${rowNum} validation failed`, { row: row, errors: errMsg });
                        errorCount++;
                        process.stdout.write(colors.red('x'));
                        continue;
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

                    // Price History Logic (Modelos)
                    if (collectionName === 'modelos' && finalData.precios?.base > 0) {
                        try {
                            const currentDoc = await docRef.get();
                            if (currentDoc.exists) {
                                const currentData = currentDoc.data();
                                const oldPrice = currentData.precios?.base;

                                if (oldPrice && oldPrice !== finalData.precios.base) {
                                    /**
                                     * Subcollection: bigquery-price-history
                                     * Purpose: Detailed tracking of price changes for analytics
                                     * Schema:
                                     * @property {Timestamp} date - When the change was detected
                                     * @property {number} price - The PREVIOUS price
                                     * @property {number} newPrice - The NEW imported price
                                     * @property {boolean} available - Snapshot of availability
                                     */
                                    const historyEntry = {
                                        date: Timestamp.now(),
                                        price: Number(oldPrice),
                                        newPrice: Number(finalData.precios.base),
                                        available: finalData.disponibilidad || true
                                    };

                                    // 1. Write to Subcollection (BigQuery Extension target)
                                    // Use separate batch or immediate write? Batch is better but limits are strict.
                                    // We are inside a loop with a main batch. 
                                    // To keep it simple and safe, we can add this to the main batch if path is unique.
                                    const historyRef = docRef.collection('bigquery-price-history').doc();
                                    batch.set(historyRef, historyEntry);

                                    // 2. Keep array for simple frontend graphs (Limited to last 10?)
                                    // We keep the old array logic but cleaner
                                    const legacyHistoryEntry = {
                                        fecha: Timestamp.now(),
                                        precio: Number(oldPrice)
                                    };
                                    finalData.preciosHistoricos = FieldValue.arrayUnion(legacyHistoryEntry);

                                    // Calc Real Growth
                                    let firstPrice = oldPrice;
                                    if (currentData.precios?.inicial) firstPrice = currentData.precios.inicial;
                                    else if (currentData.preciosHistoricos && currentData.preciosHistoricos.length > 0) firstPrice = currentData.preciosHistoricos[0].precio;

                                    if (firstPrice > 0) {
                                        const growth = ((finalData.precios.base - firstPrice) / firstPrice);
                                        finalData.plusvaliaReal = Number((growth * 100).toFixed(2));
                                    }
                                }
                            }
                        } catch (e) {
                            logger.error(`Error checking history`, e);
                        }
                    }

                    batch.set(docRef, finalData, { merge: true });

                    // Tracker updates
                    if (collectionName === 'desarrollos') {
                        affectedDevelopmentIds.add(String(finalData.id));
                        if (finalData.ubicacion?.ciudad) affectedCities.add(finalData.ubicacion.ciudad);
                        if (finalData.constructora) affectedConstructorNames.add(finalData.constructora);
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
            logger.info(`Import finished. Success: ${successCount}, Errors: ${errorCount}`);

            // Post-Import Triggers (Recalculations)

            // 1. Des / Model Updates
            if (collectionName === 'modelos' && affectedDevelopmentIds.size > 0) {
                process.stdout.write(`\n🔄 Triggering Stats Recalculation...`);
                await recalculateDevelopmentStats(db, Array.from(affectedDevelopmentIds));

                // 2. Highlights
                const citiesFound = new Set();
                if (affectedCities.size > 0) affectedCities.forEach(c => citiesFound.add(c));

                // Fetch cities from updated devs to ensure we catch everything
                const devIdsArray = Array.from(affectedDevelopmentIds);
                // Optimization: Do this only if needed.
                for (const devId of devIdsArray) {
                    const devDoc = await db.collection('desarrollos').doc(devId).get();
                    const data = devDoc.data();
                    if (data?.ubicacion?.ciudad) citiesFound.add(data.ubicacion.ciudad);
                }

                if (citiesFound.size > 0) {
                    for (const city of citiesFound) await recalculateCityHighlights(db, city);
                }
            }

            // 3. Developer Updates
            const devsToRecalculate = new Set(affectedDeveloperIds);
            const resolveNamesToIds = async (names) => {
                if (names.size === 0) return;
                const namesArray = Array.from(names);
                for (const name of namesArray) {
                    const snap = await db.collection('desarrolladores').where('nombre', '==', name).limit(1).get();
                    if (!snap.empty) devsToRecalculate.add(snap.docs[0].id);
                }
            };

            if (collectionName === 'desarrollos' && affectedConstructorNames.size > 0) await resolveNamesToIds(affectedConstructorNames);
            if (collectionName === 'modelos' && affectedDevelopmentIds.size > 0) {
                // To safely update developers, we need to know WHICH developers own the affected developments.
                // Since we didn't track names during model import, we can fetch them now.
                // This replaces the previous TODO with actual logic.

                const affectedDevIdsArray = Array.from(affectedDevelopmentIds);
                // Optimize: chunking if too many, but for now linear is fine for batch imports.
                for (const dId of affectedDevIdsArray) {
                    try {
                        const devSnap = await db.collection('desarrollos').doc(dId).get();
                        if (devSnap.exists) {
                            const dData = devSnap.data();
                            if (dData.constructora) {
                                affectedConstructorNames.add(dData.constructora);
                            }
                        }
                    } catch (e) {
                        logger.error(`Error resolving constructor for dev ${dId}`, e);
                    }
                }

                await resolveNamesToIds(affectedConstructorNames);
            }

            if (devsToRecalculate.size > 0) {
                await recalculateDesarrolladorStats(db, Array.from(devsToRecalculate));
            }
        });
};
