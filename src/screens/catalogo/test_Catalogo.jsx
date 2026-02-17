import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Catalogo from './Catalogo';

// --- MOCKS ---

// Mocking Contexts
vi.mock('../../context/UserContext', () => ({
    useUser: () => ({
        userProfile: {},
        trackBehavior: vi.fn(),
        selectedCity: 'Culiacán'
    })
}));

vi.mock('../../context/CatalogContext', () => ({
    useCatalog: () => ({
        modelos: [],
        amenidades: [],
        loadingCatalog: false,
        desarrollos: []
    })
}));

vi.mock('../../context/FavoritesContext', () => ({
    useFavorites: () => ({
        isFavorite: vi.fn(() => false)
    })
}));

// Mocking Hooks
vi.mock('../../hooks/useCatalogFilter', () => ({
    useCatalogFilter: () => ({
        filtros: { precioMin: 0, precioMax: 10000000, habitaciones: 0, tipo: 'all', status: 'all' },
        setFiltros: vi.fn(),
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

// Mocking Components that might have complex internal logic or sub-dependencies 
// to keep this screen test focused on the orchestration.
vi.mock('../../components/layout/SearchBar', () => ({
    default: () => <div data-testid="search-bar">SearchBar</div>
}));

vi.mock('../../components/layout/FilterBar', () => ({
    default: () => <div data-testid="filter-bar">FilterBar</div>
}));

const renderWithRouter = (ui) => {
    return render(
        <BrowserRouter>
            {ui}
        </BrowserRouter>
    );
};

describe('Catalogo Screen', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe mostrar el título dinámico basado en la ciudad seleccionada', () => {
        renderWithRouter(<Catalogo />);
        expect(screen.getByText(/Catálogo de Culiacán/i)).toBeInTheDocument();
    });

    it('debe renderizar la barra de búsqueda y la barra de filtros', () => {
        renderWithRouter(<Catalogo />);
        expect(screen.getByTestId('search-bar')).toBeInTheDocument();
        expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
    });

    it('debe mostrar estado de carga inicial', () => {
        // Override mock to show loading
        const useCatalogMock = vi.importMock('../../context/CatalogContext');
        vi.mock('../../context/CatalogContext', () => ({
            useCatalog: () => ({
                loadingCatalog: true
            })
        }));

        renderWithRouter(<Catalogo />);
        expect(screen.getByText(/Cargando catálogo.../i)).toBeInTheDocument();
    });
});
