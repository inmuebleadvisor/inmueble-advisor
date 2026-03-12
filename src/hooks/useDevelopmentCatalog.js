import { useMemo } from 'react';
import { sortModels, sortDevelopments } from '../utils/catalogSorters';

/**
 * Hook to transform a list of filtered models into a list of "enriched" developments.
 * 
 * @param {Array} modelosFiltrados - List of models that passed the user's search filters.
 * @param {Array} desarrollos - Full list of available developments (from Context).
 * @param {string} sortBy - The current sort criteria.
 * @returns {Array} List of developments that have at least one matching model.
 */
export const useDevelopmentCatalog = (modelosFiltrados, desarrollos, sortBy = 'updatedAt_desc') => {
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
                matchingModels: sortModels(matchingModels, sortBy),
                visiblePrice: minMatchingPrice,
                // Helper to know if this dev is relevant to the current search
                isRelevant: matchingModels.length > 0
            };
        });

        // 3. Filter out non-relevant developments (those with 0 matching models)
        // AND Sort by required criteria
        const filteredDevs = enrichedDevs.filter(d => d.isRelevant);
        return sortDevelopments(filteredDevs, sortBy);

    }, [modelosFiltrados, desarrollos, sortBy]);
};
