import fs from 'fs';
import csv from 'csv-parser';
import colors from 'colors';
import { Timestamp } from 'firebase-admin/firestore';
import { initializeFirebase } from './utils.js';
import { recalculateDevelopmentStats } from './calculations.js';
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
                    } else if (collectionName === 'modelos') {
                        affectedDevelopmentIds.add(String(finalData.idDesarrollo));
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
                await recalculateDevelopmentStats(db, Array.from(affectedDevelopmentIds));
            }
        });
};
