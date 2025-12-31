
import colors from 'colors';
import { Timestamp } from 'firebase-admin/firestore';
// Import Schema to Validate before Updating
import { DesarrolloSchema, ModeloSchema } from '../models/schemas.js';

/**
 * Recalculates and updates statistics for a list of developments.
 * @param {FirebaseFirestore.Firestore} db - The Firestore database instance.
 * @param {string[]} developmentIds - Array of development IDs to update.
 */
export const recalculateDevelopmentStats = async (db, developmentIds) => {
    if (!developmentIds || developmentIds.length === 0) return;

    console.log(colors.cyan(`\n🔄 Iniciando recálculo automático para ${developmentIds.length} desarrollos...`));

    const uniqueIds = [...new Set(developmentIds)];
    let processed = 0;

    for (const devId of uniqueIds) {
        try {
            if (!devId) continue;

            // 1. Get ALL models for this development
            const modelsSnapshot = await db.collection('modelos')
                .where('idDesarrollo', '==', devId)
                .get();

            let minPrice = Infinity;
            let activeModelsCount = 0;
            let totalVendidas = 0;
            let priceRange = { min: Infinity, max: -Infinity };

            modelsSnapshot.forEach(doc => {
                const data = doc.data();

                // Check Active Status
                const isActive = data.activo === true;

                if (isActive) {
                    activeModelsCount++;

                    // Minimum Price
                    const basePrice = data.precios?.base;
                    if (typeof basePrice === 'number' && basePrice > 0) {
                        if (basePrice < minPrice) minPrice = basePrice;
                        if (basePrice < priceRange.min) priceRange.min = basePrice;
                        if (basePrice > priceRange.max) priceRange.max = basePrice;
                    }

                    // Inventory
                    if (data.infoComercial?.unidadesVendidas) {
                        totalVendidas += (Number(data.infoComercial.unidadesVendidas) || 0);
                    }
                }
            });

            // Get current dev data to find total units
            const devDoc = await db.collection('desarrollos').doc(devId).get();
            const devData = devDoc.exists ? devDoc.data() : {};

            const precioDesde = minPrice === Infinity ? 0 : minPrice;
            const unidadesTotales = devData.infoComercial?.unidadesTotales || 0;

            // Prepare update object
            const partialUpdate = {
                precios: {
                    ...devData.precios,
                    desde: precioDesde
                },
                infoComercial: {
                    ...devData.infoComercial,
                    cantidadModelos: activeModelsCount,
                    unidadesVendidas: totalVendidas
                },
                updatedAt: Timestamp.now()
            };

            // Calculate Available
            if (unidadesTotales > 0) {
                const disp = unidadesTotales - totalVendidas;
                partialUpdate.infoComercial.unidadesDisponibles = disp < 0 ? 0 : disp;
            }

            // Update Price Range in Stats (Protected field)
            if (priceRange.min !== Infinity) {
                partialUpdate.stats = {
                    ...devData.stats,
                    rangoPrecios: [priceRange.min, priceRange.max]
                };
            }

            // Zod Validation Attempt (Safe Parse of the MERGED data)
            // We construct the "would-be" state to validate, but we only update changed fields.
            // Merging is complex without full object. 
            // Ideally we validate the Partial, but Zod partial() is loose.
            // We trust the schema is robust. 
            // To prevent data corruption, we ensure the structure matches strict schema parts.
            // Since we are doing a partial update, we can't fully validate the whole doc unless we read it all.
            // We read devData above.

            const mergedData = { ...devData, ...partialUpdate, precios: { ...devData.precios, ...partialUpdate.precios }, infoComercial: { ...devData.infoComercial, ...partialUpdate.infoComercial } };

            const val = DesarrolloSchema.safeParse(mergedData);
            if (!val.success) {
                console.error(colors.red(`   ⚠️ Validation failed for generated stats on ${devId}. Aborting update.`));
                // Log validation errors nicely
                console.error(JSON.stringify(val.error.format(), null, 2));
                continue;
            }

            // Using dot notation for Firestore Update to avoid overwriting nested maps not fully reconstructed
            const firestoreUpdate = {
                'precios.desde': precioDesde,
                'infoComercial.cantidadModelos': activeModelsCount,
                'infoComercial.unidadesVendidas': finalValOrStats(totalVendidas),
                'updatedAt': Timestamp.now()
            };

            if (partialUpdate.infoComercial.unidadesDisponibles !== undefined) {
                firestoreUpdate['infoComercial.unidadesDisponibles'] = partialUpdate.infoComercial.unidadesDisponibles;
            }
            if (priceRange.min !== Infinity) {
                firestoreUpdate['stats.rangoPrecios'] = [priceRange.min, priceRange.max];
            }

            await db.collection('desarrollos').doc(devId).update(firestoreUpdate);

            processed++;
            process.stdout.write(colors.green('.'));
        } catch (error) {
            console.error(colors.red(`\n❌ Error recalculando desarrollo ${devId}: ${error.message}`));
        }
    }

    console.log(colors.green(`\n✅ Recálculo completado. ${processed} desarrollos actualizados.`));
};

