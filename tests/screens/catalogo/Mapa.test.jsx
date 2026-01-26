
import React from 'react';
import { render, screen } from '@testing-library/react';
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
// We mock MapContainer to check its props
vi.mock('react-leaflet', () => {
    return {
        MapContainer: ({ children, ...props }) => {
            return <div data-testid="map-container" data-props={JSON.stringify(props)}>{children}</div>;
        },
        TileLayer: () => <div data-testid="tile-layer" />,
        Marker: ({ children }) => <div data-testid="marker">{children}</div>,
        Popup: ({ children }) => <div data-testid="popup">{children}</div>,
        useMap: () => ({
            fitBounds: vi.fn(),
        }),
    };
});

describe('Mapa Screen', () => {
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

        // Check if tap is explicitly set to false
        expect(props.tap).toBe(false);
    });
});
