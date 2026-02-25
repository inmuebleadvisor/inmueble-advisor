import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import MapCatalogView from './MapCatalogView';

// Mock Leaflet and React-Leaflet to prevent map rendering issues in JSDOM
vi.mock('react-leaflet', () => ({
    MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: ({ children }) => <div data-testid="mock-marker">{children}</div>,
    Popup: ({ children }) => <div data-testid="mock-popup">{children}</div>,
    useMap: () => ({
        invalidateSize: vi.fn(),
        fitBounds: vi.fn(),
        getContainer: vi.fn(() => ({ focus: vi.fn() }))
    })
}));

describe('MapCatalogView Component', () => {
    const mockMarcadores = [
        {
            id: 'dev1',
            nombre: 'Desarrollo Mapa',
            zona: 'Norte',
            ubicacion: { latitud: 21.88, longitud: -102.29 },
            portada: 'img.jpg',
            etiquetaPrecio: '$1M',
            esFavorito: false
        }
    ];

    it('renders the map container and markers', () => {
        render(
            <BrowserRouter>
                <MapCatalogView
                    marcadores={mockMarcadores}
                    trackBehavior={vi.fn()}
                    isFullscreen={false}
                    setIsFullscreen={vi.fn()}
                />
            </BrowserRouter>
        );

        expect(screen.getByTestId('map-container')).toBeInTheDocument();
        expect(screen.getByTestId('mock-marker')).toBeInTheDocument();
        // Since it's mocked, Popup content renders immediately in the tree
        expect(screen.getByText('Desarrollo Mapa')).toBeInTheDocument();
        expect(screen.getByText('$1M')).toBeInTheDocument();
    });

    it('calls setIsFullscreen when toggle button is clicked', () => {
        const mockSetIsFullscreen = vi.fn();
        render(
            <BrowserRouter>
                <MapCatalogView
                    marcadores={mockMarcadores}
                    trackBehavior={vi.fn()}
                    isFullscreen={false}
                    setIsFullscreen={mockSetIsFullscreen}
                />
            </BrowserRouter>
        );

        const toggleBtn = screen.getByTitle('Pantalla Completa');
        fireEvent.click(toggleBtn);

        expect(mockSetIsFullscreen).toHaveBeenCalledWith(true);
    });
});
