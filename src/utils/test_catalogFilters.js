import { describe, it, expect } from 'vitest';
import { filterCatalog } from './catalogFilters.js';

describe('catalogFilters - Sector Filter Verification', () => {

    const mockDesarrollos = [
        { id: 'dev1', activo: true, sector: 'Norte' },
        { id: 'dev2', activo: true, sector: 'Sur' }
    ];

    const mockDataMaestra = [
        { id: 'm1', idDesarrollo: 'dev1', activo: true, precioNumerico: 1000, sector: 'Norte' },
        { id: 'm2', idDesarrollo: 'dev2', activo: true, precioNumerico: 1200, sector: 'Sur' },
        { id: 'm3', idDesarrollo: 'dev1', activo: true, precioNumerico: 1500, sector: 'Centro' }, // Override development sector
        { id: 'm4', idDesarrollo: 'dev2', activo: true, precioNumerico: 900 } // Falls back to dev sector ('Sur')
    ];

    const baseFilters = {
        precioMin: 0,
        precioMax: 99999999,
        habitaciones: 0,
        status: 'all',
        amenidad: '',
        tipo: 'all',
        showNoPrice: false,
        sortBy: 'updatedAt_desc',
        sectores: []
    };

    it('should return all models when no sectors are selected', () => {
        const result = filterCatalog(mockDataMaestra, mockDesarrollos, baseFilters, '');
        expect(result.length).toBe(4);
    });

    it('should filter models that match a single selected sector', () => {
        const filters = { ...baseFilters, sectores: ['Norte'] };
        const result = filterCatalog(mockDataMaestra, mockDesarrollos, filters, '');
        
        expect(result.length).toBe(1);
        expect(result[0].id).toBe('m1');
    });

    it('should filter models that match multiple selected sectors (OR logic)', () => {
        const filters = { ...baseFilters, sectores: ['Norte', 'Centro'] };
        const result = filterCatalog(mockDataMaestra, mockDesarrollos, filters, '');
        
        expect(result.length).toBe(2);
        // Returns m1 (Norte) and m3 (Centro)
        expect(result.map(m => m.id)).toContain('m1');
        expect(result.map(m => m.id)).toContain('m3');
    });

    it('should fallback to development sector if model sector is empty', () => {
        const filters = { ...baseFilters, sectores: ['Sur'] };
        const result = filterCatalog(mockDataMaestra, mockDesarrollos, filters, '');
        
        expect(result.length).toBe(2);
        // Returns m2 (Explicitly Sur) and m4 (Fallback to dev2 Sur)
        expect(result.map(m => m.id)).toContain('m2');
        expect(result.map(m => m.id)).toContain('m4');
    });

    it('should be case-insensitive and ignore leading/trailing spaces when matching', () => {
        const filters = { ...baseFilters, sectores: [' nORTe '] };
        const result = filterCatalog(mockDataMaestra, mockDesarrollos, filters, '');
        
        expect(result.length).toBe(1);
        expect(result[0].id).toBe('m1');
    });

});
