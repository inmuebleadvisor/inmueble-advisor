
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OnboardingCliente from './OnboardingCliente';
import { useUser } from '../../context/UserContext';
import { useService } from '../../hooks/useService';
import { MemoryRouter } from 'react-router-dom';

// Mocks
vi.mock('../../context/UserContext');
vi.mock('../../hooks/useService');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

describe('OnboardingCliente - Optional Login', () => {
    const mockLoginWithGoogle = vi.fn();
    const mockCompleteOnboarding = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        useUser.mockReturnValue({
            user: null,
            loginWithGoogle: mockLoginWithGoogle,
            trackBehavior: vi.fn(),
            loadingUser: false
        });

        useService.mockReturnValue({
            catalog: {
                obtenerDatosUnificados: vi.fn().mockResolvedValue([]),
                obtenerInventarioDesarrollos: vi.fn().mockResolvedValue([])
            },
            client: {
                completeOnboarding: mockCompleteOnboarding
            },
            meta: {
                trackCompleteRegistration: vi.fn(),
                generateEventId: vi.fn().mockReturnValue('event-1')
            }
        });

        // Mock localStorage
        Storage.prototype.getItem = vi.fn();
        Storage.prototype.setItem = vi.fn();
        Storage.prototype.removeItem = vi.fn();
    });

    it('allows skipping login and redirects to catalog with defaults', async () => {
        // Render step 2 directly (Result step)
        Storage.prototype.getItem.mockImplementation((key) => {
            if (key === 'inmueble_advisor_onboarding_cliente_temp') {
                return JSON.stringify({
                    step: 2,
                    capitalInicial: 500000,
                    mensualidad: 20000,
                    recamaras: null,
                    entregaInmediata: null
                });
            }
            return null;
        });

        render(
            <MemoryRouter>
                <OnboardingCliente />
            </MemoryRouter>
        );

        // Click "Ver Propiedades" (Final step button)
        const finishBtn = screen.getByText(/Ver Propiedades/i);
        fireEvent.click(finishBtn);

        // Modal should appear
        expect(screen.getByText(/Datos Seguros/i)).toBeInTheDocument();

        // Click "Continuar sin cuenta"
        const skipBtn = screen.getByText(/Continuar sin cuenta/i);
        fireEvent.click(skipBtn);

        // Should navigate to catalog
        expect(mockNavigate).toHaveBeenCalledWith(
            expect.stringContaining('/catalogo?maxPrice='),
            expect.objectContaining({ replace: true })
        );
        expect(mockNavigate).toHaveBeenCalledWith(
            expect.stringContaining('rooms='),
            expect.any(Object)
        );
        expect(mockNavigate).toHaveBeenCalledWith(
            expect.stringContaining('status=all'),
            expect.any(Object)
        );

        expect(Storage.prototype.removeItem).toHaveBeenCalledWith('inmueble_advisor_onboarding_cliente_temp');
    });
});
