import fs from 'fs';
import csv from 'csv-parser';
import colors from 'colors';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { initializeFirebase } from './utils.js';
import stringSimilarity from 'string-similarity';
import fs from 'fs'; // Ensure fs is imported if used (already top of file, so this chunk is just replacing one line)
// Re-importing fs for safety in chunk context if needed, but 'fs' is already at line 1.
// We just need to add stringSimilarity

import { recalculateDevelopmentStats, recalculateCityHighlights, recalculateDesarrolladorStats } from './calculations.js';
import { logger } from './logger.js';
import { DesarrolloSchema, ModeloSchema, DesarrolladorSchema } from './schemas.js';
import { adaptDesarrollo, adaptModelo, adaptDesarrollador } from './adapters.js';

export const importCollection = async (collectionName, filePath, options = {}) => {
    const db = initializeFirebase();
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
            // Memory Optimization: Only load devs active in this city
            // Matches strict string or array-contains? 
            // In Firestore, 'array-contains' is for single value in array.
            // We assume 'ciudades' field is an array of strings like "Culiacán", "Mazatlán".
            // Since we don't have exact ID matching yet for cities in Devs (unless migrated), we search by Name.
            // User input 'region' should ideally match the stored city name.
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

                        if (collectionName === 'desarrolladores') {
                            adaptedData = adaptDesarrollador(row);

                            // Deduplication Logic
                            if (adaptedData.nombre && existingDevelopers.length > 0) {
                                // Find best match
                                const matches = stringSimilarity.findBestMatch(adaptedData.nombre, existingDevelopers.map(d => d.nombre));
                                const best = matches.bestMatch;

                                if (best.rating > 0.85) {
                                    const matchedDev = existingDevelopers[matches.bestMatchIndex];
                                    adaptedData.id = matchedDev.id; // Reuse ID

                                    // Log duplication
                                    const dupLog = {
                                        incoming: adaptedData.nombre,
                                        existing: matchedDev.nombre,
                                        score: best.rating,
                                        action: 'MERGED'
                                    };
                                    // Simple file append for logs/duplicates.json (simulated valid JSON array structure requires read/write whole file, 
                                    // using line-delimited JSON or just appending text for now to be safe and simple)
                                    fs.appendFileSync('./logs/duplicates.json', JSON.stringify(dupLog) + '\n');

                                    console.log(colors.yellow(`   ⚠️  Duplicado detectado: '${adaptedData.nombre}' ~= '${matchedDev.nombre}' (${(best.rating * 100).toFixed(0)}%). Fusionando.`));
                                }
                            }

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

                        // Price History & Real Growth Logic (Models Only)
                        if (collectionName === 'modelos' && finalData.precios?.base > 0) {
                            try {
                                const currentDoc = await docRef.get();
                                if (currentDoc.exists) {
                                    const currentData = currentDoc.data();
                                    const oldPrice = currentData.precios?.base;

                                    if (oldPrice && oldPrice !== finalData.precios.base) {
                                        // Price Changed!
                                        const historyEntry = {
                                            fecha: Timestamp.now(),
                                            precio: Number(oldPrice)
                                        };

                                        // Add to history
                                        finalData.preciosHistoricos = FieldValue.arrayUnion(historyEntry);

                                        // Calculate Real Plusvalia
                                        // We need the VERY FIRST price recorded (or the oldest in history)
                                        // If history exists, take the first element's price. If not, take 'oldPrice'.
                                        let firstPrice = oldPrice;
                                        if (currentData.preciosHistoricos && currentData.preciosHistoricos.length > 0) {
                                            // Assume chronological order? Usually arrayUnion adds to end, so index 0 is oldest? 
                                            // Actually arrayUnion specific order isn't guaranteed if concurrency, but usually append.
                                            // Better: Find min date? For simplicity, we assume first pushed is oldest.
                                            // Or better, checking 'precios.inicial' if available?
                                            // Let's rely on 'precios.inicial' if set, otherwise traverse history.
                                            if (currentData.precios?.inicial) {
                                                firstPrice = currentData.precios.inicial;
                                            } else {
                                                firstPrice = currentData.preciosHistoricos[0].precio;
                                            }
                                        } else if (currentData.precios?.inicial) {
                                            firstPrice = currentData.precios.inicial;
                                        }

                                        if (firstPrice > 0) {
                                            const growth = ((finalData.precios.base - firstPrice) / firstPrice);
                                            finalData.plusvaliaReal = Number((growth * 100).toFixed(2));
                                        }

                                        console.log(colors.magenta(`   💰 Cambio de precio en ${finalData.id}: $${oldPrice} -> $${finalData.precios.base}`));
                                    }
                                }
                            } catch (e) {
                                logger.error(`Error checking price history for ${finalData.id}`, e);
                            }
                        }

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
                } // End of For Loop

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
