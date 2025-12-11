
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
