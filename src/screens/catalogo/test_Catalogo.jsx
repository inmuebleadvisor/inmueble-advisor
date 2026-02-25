import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Catalogo from './Catalogo';

// ---- MOCKS COMPONENTS ----
vi.mock('../../components/catalogo/MapCatalogView', () => ({
    default: () => <div data-testid="map-view">Map View Mock</div>
}));
vi.mock('../../components/catalogo/DevelopmentCard', () => ({
    default: ({ development }) => <div data-testid="dev-card">{development?.nombre}</div>
}));
vi.mock('../../components/layout/SearchBar', () => ({
    default: () => <div data-testid="search-bar">Search Bar Mock</div>
}));
vi.mock('../../components/layout/FilterBar', () => ({
    default: () => <div data-testid="filter-bar">Filter Bar Mock</div>
}));
vi.mock('../../components/modals/FilterModal', () => ({
    default: () => <div data-testid="filter-modal">Filter Modal Mock</div>
}));

// ---- STATE MOCKS ----
// We mock the hooks directly, avoiding Context Provider hell. 
// This is cleaner and avoids vitest transform errors with createContext hoisting.

const mockUseUser = vi.fn();
vi.mock('../../context/UserContext', () => ({
    useUser: () => mockUseUser(),
    UserContext: { Provider: ({ children }) => children }
}));

const mockUseCatalog = vi.fn();
vi.mock('../../context/CatalogContext', () => ({
    useCatalog: () => mockUseCatalog(),
    CatalogContext: { Provider: ({ children }) => children }
}));

const mockUseFavorites = vi.fn();
vi.mock('../../context/FavoritesContext', () => ({
    useFavorites: () => mockUseFavorites(),
    FavoritesContext: { Provider: ({ children }) => children }
}));

const mockUseService = vi.fn();
vi.mock('../../hooks/useService', () => ({
    useService: () => mockUseService()
}));


describe('Catalogo Screen', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Default mocks
        mockUseUser.mockReturnValue({
            userProfile: {},
            trackBehavior: vi.fn(),
            selectedCity: 'Tulum'
        });

        mockUseCatalog.mockReturnValue({
            modelos: [{ id: 'mod1', idDesarrollo: 'dev1', precioNumerico: 1000000 }],
            desarrollos: [{ id: 'dev1', nombre: 'Desarrollo 1', ubicacion: { latitud: 1, longitud: 1 } }],
            amenidades: [],
            loadingCatalog: false
        });

        mockUseFavorites.mockReturnValue({
            isFavorite: vi.fn(() => false)
        });

        mockUseService.mockReturnValue({
            // Dummy service object if needed
        });
    });

    const renderComponent = () => {
        return render(
            <BrowserRouter>
                <Catalogo />
            </BrowserRouter>
        );
    };

    it('renders loading state when catalog is loading', () => {
        mockUseCatalog.mockReturnValue({
            loadingCatalog: true,
            modelos: [], desarrollos: [], amenidades: []
        });

        renderComponent();
        expect(screen.getByText(/Cargando catálogo/i)).toBeInTheDocument();
    });

    it('renders the Grid View (DevelopmentCards) by default with data', async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText(/Catálogo de Tulum/i)).toBeInTheDocument();
            expect(screen.getByTestId('dev-card')).toHaveTextContent('Desarrollo 1');
            expect(screen.getByTestId('search-bar')).toBeInTheDocument();
            expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
        });
    });
});
