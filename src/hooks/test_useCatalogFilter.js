
import { renderHook, act } from '@testing-library/react';
import { useCatalogFilter } from './useCatalogFilter';
import { vi } from 'vitest';
import { useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';

// --- MOCK SETUP ---
const mockLocation = {
    state: null,
    search: ''
};

vi.mock('react-router-dom', () => ({
    useLocation: vi.fn(() => mockLocation)
}));

vi.mock('../context/UserContext', () => ({
    useUser: vi.fn()
}));

vi.mock('./useService', () => ({
    useService: () => ({
        meta: {
            trackSearch: vi.fn()
        }
    })
}));

vi.mock('../services/catalog.service', () => ({
    CatalogService: {
        filterCatalog: vi.fn(() => []),
        findClosestByPrice: vi.fn(() => [])
    }
}));

describe('useCatalogFilter', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mockLocation.state = null;
        mockLocation.search = '';

        // Default User Mock (Empty Profile)
        useUser.mockImplementation(() => ({
            userProfile: {}
        }));
    });

    describe('Search Query Initialization', () => {
        it('should initialize searchTerm from location.state.searchQuery', () => {
            mockLocation.state = { searchQuery: 'Preventa' };
            const { result } = renderHook(() => useCatalogFilter([], [], false));
            expect(result.current.searchTerm).toBe('Preventa');
        });

        it('should initialize searchTerm as empty if no state is provided', () => {
            mockLocation.state = null;
            const { result } = renderHook(() => useCatalogFilter([], [], false));
            expect(result.current.searchTerm).toBe('');
        });
    });

    describe('Filter Initialization Priority', () => {
        it('should allow fresh search to ignore profile budget (Bug Fix Verification)', () => {
            // Arrange: Search is active
            mockLocation.state = { searchQuery: 'Preventa' };

            // Mock restrictive profile
            useUser.mockImplementation(() => ({
                userProfile: {
                    perfilFinanciero: { presupuestoCalculado: 2000000 }
                }
            }));

            // Act
            const { result } = renderHook(() => useCatalogFilter([], [], false));

            // Assert: Should NOT be limited to 2M
            expect(result.current.filtros.precioMax).not.toBe(2000000);
        });

        it('should respect profile budget when browsing normally (Regression Verification)', () => {
            // Arrange: No search
            mockLocation.state = null;

            // Mock restrictive profile
            useUser.mockImplementation(() => ({
                userProfile: {
                    perfilFinanciero: { presupuestoCalculado: 2000000 }
                }
            }));

            // Act
            const { result } = renderHook(() => useCatalogFilter([], [], false));

            // Assert: Should be limited to 2M
            expect(result.current.filtros.precioMax).toBe(2000000);
        });
    });
});
