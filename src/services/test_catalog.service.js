import { describe, it, expect } from 'vitest';
import { findClosestByPrice, filterCatalog } from './catalog.service';

describe('Catalog Service Logic', () => {

    const mockModels = [
        { id: '1', nombre: 'Cheap House', precioNumerico: 1000000, activo: true, ubicacion: { ciudad: 'Merida' } },
        { id: '2', nombre: 'Mid House', precioNumerico: 3000000, activo: true, ubicacion: { ciudad: 'Merida' } },
        { id: '3', nombre: 'Expensive House', precioNumerico: 6000000, activo: true, ubicacion: { ciudad: 'Merida' } },
        { id: '4', nombre: 'Luxury House', precioNumerico: 10000000, activo: true, ubicacion: { ciudad: 'Merida' } },
        { id: '5', nombre: 'Hidden Price', precioNumerico: 0, activo: true, ubicacion: { ciudad: 'Merida' } },
        { id: '6', nombre: 'Inactive', precioNumerico: 3000000, activo: false, ubicacion: { ciudad: 'Merida' } },
    ];

    describe('findClosestByPrice', () => {
        it('should return closest properties to target average price', () => {
            // Target: 2.5M (average 2M - 3M)
            const filters = { precioMin: 2000000, precioMax: 3000000 };
            const result = findClosestByPrice(mockModels, filters, 2);

            // Expected closest to 2.5M: 
            // 1. Mid House (3M) -> diff 0.5M
            // 2. Cheap House (1M) -> diff 1.5M
            // 3. Expensive House (6M) -> diff 3.5M

            expect(result.length).toBe(2);
            expect(result[0].id).toBe('2'); // Closest
            expect(result[1].id).toBe('1'); // Second closest
        });

        it('should fallback to cheapest/ascending if no price filter provided', () => {
            // Default Default filters (Min 0, Max huge)
            const filters = { precioMin: 0, precioMax: 20000000 }; // High max means "Any" basically
            // Logic says if max >= 15M and min 0, it treats as "No intention".

            const result = findClosestByPrice(mockModels, filters, 2);
            // Should sort ascending: 1M, 3M, 6M...
            expect(result[0].precioNumerico).toBe(1000000);
            expect(result[1].precioNumerico).toBe(3000000);
        });

        it('should exclude inactive items', () => {
            const filters = { precioMin: 0, precioMax: 5000000 };
            const result = findClosestByPrice(mockModels, filters, 10);
            const foundInactive = result.find(m => m.id === '6');
            expect(foundInactive).toBeUndefined();
        });

        it('should exclude zero price items used for calculation', () => {
            const filters = { precioMin: 0, precioMax: 5000000 };
            const result = findClosestByPrice(mockModels, filters, 10);
            const foundZero = result.find(m => m.id === '5');
            expect(foundZero).toBeUndefined();
        });
    });
});
