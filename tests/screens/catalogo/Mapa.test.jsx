
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Mapa from '../../../src/screens/catalogo/Mapa';
import { BrowserRouter } from 'react-router-dom';

// Mock contexts and hooks
vi.mock('../../../src/context/UserContext', () => ({
    useUser: () => ({
        trackBehavior: vi.fn(),
    }),
}));

vi.mock('../../../src/context/CatalogContext', () => ({
    useCatalog: () => ({
        modelos: [],
        desarrollos: [],
        amenidades: [],
        loadingCatalog: false,
    }),
}));

vi.mock('../../../src/context/FavoritesContext', () => ({
    useFavorites: () => ({
        favoritasIds: [],
        isFavorite: vi.fn().mockReturnValue(false),
    }),
}));

vi.mock('../../../src/hooks/useCatalogFilter', () => ({
    useCatalogFilter: () => ({
        filtros: {},
        setFiltros: vi.fn(),
        searchTerm: '',
        setSearchTerm: vi.fn(),
        hayFiltrosActivos: false,
        modelosFiltrados: [],
        limpiarTodo: vi.fn(),
    }),
}));

// Mock react-leaflet
const mockInvalidateSize = vi.fn();
const mockFocus = vi.fn();
const mockGetContainer = vi.fn(() => ({
    focus: mockFocus,
    style: {},
}));

vi.mock('react-leaflet', () => {
    return {
        MapContainer: ({ children, ...props }) => {
            return (
                <div data-testid="map-container" data-props={JSON.stringify(props)}>
                    {children}
                </div>
            );
        },
        TileLayer: () => <div data-testid="tile-layer" />,
        Marker: ({ children }) => <div data-testid="marker">{children}</div>,
        Popup: ({ children }) => <div data-testid="popup">{children}</div>,
        useMap: () => ({
            fitBounds: vi.fn(),
            invalidateSize: mockInvalidateSize,
            getContainer: mockGetContainer,
        }),
    };
});

describe('Mapa Screen', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset body style
        document.body.style.overflow = '';
    });

    it('renders correctly', () => {
        render(
            <BrowserRouter>
                <Mapa />
            </BrowserRouter>
        );
        expect(screen.getByText('Mapa Interactivo')).toBeInTheDocument();
    });

    it('passes tap={false} to MapContainer to fix interaction issues', () => {
        render(
            <BrowserRouter>
                <Mapa />
            </BrowserRouter>
        );

        const mapContainer = screen.getByTestId('map-container');
        const props = JSON.parse(mapContainer.getAttribute('data-props'));

        expect(props.tap).toBe(false);
    });

    it('locks body scroll and focuses map on mount', () => {
        render(
            <BrowserRouter>
                <Mapa />
            </BrowserRouter>
        );

        // Check invalidateSize called
        expect(mockInvalidateSize).toHaveBeenCalled();

        // Check focus called
        expect(mockGetContainer).toHaveBeenCalled();
        expect(mockFocus).toHaveBeenCalledWith({ preventScroll: true });

        // Check body scroll locked
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll on unmount', () => {
        const { unmount } = render(
            <BrowserRouter>
                <Mapa />
            </BrowserRouter>
        );

        // Verify locked first
        expect(document.body.style.overflow).toBe('hidden');

        unmount();

        // Verify restored (empty string as it was reset in beforeEach)
        expect(document.body.style.overflow).toBe('');
    });

    it('calls invalidateSize on mount via MapRevalidator', async () => {
        render(
            <BrowserRouter>
                <Mapa />
            </BrowserRouter>
        );

        // Should be called immediately on mount
        expect(mockInvalidateSize).toHaveBeenCalled();

        // And again after timeout (we won't wait for timeout in this simple unit test unless we use fake timers, 
        // but verifying immediate call confirms component is active)
    });
});
