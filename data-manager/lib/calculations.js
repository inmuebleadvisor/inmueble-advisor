
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
            const modelsSnapshot = await db.collection('modelos')
                .where('idDesarrollo', '==', devId)
                .where('ActivoModelo', '==', true)
                .get();

            let minPrice = Infinity;
            let activeModelsCount = 0;

            modelsSnapshot.forEach(doc => {
                const data = doc.data();
                activeModelsCount++;

                // Check prices.base. Handle different structures if necessary, but schema says precios.base
                const basePrice = data.precios?.base;
                if (typeof basePrice === 'number' && basePrice > 0) {
                    if (basePrice < minPrice) {
                        minPrice = basePrice;
                    }
                }
            });

            // If no models or no prices found, handle gracefully
            const precioDesde = minPrice === Infinity ? 0 : minPrice;

            // 2. Update the Development document
            await db.collection('desarrollos').doc(devId).update({
                'precioDesde': precioDesde,
                'infoComercial.cantidadModelos': activeModelsCount,
                'updatedAt': Timestamp.now()
            });

            processed++;
            process.stdout.write(colors.green('.'));
        } catch (error) {
            console.error(colors.red(`\n❌ Error recalculando desarrollo ${devId}: ${error.message}`));
        }
    }

    console.log(colors.green(`\n✅ Recálculo completado. ${processed} desarrollos actualizados.`));
};