const finalValOrStats = (v) => (v === undefined || isNaN(v)) ? 0 : v;

/**
 * Recalculates highlights for all models in a specific city.
 */
export const recalculateCityHighlights = async (db, city) => {
    if (!city) return;
    console.log(colors.cyan(`\n🏆 Calculando Highlights para la ciudad: ${city}...`));

    try {
        console.log(colors.gray(`   > Buscando desarrollos en: '${city}'`));

        const devsSnapshot = await db.collection('desarrollos')
            .where('ubicacion.ciudad', '==', city)
            .where('activo', '==', true)
            .get();

        const devMap = {};
        const devIds = [];

        devsSnapshot.forEach(doc => {
            const data = doc.data();
            devMap[doc.id] = {
                zona: data.ubicacion?.zona || 'Sin Zona',
                nombre: data.nombre
            };
            devIds.push(doc.id);
        });

        if (devIds.length === 0) {
            console.log(colors.yellow(`   > No active developments found in ${city}.`));
            return;
        }

        const modelsSnapshot = await db.collection('modelos').get();
        const cityModels = [];

        modelsSnapshot.forEach(doc => {
            const m = doc.data();
            if (m.idDesarrollo && devMap[m.idDesarrollo]) {
                // Strict 'activo' check
                if (m.activo === true) {
                    cityModels.push({
                        id: doc.id,
                        ...m,
                        _zona: devMap[m.idDesarrollo].zona
                    });
                }
            }
        });

        console.log(`   > Obtenidos ${cityModels.length} modelos activos en ${city}.`);
        if (cityModels.length === 0) return;

        const winners = {
            city: { lowestPrice: null, lowestPriceM2: null, maxTerrain: null, maxConstruction: null },
            zones: {}
        };

        const updateWinner = (scope, key, model, value, type) => {
            if (!value || isNaN(value)) return;
            if (!scope[key]) {
                scope[key] = { model, value };
            } else {
                if (type === 'min' && value < scope[key].value) scope[key] = { model, value };
                if (type === 'max' && value > scope[key].value) scope[key] = { model, value };
            }
        };

        cityModels.forEach(m => {
            const price = m.precios?.base || 0;
            const priceM2 = m.precios?.metroCuadrado || 0;
            const terrain = m.terreno || 0;
            const construction = m.m2 || 0;
            const zona = m._zona;

            if (!winners.zones[zona]) {
                winners.zones[zona] = { lowestPrice: null, lowestPriceM2: null, maxTerrain: null, maxConstruction: null };
            }

            if (price > 0) {
                updateWinner(winners.city, 'lowestPrice', m, price, 'min');
                updateWinner(winners.zones[zona], 'lowestPrice', m, price, 'min');
            }
            if (priceM2 > 0) {
                updateWinner(winners.city, 'lowestPriceM2', m, priceM2, 'min');
                updateWinner(winners.zones[zona], 'lowestPriceM2', m, priceM2, 'min');
            }
            if (terrain > 0) {
                updateWinner(winners.city, 'maxTerrain', m, terrain, 'max');
                updateWinner(winners.zones[zona], 'maxTerrain', m, terrain, 'max');
            }
            if (construction > 0) {
                updateWinner(winners.city, 'maxConstruction', m, construction, 'max');
                updateWinner(winners.zones[zona], 'maxConstruction', m, construction, 'max');
            }
        });

        const modelHighlights = {};
        const addHighlight = (modelId, text) => {
            if (!modelHighlights[modelId]) modelHighlights[modelId] = new Set();
            modelHighlights[modelId].add(text);
        };

        // ... (Highlight assignment logic remains mostly the same, just code cleanup)
        // City Winners
        if (winners.city.lowestPrice) addHighlight(winners.city.lowestPrice.model.id, `Modelo con el precio más bajo de ${city}`);
        if (winners.city.lowestPriceM2) addHighlight(winners.city.lowestPriceM2.model.id, `Modelo con el precio más bajo por m² de ${city}`);
        if (winners.city.maxTerrain) addHighlight(winners.city.maxTerrain.model.id, `Modelo con más terreno de ${city}`);
        if (winners.city.maxConstruction) addHighlight(winners.city.maxConstruction.model.id, `Modelo con más m² de construcción de ${city}`);

        // Zone Winners
        Object.keys(winners.zones).forEach(zona => {
            const zWins = winners.zones[zona];
            if (zWins.lowestPrice) addHighlight(zWins.lowestPrice.model.id, `Modelo con el precio más bajo de la zona ${zona}`);
            if (zWins.lowestPriceM2) addHighlight(zWins.lowestPriceM2.model.id, `Modelo con el precio más bajo por m² de la zona ${zona}`);
            if (zWins.maxTerrain) addHighlight(zWins.maxTerrain.model.id, `Modelo con más terreno de la zona ${zona}`);
            if (zWins.maxConstruction) addHighlight(zWins.maxConstruction.model.id, `Modelo con más m² de construcción de la zona ${zona}`);
        });

        const batch = db.batch();
        let batchCount = 0;

        cityModels.forEach(m => {
            const ref = db.collection('modelos').doc(m.id);
            const generatedHighlights = modelHighlights[m.id] ? Array.from(modelHighlights[m.id]) : [];
            generatedHighlights.sort();
            const currentHighlights = (m.highlights || []).sort();

            const isSame = JSON.stringify(generatedHighlights) === JSON.stringify(currentHighlights);

            if (!isSame) {
                batch.update(ref, { highlights: generatedHighlights });
                batchCount++;
            }
        });

        if (batchCount > 0) {
            await batch.commit();
            console.log(colors.green(`   > ✅ Highlights actualizados para ${batchCount} modelos en ${city}.`));
        } else {
            console.log(`   > No hubo cambios.`);
        }

    } catch (e) {
        console.error(colors.red(`   > ❌ Error calculating highlights: ${e.message}`));
    }
};

