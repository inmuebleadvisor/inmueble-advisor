import { describe, it, expect } from 'vitest';
import { calculateRelevanceScore, sortModels, sortDevelopments } from './catalogSorters';
import { STATUS } from '../config/constants';

describe('catalogSorters - Relevance Score', () => {
    it('calculates score based on multiple attributes correctly', () => {
        const modelA = { id: 1 }; // Empty model, expected score 0
        const modelB = { id: 2, precioNumerico: 1500000, imagen: 'url', amenidades: ['a', 'b'] }; // 10 + 15 + 2 = 27
        const modelC = { 
            id: 3, 
            precioNumerico: 2000000, 
            imagen: 'img', 
            recorrido360: 'url', 
            plantas: ['img1'], 
            amenidades: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'], 
            highlights: ['h1', 'h2'],
            status: STATUS.DEV_IMMEDIATE
        }; // 10 + 15 + 20 + 15 + 10(capped) + 6(highlights) + 5 = 81
        
        expect(calculateRelevanceScore(modelA)).toBe(0);
        expect(calculateRelevanceScore(modelB)).toBe(27);
        expect(calculateRelevanceScore(modelC)).toBe(81);
    });
});

describe('catalogSorters - sortModels', () => {
    const models = [
        { id: 1, precioNumerico: 3000, updatedAt: '2025-01-01' },
        { id: 2, precioNumerico: 1000, updatedAt: '2025-02-01' },
        { id: 3, precioNumerico: 2000, updatedAt: '2024-12-01', imagen: 'has-image-higher-relevance' },
        { id: 4, precioNumerico: 0, updatedAt: '2025-03-01' } // No price
    ];

    it('sorts by updatedAt descending by default', () => {
        const sorted = sortModels(models, 'updatedAt_desc');
        expect(sorted[0].id).toBe(4);
        expect(sorted[1].id).toBe(2);
        expect(sorted[2].id).toBe(1);
        expect(sorted[3].id).toBe(3);
    });

    it('sorts by price ascending, pushing 0/null prices to bottom', () => {
        const sorted = sortModels(models, 'price_asc');
        expect(sorted[0].id).toBe(2); // 1000
        expect(sorted[1].id).toBe(3); // 2000
        expect(sorted[2].id).toBe(1); // 3000
        expect(sorted[3].id).toBe(4); // 0 (bottom)
    });

    it('sorts by price descending', () => {
        const sorted = sortModels(models, 'price_desc');
        expect(sorted[0].id).toBe(1);
        expect(sorted[1].id).toBe(3);
        expect(sorted[2].id).toBe(2);
        expect(sorted[3].id).toBe(4);
    });

    it('sorts by relevance descending', () => {
        const sorted = sortModels(models, 'relevance_desc');
        // Model 3 has an image, giving it a higher relevance score (15 points + 10 for price = 25)
        // Others only have price (10 points)
        expect(sorted[0].id).toBe(3); 
    });
});

describe('catalogSorters - sortDevelopments', () => {
    const devs = [
        { id: 'd1', visiblePrice: 1500, updatedAt: '2025-01-01', matchingModels: [{precioNumerico: 1500}] },
        { id: 'd2', visiblePrice: 500,  updatedAt: '2025-02-01', matchingModels: [{precioNumerico: 500}] },
        { id: 'd3', visiblePrice: 2000, updatedAt: '2024-12-01', matchingModels: [{precioNumerico: 2000, imagen: 'img'}] }
    ];

    it('sorts by price ascending based on visiblePrice', () => {
        const sorted = sortDevelopments(devs, 'price_asc');
        expect(sorted[0].id).toBe('d2');
        expect(sorted[1].id).toBe('d1');
        expect(sorted[2].id).toBe('d3');
    });

    it('sorts by price descending based on matchingModels max price', () => {
        const sorted = sortDevelopments(devs, 'price_desc');
        expect(sorted[0].id).toBe('d3');
        expect(sorted[1].id).toBe('d1');
        expect(sorted[2].id).toBe('d2');
    });

    it('sorts by relevance descending taking max relevance of children', () => {
        const sorted = sortDevelopments(devs, 'relevance_desc');
        // d3 has a model with an image, so its max relevance is highest
        expect(sorted[0].id).toBe('d3');
    });
});
