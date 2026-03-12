import { STATUS } from '../config/constants';

/**
 * utility functions for sorting models and developments in the catalog
 */

/**
 * Calculates a relevance score for a model based on its attributes.
 * @param {Object} model - The model to evaluate.
 * @returns {number} The calculated relevance score.
 */
export const calculateRelevanceScore = (model) => {
    let score = 0;

    // 1. Has pricing info
    if (model.precioNumerico && model.precioNumerico > 0) score += 10;
    
    // 2. Has media/images
    if (model.imagen || model.media?.render) score += 15;
    
    // 3. Has virtual tours or 360
    if (model.media?.recorridoVirtual || model.recorrido360) score += 20;
    
    // 4. Has architectural plans
    if (model.media?.plantasArquitectonicas?.length > 0 || model.plantas?.length > 0) score += 15;

    // 5. Number of amenities
    const totalAmenities = (model.amenidades?.length || 0) + (model.amenidadesDesarrollo?.length || 0);
    score += Math.min(totalAmenities, 10); // Cap at 10 points for amenities

    // 6. Highlights/Keywords
    if (model.keywords?.length > 0) score += model.keywords.length * 2;
    if (model.highlights?.length > 0) score += model.highlights.length * 3;

    // 7. Status (e.g. immediate delivery is usually preferred by buyers, or pre-sale for investors)
    // For general relevance, we'll just give a small bump if it has a defined status
    if (model.status && model.status !== STATUS.DEV_UNKNOWN) score += 5;

    return score;
};

const getTime = (val) => {
    if (!val) return 0;
    if (typeof val.toMillis === 'function') return val.toMillis();
    if (val.seconds) return val.seconds * 1000;
    if (val instanceof Date) return val.getTime();
    if (typeof val === 'string' || typeof val === 'number') {
        const d = new Date(val);
        return isNaN(d.getTime()) ? 0 : d.getTime();
    }
    return 0;
};

/**
 * Sorts an array of models based on the specified criteria.
 * @param {Array} models - The models to sort.
 * @param {string} sortBy - The sort criteria ('updatedAt_desc', 'price_asc', 'price_desc', 'relevance_desc').
 * @returns {Array} The sorted models.
 */
export const sortModels = (models, sortBy) => {
    if (!models || models.length === 0) return [];
    
    return [...models].sort((a, b) => {
        switch (sortBy) {
            case 'price_asc':
                // Put models without price at the end
                if (!a.precioNumerico) return 1;
                if (!b.precioNumerico) return -1;
                return (Number(a.precioNumerico) || 0) - (Number(b.precioNumerico) || 0);
                
            case 'price_desc':
                return (Number(b.precioNumerico) || 0) - (Number(a.precioNumerico) || 0);
                
            case 'relevance_desc':
                const scoreA = calculateRelevanceScore(a);
                const scoreB = calculateRelevanceScore(b);
                if (scoreA !== scoreB) {
                    return scoreB - scoreA;
                }
                // Fallback to update date if relevance is the same
                return getTime(b.updatedAt) - getTime(a.updatedAt);
                
            case 'updatedAt_desc':
            default:
                return getTime(b.updatedAt) - getTime(a.updatedAt);
        }
    });
};

/**
 * Sorts an array of enriched developments based on the specified criteria.
 * This logic relies on the fact that developments have matching models inside them.
 * @param {Array} developments - The developments to sort.
 * @param {string} sortBy - The sort criteria.
 * @returns {Array} The sorted developments.
 */
export const sortDevelopments = (developments, sortBy) => {
    if (!developments || developments.length === 0) return [];

    return [...developments].sort((a, b) => {
        switch (sortBy) {
            case 'price_asc':
                // Use visiblePrice (calculated in useDevelopmentCatalog)
                if (!a.visiblePrice) return 1;
                if (!b.visiblePrice) return -1;
                return a.visiblePrice - b.visiblePrice;
                
            case 'price_desc':
                // For desc, we might want the highest price among the matching models
                const maxPriceA = a.matchingModels?.length > 0 
                    ? Math.max(...a.matchingModels.map(m => m.precioNumerico || 0)) 
                    : (a.visiblePrice || 0);
                const maxPriceB = b.matchingModels?.length > 0 
                    ? Math.max(...b.matchingModels.map(m => m.precioNumerico || 0)) 
                    : (b.visiblePrice || 0);
                return maxPriceB - maxPriceA;
                
            case 'relevance_desc':
                // For relevance, take the max relevance score of its matching models
                const maxRelA = a.matchingModels?.length > 0
                    ? Math.max(...a.matchingModels.map(m => calculateRelevanceScore(m)))
                    : 0;
                const maxRelB = b.matchingModels?.length > 0
                    ? Math.max(...b.matchingModels.map(m => calculateRelevanceScore(m)))
                    : 0;
                
                if (maxRelA !== maxRelB) {
                    return maxRelB - maxRelA;
                }
                return getTime(b.updatedAt) - getTime(a.updatedAt);
                
            case 'updatedAt_desc':
            default:
                return getTime(b.updatedAt) - getTime(a.updatedAt);
        }
    });
};
