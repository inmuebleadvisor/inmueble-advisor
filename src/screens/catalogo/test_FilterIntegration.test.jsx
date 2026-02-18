
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Catalogo from './Catalogo';

// --- MOCKS ---

// Mocking Contexts
vi.mock('../../context/UserContext', () => ({
    useUser: () => ({
        userProfile: {},
        trackBehavior: vi.fn(),
        selectedCity: 'Monterrey'
    })
}));

vi.mock('../../context/CatalogContext', () => ({
    useCatalog: () => ({
        modelos: [],
        amenidades: ['Alberca', 'Gimnasio'],
        loadingCatalog: false,
        desarrollos: []
    })
}));

vi.mock('../../context/FavoritesContext', () => ({
    useFavorites: () => ({
        isFavorite: vi.fn(() => false)
    })
}));

// Mock Data for Hook
const mockFiltros = { precioMin: 0, precioMax: 10000000, habitaciones: 0, tipo: 'all', status: 'all' };
const setFiltrosFn = vi.fn();

vi.mock('../../hooks/useCatalogFilter', () => ({
    useCatalogFilter: () => ({
        filtros: mockFiltros,
        setFiltros: setFiltrosFn,
        searchTerm: '',
        setSearchTerm: vi.fn(),
        hayFiltrosActivos: false,
        modelosFiltrados: [],
        suggestions: [],
        limpiarTodo: vi.fn()
    })
}));

vi.mock('../../hooks/useDevelopmentCatalog', () => ({
    useDevelopmentCatalog: () => []
}));

vi.mock('../../hooks/useScrollReveal', () => ({
    useScrollReveal: vi.fn()
}));

vi.mock('../../components/catalogo/MapCatalogView', () => ({
    default: () => <div data-testid="map-view">Map View</div>
}));

// REAL components are used for FilterBar and FilterModal to test integration
// We only mock complex children that are not the focus
vi.mock('../../components/catalogo/DevelopmentCard', () => ({
    default: () => <div data-testid="dev-card">Card</div>
}));

const renderWithRouter = (ui) => {
    return render(
        <BrowserRouter>
            {ui}
        </BrowserRouter>
    );
};

describe('Catalog Filter Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe abrir el modal de filtros al hacer click en el botón "Filtros"', async () => {
        renderWithRouter(<Catalogo />);

        // 1. Verify Filter Button exists
        const filterBtn = screen.getByText(/Filtros/i);
        expect(filterBtn).toBeInTheDocument();
        console.log('Filter button found');

        // 2. Click it
        fireEvent.click(filterBtn);
        console.log('Filter button clicked');

        // 3. Check if Modal content appears
        // Using waitFor because modal might have animation or slight delay
        await waitFor(() => {
            const modalTitle = screen.getByText(/Rango de Precio/i); // Text inside FilterModal
            expect(modalTitle).toBeInTheDocument();
        }, { timeout: 2000 });
        console.log('Modal content found');
    });
});
