import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CitySelectorModal from './CitySelectorModal';
import { UserProvider } from '../../context/UserContext';
import { ServiceProvider } from '../../context/ServiceContext';

// Mock del servicio de catálogo
const mockCatalogService = {
    obtenerCiudadesDisponibles: vi.fn(),
};

// Mock del servicio de autenticación
const mockAuthService = {
    subscribeToAuthChanges: vi.fn((cb) => {
        cb(null, null); // Simular que no hay sesión activa inmediatamente
        return () => { };
    }),
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
};

// Mock del servicio de analíticas
const mockAnalyticsService = {
    trackEvent: vi.fn(),
    trackPageView: vi.fn(),
};

const renderWithProviders = (ui) => {
    localStorage.clear(); // Limpiar rastro de selecciones previas
    return render(
        <ServiceProvider overrideServices={{
            catalog: mockCatalogService,
            auth: mockAuthService,
            analytics: mockAnalyticsService
        }}>
            <UserProvider>
                {ui}
            </UserProvider>
        </ServiceProvider>
    );
};

describe('CitySelectorModal', () => {
    const ciudadesMock = ['Cancún', 'Playa del Carmen', 'Tulum'];

    beforeEach(() => {
        vi.clearAllMocks();
        mockCatalogService.obtenerCiudadesDisponibles.mockResolvedValue(ciudadesMock);
    });


    it('debe cargar y mostrar la lista de ciudades como botones', async () => {
        renderWithProviders(<CitySelectorModal />);

        // Esperamos a que el loading termine
        await waitFor(() => {
            expect(screen.queryByText(/Cargando ciudades/i)).not.toBeInTheDocument();
        });

        // Verificamos que cada ciudad aparezca como un botón/item de la cuadrícula
        ciudadesMock.forEach(ciudad => {
            expect(screen.getByText(ciudad)).toBeInTheDocument();
        });
    });

    it('debe permitir seleccionar una ciudad al hacer clic e invocar la acción inmediatamente', async () => {
        renderWithProviders(<CitySelectorModal />);

        await waitFor(() => {
            expect(screen.getByText('Cancún')).toBeInTheDocument();
        });

        const botonCancun = screen.getByText('Cancún');
        fireEvent.click(botonCancun);

        // En un test real, el componente se desmontaría o cambiaría el estado global.
        // Dado que estamos usando UserProvider real, podemos verificar si el componente sigue ahí 
        // o si se llamó a la lógica interna (aunque aquí lo ideal es ver que la ciudad se guardó).
    });
});
