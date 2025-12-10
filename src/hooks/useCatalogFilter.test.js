import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCatalogFilter } from './useCatalogFilter';
import * as Router from 'react-router-dom';
import * as UserContext from '../context/UserContext';
import { UI_OPCIONES } from '../config/constants';

// Mocks
vi.mock('react-router-dom', () => ({
    useLocation: vi.fn(),
}));

vi.mock('../context/UserContext', () => ({
    useUser: vi.fn(),
}));

vi.mock('../services/catalog.service', () => ({
    filterCatalog: vi.fn(() => []), // Return empty array by default
}));

describe('useCatalogFilter Hook', () => {
    const mockDataMaestra = [];
    const mockDesarrollos = [];
    const mockLoading = false;

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();

        // Default Mocks
        vi.spyOn(Router, 'useLocation').mockReturnValue({ search: '' });
        vi.spyOn(UserContext, 'useUser').mockReturnValue({ userProfile: null });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should initialize with default filters when no profile and no local storage', () => {
        const { result } = renderHook(() => useCatalogFilter(mockDataMaestra, mockDesarrollos, mockLoading));

        expect(result.current.filtros).toEqual({
            precioMin: 0,
            precioMax: UI_OPCIONES.FILTRO_PRECIO_MAX,
            habitaciones: 0,
            status: 'all',
            amenidad: '',
            tipo: 'all'
        });
    });

    it('should initialize from User Profile when no local storage is present (First Time)', () => {
        const mockProfile = {
            perfilFinanciero: {
                presupuestoCalculado: 2500000,
                recamarasDeseadas: 2,
                interesInmediato: true
            }
        };
        vi.spyOn(UserContext, 'useUser').mockReturnValue({ userProfile: mockProfile });

        const { result } = renderHook(() => useCatalogFilter(mockDataMaestra, mockDesarrollos, mockLoading));

        // Expectation: Should match profile because no localStorage exists
        expect(result.current.filtros.precioMax).toBe(2500000);
        expect(result.current.filtros.habitaciones).toBe(2);
        expect(result.current.filtros.status).toBe('inmediata');
    });

    it('should initialize from Local Storage if available (ignoring User Profile)', () => {
        // Setup Local Storage
        const savedFilters = {
            precioMin: 500000,
            precioMax: 3000000,
            habitaciones: 3,
            status: 'preventa',
            amenidad: '',
            tipo: 'all'
        };
        localStorage.setItem('catalog_filters_v1', JSON.stringify(savedFilters));

        // Setup Profile (should be ignored)
        const mockProfile = {
            perfilFinanciero: {
                presupuestoCalculado: 1000000,
                recamarasDeseadas: 1,
                interesInmediato: true // 'inmediata'
            }
        };
        vi.spyOn(UserContext, 'useUser').mockReturnValue({ userProfile: mockProfile });

        const { result } = renderHook(() => useCatalogFilter(mockDataMaestra, mockDesarrollos, mockLoading));

        expect(result.current.filtros).toEqual(savedFilters);
        expect(result.current.filtros.precioMax).not.toBe(1000000); // Should NOT be profile val
    });

    it('should prioritize URL params over Local Storage and Profile', () => {
        // Local Storage
        const savedFilters = {
            precioMin: 0,
            precioMax: 9000000,
            habitaciones: 1,
            status: 'all',
            amenidad: '',
            tipo: 'all'
        };
        localStorage.setItem('catalog_filters_v1', JSON.stringify(savedFilters));

        // URL Params
        vi.spyOn(Router, 'useLocation').mockReturnValue({ search: '?minPrice=100000&rooms=4' });

        const { result } = renderHook(() => useCatalogFilter(mockDataMaestra, mockDesarrollos, mockLoading));

        expect(result.current.filtros.precioMin).toBe(100000); // From URL
        expect(result.current.filtros.habitaciones).toBe(4); // From URL
        // Note: URL doesn't set ALL params, but logic might merge or set defaults. 
        // Current logic in existing hook might just use defaults for missing URL params, 
        // checking the "Storage" implementation logic is key here. 
        // If my plan says "URL > Storage", valid URL params should take precedence.
    });

    it('should save filters to localStorage when they change', () => {
        const { result } = renderHook(() => useCatalogFilter(mockDataMaestra, mockDesarrollos, mockLoading));

        act(() => {
            result.current.setFiltros({
                ...result.current.filtros,
                precioMin: 12345
            });
        });

        const stored = JSON.parse(localStorage.getItem('catalog_filters_v1'));
        expect(stored.precioMin).toBe(12345);
    });
});