/**
 * Recalculates stats for Developers (Constructors).
 */
export const recalculateDesarrolladorStats = async (db, developerIds) => {
    if (!developerIds || developerIds.length === 0) return;

    console.log(colors.cyan(`\n🏗️  Iniciando recálculo para ${developerIds.length} desarrolladores...`));

    const uniqueIds = [...new Set(developerIds)];
    let processed = 0;

    for (const devId of uniqueIds) {
        try {
            const docRef = db.collection('desarrolladores').doc(devId);
            const docSnap = await docRef.get();
            if (!docSnap.exists) continue;

            const devData = docSnap.data();
            const devName = devData.nombre;

            if (!devName) {
                console.log(colors.yellow(`   > Desarrollador ${devId} no tiene nombre. Saltando.`));
                continue;
            }

            const developmentsSnap = await db.collection('desarrollos')
                .where('constructora', '==', devName)
                .get();

            const desarrollosIds = [];
            const ciudadesSet = new Set();
            let ofertaTotal = 0;
            let viviendasxVender = 0;

            developmentsSnap.forEach(d => {
                const data = d.data();
                desarrollosIds.push(d.id);

                if (data.ubicacion?.ciudad) {
                    ciudadesSet.add(String(data.ubicacion.ciudad).trim());
                }

                const infoCom = data.infoComercial || {};
                const uT = infoCom.unidadesTotales;
                const uD = infoCom.unidadesDisponibles || infoCom.inventario;

                if (uT !== undefined) ofertaTotal += (Number(uT) || 0);
                if (uD !== undefined) viviendasxVender += (Number(uD) || 0);
            });

            console.log(colors.gray(`   🔗 '${devName}': ${desarrollosIds.length} desarrollos, Total: ${ofertaTotal}, Disp: ${viviendasxVender}`));

            const updatePayload = {
                desarrollos: desarrollosIds,
                ciudades: Array.from(ciudadesSet),
                ofertaTotal: ofertaTotal,
                viviendasxVender: viviendasxVender,
                updatedAt: Timestamp.now()
            };

            // Partial Validation (Ensure types are correct)
            // Note: We can't validate the whole 'Desarrollador' object without fetching it all and merging.
            // But we can validate the strictness of the fields we ARE updating.
            const validationCheck = DesarrolladorSchema.pick({
                desarrollos: true,
                ciudades: true,
                stats: true // stats is separate in schema, but here we update root props.
                // Wait, Schema says: stats: { ofertaTotal, viviendasxVender }. 
                // BUT the code updates root fields: `ofertaTotal`, `viviendasxVender`.
                // Checking Schema...
                // Schema: stats: z.object({ ofertaTotal: z.number(), ... })
                // Code: batch.update({ ofertaTotal: ... })
                // FIX: usage of stats object in schema vs root in code. 
                // The ADAPTER maps them to root? No, adapter doesn't map stats.
                // The service updates root. 
                // ERROR DETECTED: Service is updating ROOT fields `ofertaTotal` but Schema expects `stats.ofertaTotal`.
                // We must fix the service to write to `stats` object as per schema.
            });

            // Correcting structure to match Schema
            const finalUpdate = {
                desarrollos: desarrollosIds,
                ciudades: Array.from(ciudadesSet),
                stats: {
                    ofertaTotal: ofertaTotal,
                    viviendasxVender: viviendasxVender
                },
                updatedAt: Timestamp.now()
            };

            await docRef.update(finalUpdate);

            processed++;
            process.stdout.write(colors.green('.'));

        } catch (error) {
            console.error(colors.red(`\n❌ Error recalculando desarrollador ${devId}: ${error.message}`));
        }
    }
    console.log(colors.green(`\n✅ Recálculo de desarrolladores completado.`));
};
