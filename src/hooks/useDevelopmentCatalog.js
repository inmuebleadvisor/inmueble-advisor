import { useMemo } from 'react';

/**
 * Hook to transform a list of filtered models into a list of "enriched" developments.
 * 
 * @param {Array} modelosFiltrados - List of models that passed the user's search filters.
 * @param {Array} desarrollos - Full list of available developments (from Context).
 * @returns {Array} List of developments that have at least one matching model.
 */
export const useDevelopmentCatalog = (modelosFiltrados, desarrollos) => {
    return useMemo(() => {
        if (!modelosFiltrados || !desarrollos) return [];

        // 1. Group models by Development ID
        const modelsByDev = modelosFiltrados.reduce((acc, model) => {
            const devId = model.idDesarrollo || model.id_desarrollo;
            if (!devId) return acc;

            if (!acc[devId]) {
                acc[devId] = [];
            }
            acc[devId].push(model);
            return acc;
        }, {});

        // 2. Map developments to include match data
        const enrichedDevs = desarrollos.map(dev => {
            const matchingModels = modelsByDev[dev.id] || [];

            // Calculate dynamic "starting price" based ONLY on matching models
            // If no matching models, we don't display a price (or use the dev's default?)
            // Logic: The user filtered by price X. We should show the price that matched.
            const prices = matchingModels.map(m => m.precioNumerico || m.precios?.base || 0).filter(p => p > 0);
            const minMatchingPrice = prices.length > 0 ? Math.min(...prices) : (dev.precioDesde || 0);

            return {
                ...dev,
                matchCount: matchingModels.length,
                matchingModels: matchingModels,
                visiblePrice: minMatchingPrice,
                // Helper to know if this dev is relevant to the current search
                isRelevant: matchingModels.length > 0
            };
        });

        // 3. Filter out non-relevant developments (those with 0 matching models)
        // AND Sort by relevance (e.g. ones with most matches first? or just keep default order?)
        // Default order usually implies "Featured" or "Newest". Let's keep original order but filter.
        return enrichedDevs.filter(d => d.isRelevant);

    }, [modelosFiltrados, desarrollos]);
};
