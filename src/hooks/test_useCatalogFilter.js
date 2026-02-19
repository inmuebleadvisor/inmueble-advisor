
import { renderHook, act } from '@testing-library/react';
import { useCatalogFilter } from './useCatalogFilter';
import { vi } from 'vitest';
import { useLocation } from 'react-router-dom';

// Mock dependencies
vi.mock('react-router-dom', () => ({
    useLocation: vi.fn()
}));

vi.mock('../context/UserContext', () => ({
    useUser: () => ({
        userProfile: { perfilFinanciero: {} }
    })
}));

vi.mock('./useService', () => ({
    useService: () => ({
        meta: {
            trackSearch: vi.fn()
        }
    })
}));

// Mock CatalogService to avoid complex logic during hook initialization
vi.mock('../services/catalog.service', () => ({
    CatalogService: {
        filterCatalog: vi.fn(() => []),
        findClosestByPrice: vi.fn(() => [])
    }
}));

describe('useCatalogFilter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize searchTerm from location.state.searchQuery', () => {
        // Arrange: Simulate navigation from Home with a search query
        useLocation.mockReturnValue({
            state: { searchQuery: 'Preventa' },
            search: ''
        });

        // Act
        const { result } = renderHook(() => useCatalogFilter([], [], false));

        // Assert
        expect(result.current.searchTerm).toBe('Preventa');
    });

    it('should initialize searchTerm as empty if no state is provided', () => {
        // Arrange: Simulate navigation without state
        useLocation.mockReturnValue({
            state: null,
            search: ''
        });

        // Act
        const { result } = renderHook(() => useCatalogFilter([], [], false));

        // Assert
        expect(result.current.searchTerm).toBe('');
    });
    
    it('should prioritize location.state.searchQuery over default empty string', () => {
         // Arrange: Simulate navigation from Home with a DIFFERENT search query
        useLocation.mockReturnValue({
            state: { searchQuery: 'Departamento' },
            search: ''
        });

        // Act
        const { result } = renderHook(() => useCatalogFilter([], [], false));

        // Assert
        expect(result.current.searchTerm).toBe('Departamento');
    });
});
