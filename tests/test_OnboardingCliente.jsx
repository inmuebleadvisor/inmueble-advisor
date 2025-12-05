// tests/test_OnboardingCliente.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import OnboardingCliente from '../src/screens/OnboardingCliente';
import { UserContext } from '../src/context/UserContext';
import { MemoryRouter } from 'react-router-dom';

// Mock de hooks y servicios
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../src/services/catalog.service', () => ({
    obtenerDatosUnificados: vi.fn().mockResolvedValue([]),
}));

vi.mock('../src/firebase/config', () => ({
    db: {},
}));

describe('OnboardingCliente Screen', () => {
    const mockLoginWithGoogle = vi.fn();
    const mockTrackBehavior = vi.fn();

    const renderComponent = (user = null) => {
        return render(
            <UserContext.Provider value={{
                user,
                loginWithGoogle: mockLoginWithGoogle,
                trackBehavior: mockTrackBehavior,
                loadingUser: false,
                userProfile: null
            }}>
                <MemoryRouter>
                    <OnboardingCliente />
                </MemoryRouter>
            </UserContext.Provider>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('renders Step 1 correctly', () => {
        renderComponent();
        expect(screen.getByText('Dime qué buscas')).toBeInTheDocument();
        expect(screen.getByText('Recámaras mínimas:')).toBeInTheDocument();
    });

    it('navigates to Step 2 when inputs are valid', () => {
        renderComponent();

        // Select recamaras
        fireEvent.click(screen.getByText('2'));
        // Select entrega
        fireEvent.click(screen.getByText('Entrega inmediata'));

        // Click Next
        const nextBtn = screen.getByText('Siguiente 👉');
        fireEvent.click(nextBtn);

        expect(screen.getByText('Hablemos de números')).toBeInTheDocument();
    });

    it('goes back to home if Back is clicked on Step 1', () => {
        renderComponent();
        const backBtn = screen.getByText('Atrás');
        fireEvent.click(backBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});
