
import { renderHook, act } from '@testing-library/react';
import { useCatalogFilter } from './useCatalogFilter';
import { vi } from 'vitest';
import { useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';

// Mock dependencies
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

describe('useCatalogFilter with User Profile', () => {
    beforeEach(() => {
        vi.clearAllMocks(); // Use clear instead of reset to keep the base implementation
        mockLocation.state = null;
        mockLocation.search = '';
    });

    it('should ignore user profile budget when searching from Home', () => {
        // Arrange
        mockLocation.state = { searchQuery: 'Preventa' };

        // Mock user profile having a restrictive budget
        useUser.mockReturnValue({
            userProfile: {
                perfilFinanciero: {
                    presupuestoCalculado: 2000000 // 2 Million
                }
            }
        });

        // Act
        const { result } = renderHook(() => useCatalogFilter([], [], false));

        // Assert
        expect(result.current.filtros.precioMax).not.toBe(2000000);
    });

    it('should respect user profile budget when regularly browsing (no state)', () => {
        // Arrange
        mockLocation.state = null;

        useUser.mockReturnValue({
            userProfile: {
                perfilFinanciero: {
                    presupuestoCalculado: 2000000
                }
            }
        });

        // Act
        const { result } = renderHook(() => useCatalogFilter([], [], false));

        // Assert
        expect(result.current.filtros.precioMax).toBe(2000000);
    });
});
