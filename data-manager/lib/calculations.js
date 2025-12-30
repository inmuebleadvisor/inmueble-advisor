
import colors from 'colors';
import { Timestamp } from 'firebase-admin/firestore';

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

    // Process in chunks to avoid overwhelming the network/database if many developments are updated?
    // For simplicity, we process them sequentially or with Promise.all depending on scale. 
    // Given this is a localized CLI tool, sequential with some concurrency is fine.

    for (const devId of uniqueIds) {
        try {
            if (!devId) continue;

            // 1. Get all ACTIVE models for this development
            // We assume 'ActivoModelo' is a boolean. 
            // 1. Get ALL models for this development to handle legacy 'ActivoModelo' vs new 'activo'
            const modelsSnapshot = await db.collection('modelos')
                .where('idDesarrollo', '==', devId)
                //.where('activo', '==', true) // Removing strict filter to handle potential legacy data
                .get();

            let minPrice = Infinity;
            let activeModelsCount = 0;

            // 2. Update the Development document

            // Re-read development to check for 'unidadesTotales' if we want to update 'disponibles'
            // But 'unidadesTotales' is static, only 'vendidas' changes?
            // Actually, if we want to update 'unidadesDisponibles' (Development Level) based on Models...
            // Models have 'unidadesVendidas'. Summing them = Total Vendidas for Development.

            // Let's sum Model.unidadesVendidas
            let totalVendidas = 0;
            // Check if we can sum models sold

            // Reset loop for aggregation logic (since we only learned about this requirement now)
            // Or just reuse the previous loop? Better reuse. I'll rewrite the loop block.

            // Re-implementing loop logic cleanly:
            modelsSnapshot.forEach(doc => {
                const data = doc.data();

                // Check Active Status (Support 'activo' or legacy 'ActivoModelo')
                const isActive = data.activo === true || data.ActivoModelo === true || data.activo === 'true' || data.ActivoModelo === 'true';

                if (isActive) {
                    activeModelsCount++;

                    // Minimum Price
                    const basePrice = data.precios?.base;
                    if (typeof basePrice === 'number' && basePrice > 0) {
                        if (basePrice < minPrice) {
                            minPrice = basePrice;
                        }
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

            const updateData = {
                'precios.desde': precioDesde,
                'infoComercial.cantidadModelos': activeModelsCount,
                'updatedAt': Timestamp.now()
            };

            // Only update 'vendidas'/'disponibles' if we actually found sold units in models
            // This assumes Models are the source of truth for sales.
            if (activeModelsCount > 0) {
                // Update aggregates
                updateData['infoComercial.unidadesVendidas'] = totalVendidas;
                if (unidadesTotales > 0) {
                    const disp = unidadesTotales - totalVendidas;
                    updateData['infoComercial.unidadesDisponibles'] = disp < 0 ? 0 : disp;
                }
            }

            await db.collection('desarrollos').doc(devId).update(updateData);

            processed++;
            process.stdout.write(colors.green('.'));
        } catch (error) {
            console.error(colors.red(`\n❌ Error recalculando desarrollo ${devId}: ${error.message}`));
        }
    }

    console.log(colors.green(`\n✅ Recálculo completado. ${processed} desarrollos actualizados.`));
};

/**
 * Recalculates highlights for all models in a specific city.
 * Comparisons:
 * - Lowest Price (City & Zone)
 * - Lowest Price/m2 (City & Zone)
 * - Most Terrain (City & Zone)
 * - Most Construction m2 (City & Zone)
 */
export const recalculateCityHighlights = async (db, city) => {
    if (!city) return;
    console.log(colors.cyan(`\n🏆 Calculando Highlights para la ciudad: ${city}...`));

    try {
        // 1. Get all Developments in this city to map DevID -> Zone & Name
        // GeoStandard: 'city' param comes from the caller, which got it from the 'desarrollos' doc.
        // If the doc was standardized, 'city' is already the canonical name (e.g. 'Culiacán').
        console.log(colors.gray(`   > Buscando desarrollos en: '${city}'`));

        const devsSnapshot = await db.collection('desarrollos')
            .where('ubicacion.ciudad', '==', city)
            .where('activo', '==', true)
            .get();

        const devMap = {}; // { devId: { zona: 'Norte', nombre: 'Paseos...' } }
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

        // 2. Get all Active Models linked to these developments
        // Strategy: Query ALL active models, filter in memory for those in devIds.

        const modelsSnapshot = await db.collection('modelos').get();

        const cityModels = [];

        modelsSnapshot.forEach(doc => {
            const m = doc.data();
            // Check if model belongs to one of our city devs
            if (m.idDesarrollo && devMap[m.idDesarrollo]) {
                // Must be active
                const isActive = (m.activo === true || m.ActivoModelo === true || m.activo === 'true');
                if (isActive) {
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

        // 3. Find Winners
        // Metrics: price (asc), priceM2 (asc), terrain (desc), construction (desc)

        const winners = {
            city: {
                lowestPrice: null,
                lowestPriceM2: null,
                maxTerrain: null,
                maxConstruction: null
            },
            zones: {} // { 'Norte': { lowestPrice: ... } }
        };

        const updateWinner = (scope, key, model, value, type) => {
            // type: 'min' or 'max'
            // Ensure value is valid number
            if (!value || isNaN(value)) return;

            if (!scope[key]) {
                scope[key] = { model, value };
            } else {
                if (type === 'min' && value < scope[key].value) {
                    scope[key] = { model, value };
                }
                if (type === 'max' && value > scope[key].value) {
                    scope[key] = { model, value };
                }
            }
        };

        cityModels.forEach(m => {
            const price = m.precios?.base || 0;
            const priceM2 = m.precios?.metroCuadrado || 0;
            const terrain = m.terreno || 0;
            const construction = m.m2 || 0;
            const zona = m._zona;

            // Initialize zone container
            if (!winners.zones[zona]) {
                winners.zones[zona] = {
                    lowestPrice: null,
                    lowestPriceM2: null,
                    maxTerrain: null,
                    maxConstruction: null
                };
            }

            // Price analysis
            if (price > 0) {
                updateWinner(winners.city, 'lowestPrice', m, price, 'min');
                updateWinner(winners.zones[zona], 'lowestPrice', m, price, 'min');
            }

            // Price M2 analysis
            if (priceM2 > 0) {
                updateWinner(winners.city, 'lowestPriceM2', m, priceM2, 'min');
                updateWinner(winners.zones[zona], 'lowestPriceM2', m, priceM2, 'min');
            }

            // Terrain analysis
            if (terrain > 0) {
                updateWinner(winners.city, 'maxTerrain', m, terrain, 'max');
                updateWinner(winners.zones[zona], 'maxTerrain', m, terrain, 'max');
            }

            // Construction analysis
            if (construction > 0) {
                updateWinner(winners.city, 'maxConstruction', m, construction, 'max');
                updateWinner(winners.zones[zona], 'maxConstruction', m, construction, 'max');
            }
        });

        // 4. Assign Highlights Strings to Models
        const modelHighlights = {}; // { modelId: Set<string> }

        const addHighlight = (modelId, text) => {
            if (!modelHighlights[modelId]) modelHighlights[modelId] = new Set();
            modelHighlights[modelId].add(text);
        };

        // Process City Winners
        if (winners.city.lowestPrice) addHighlight(winners.city.lowestPrice.model.id, `Modelo con el precio más bajo de ${city}`);
        if (winners.city.lowestPriceM2) addHighlight(winners.city.lowestPriceM2.model.id, `Modelo con el precio más bajo por m² de ${city}`);
        if (winners.city.maxTerrain) addHighlight(winners.city.maxTerrain.model.id, `Modelo con más terreno de ${city}`);
        if (winners.city.maxConstruction) addHighlight(winners.city.maxConstruction.model.id, `Modelo con más m² de construcción de ${city}`);

        // Process Zone Winners
        Object.keys(winners.zones).forEach(zona => {
            const zWins = winners.zones[zona];
            if (zWins.lowestPrice) addHighlight(zWins.lowestPrice.model.id, `Modelo con el precio más bajo de la zona ${zona}`);
            if (zWins.lowestPriceM2) addHighlight(zWins.lowestPriceM2.model.id, `Modelo con el precio más bajo por m² de la zona ${zona}`);
            if (zWins.maxTerrain) addHighlight(zWins.maxTerrain.model.id, `Modelo con más terreno de la zona ${zona}`);
            if (zWins.maxConstruction) addHighlight(zWins.maxConstruction.model.id, `Modelo con más m² de construcción de la zona ${zona}`);
        });

        // 5. Batch Updates
        const batch = db.batch();
        let batchCount = 0;

        // Iterate ALL city models to either set or clear highlights
        cityModels.forEach(m => {
            const ref = db.collection('modelos').doc(m.id);
            const generatedHighlights = modelHighlights[m.id] ? Array.from(modelHighlights[m.id]) : [];

            // Preserve manual highlights if they exist? The prompt says "Recalculate all".
            // "Si un modelo no tiene highlights se deja en blanco."
            // "Si un modelo tiene mas de 1 highlight se ponen todos."
            // Assuming this overrides previous calculations.

            // NOTE: If we want to keep "manual" highlights from CSV that are NOT calculated, 
            // we would need to know which ones are manual. 
            // For now, I will OVERWRITE `highlights` with the calculated ones, 
            // assuming "highlights" field is purely for this automatic system as requested.
            // If the user wants manual + auto, we'd need a separate field or logic.
            // Given the prompt "Si un modelo no tiene highlights se deja en blanco", implies full control.

            // Only update if changed
            // Sort for comparison
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
            console.log(`   > No hubo cambios en los highlights.`);
        }

    } catch (e) {
        console.error(colors.red(`   > ❌ Error calculating highlights: ${e.message}`));
    }
};

/**
 * Recalculates stats for Developers (Constructors).
 * Links developer to developments by Name.
 * Aggregates:
 * - Desarrollos (List of IDs)
 * - Ciudades (List of Cities)
 * - OfertaTotal (Sum of units)
 * - ViviendasxVender (Sum of inventory)
 */
export const recalculateDesarrolladorStats = async (db, developerIds) => {
    if (!developerIds || developerIds.length === 0) return;

    console.log(colors.cyan(`\n🏗️  Iniciando recálculo para ${developerIds.length} desarrolladores...`));

    const uniqueIds = [...new Set(developerIds)];
    let processed = 0;

    for (const devId of uniqueIds) {
        try {
            // 1. Get Developer Doc
            const docRef = db.collection('desarrolladores').doc(devId);
            const docSnap = await docRef.get();
            if (!docSnap.exists) continue;

            const devData = docSnap.data();
            const devName = devData.nombre;

            if (!devName) {
                console.log(colors.yellow(`   > Desarrollador ${devId} no tiene nombre. Saltando.`));
                continue;
            }

            // 2. Find Developments by Constructor Name
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

                // Strict mapping from ESTRUCTUREDB.md
                const uT = infoCom.unidadesTotales;
                const uD = infoCom.unidadesDisponibles || infoCom.inventario;

                if (uT !== undefined) {
                    ofertaTotal += (Number(uT) || 0);
                }

                if (uD !== undefined) {
                    viviendasxVender += (Number(uD) || 0);
                }
            });

            console.log(colors.gray(`   🔗 '${devName}': ${desarrollosIds.length} desarrollos, Total: ${ofertaTotal}, Disp: ${viviendasxVender}`));


            // 3. Update Developer
            await docRef.update({
                desarrollos: desarrollosIds,
                ciudades: Array.from(ciudadesSet),
                ofertaTotal: ofertaTotal,
                viviendasxVender: viviendasxVender,
                updatedAt: Timestamp.now()
            });

            processed++;
            process.stdout.write(colors.green('.'));

        } catch (error) {
            console.error(colors.red(`\n❌ Error recalculando desarrollador ${devId}: ${error.message}`));
        }
    }
    console.log(colors.green(`\n✅ Recálculo de desarrolladores completado.`));
};

