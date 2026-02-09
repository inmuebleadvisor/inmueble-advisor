import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { CatalogProvider, useCatalog } from './CatalogContext';
import * as catalogService from '../services/catalog.service';
import * as configService from '../services/config.service';
import * as UserContext from './UserContext';

// --- Mock dependencies ---
const mockCatalogMethods = vi.hoisted(() => ({
    obtenerInventarioDesarrollos: vi.fn(),
    obtenerTopAmenidades: vi.fn(),
    obtenerDatosUnificados: vi.fn(),
    hidratarInventarioAsesor: vi.fn()
}));

vi.mock('../services/catalog.service', () => {
    const MockClass = vi.fn().mockImplementation(function () {
        return mockCatalogMethods;
    });
    // Static methods used by CatalogContext
    MockClass.enrichModels = vi.fn((m) => m);
    MockClass.applyQualityFilters = vi.fn((m) => m);

    return {
        CatalogService: MockClass,
        ...mockCatalogMethods
    };
});

vi.mock('../services/config.service');
vi.mock('../hooks/useService');

// Mock UserContext hooks
vi.mock('./UserContext', () => ({
    useUser: vi.fn(),
    UserProvider: ({ children }) => <div>{children}</div>
}));

import { useService } from '../hooks/useService';

// Test component to consume context
const TestComponent = () => {
    const { modelos, desarrollos, amenidades, loadingCatalog } = useCatalog();
    if (loadingCatalog) return <div>Loading...</div>;
    return (
        <div>
            <div data-testid="modelos-count">{modelos.length}</div>
            <div data-testid="desarrollos-count">{desarrollos.length}</div>
            <div data-testid="amenidades-count">{amenidades.length}</div>
            <ul>
                {amenidades.map((am, idx) => <li key={idx}>{am}</li>)}
            </ul>
        </div>
    );
};

describe('CatalogContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Bind useService to the mocked module objects
        useService.mockReturnValue({
            catalog: catalogService,
            config: configService
        });

        // Setup default mock returns
        catalogService.obtenerInventarioDesarrollos.mockResolvedValue([
            { id: 'dev1', nombre: 'Desarrollo 1', ubicacion: { ciudad: 'Cancun' }, media: {}, amenidades: [] }
        ]);
        catalogService.obtenerTopAmenidades.mockResolvedValue(['Alberca', 'Gimnasio']);
        configService.getPlatformSettings.mockResolvedValue({
            hideNoPriceModels: false,
            hideNoPhotosModels: false,
            hideNoPhotosDevs: false,
            hideEmptyDevs: false
        });
        catalogService.obtenerDatosUnificados.mockResolvedValue([
            { id: 'mod1', idDesarrollo: 'dev1', precioNumerico: 1000000, media: {} }
        ]);

        // Default User Context
        UserContext.useUser.mockReturnValue({ selectedCity: null });
    });

    it('loads catalog data successfully (Global mode)', async () => {
        render(
            <CatalogProvider>
                <TestComponent />
            </CatalogProvider>
        );

        // Initial state
        expect(screen.getByText('Loading...')).toBeInTheDocument();

        // Wait for effect
        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        // Check amenidades (the fix verification)
        expect(screen.getByTestId('amenidades-count')).toHaveTextContent('2');
        expect(screen.getByText('Alberca')).toBeInTheDocument();
    });

    it('loads catalog data with selected city', async () => {
        UserContext.useUser.mockReturnValue({ selectedCity: 'Cancun' });

        render(
            <CatalogProvider>
                <TestComponent />
            </CatalogProvider>
        );

        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        });

        expect(catalogService.obtenerDatosUnificados).toHaveBeenCalledWith('Cancun');
    });
});
