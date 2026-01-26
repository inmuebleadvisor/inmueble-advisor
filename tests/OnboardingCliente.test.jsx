// tests/OnboardingCliente.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OnboardingCliente from '../src/screens/cliente/OnboardingCliente';
import React from 'react';

// Mocks
const mockNavigate = vi.fn();
const mockLoginWithGoogle = vi.fn(() => Promise.resolve({ uid: '123' }));
const mockTrackBehavior = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    useLocation: () => ({}),
}));

vi.mock('../src/context/UserContext', () => ({
    useUser: () => ({
        loginWithGoogle: mockLoginWithGoogle,
        trackBehavior: mockTrackBehavior,
        user: null, // Simulating not logged in initially
        loadingUser: false
    }),
}));

vi.mock('../src/hooks/useService', () => ({
    useService: () => ({
        catalog: {
            obtenerDatosUnificados: vi.fn(() => Promise.resolve([
                { id: 1, precioNumerico: 2000000, recamaras: 3, esPreventa: false },
                { id: 2, precioNumerico: 5000000, recamaras: 4, esPreventa: true }
            ]))
        },
        client: {
            completeOnboarding: vi.fn(() => Promise.resolve({ success: true }))
        },
        meta: {
            track: vi.fn(),
            trackCompleteRegistration: vi.fn(),
            generateEventId: vi.fn(() => 'evt-123')
        }
    })
}));

describe('OnboardingCliente Screen', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('renders Step 1 (Preferences) initially', () => {
        render(<OnboardingCliente />);
        expect(screen.getByText('Dime qué buscas')).toBeInTheDocument();
        expect(screen.getByText('Recámaras mínimas:')).toBeInTheDocument();
    });

    it('navigates to Step 2 after selecting options', async () => {
        render(<OnboardingCliente />);

        // Select 3 bedrooms
        fireEvent.click(screen.getByText('3'));
        // Select Immediate Delivery
        fireEvent.click(screen.getByText('Entrega inmediata'));

        // Click Next
        fireEvent.click(screen.getByText('Siguiente'));

        // Expect Step 2 Title
        await waitFor(() => {
            expect(screen.getByText('Hablemos de números')).toBeInTheDocument();
        });
    });

    it('shows numeric inputs in Step 2', async () => {
        // Setup state for Step 2 directly via localStorage if component reads it, 
        // but let's just flow through UI to be safe or mock localStorage.
        // Flowing is safer.
        render(<OnboardingCliente />);
        fireEvent.click(screen.getByText('3'));
        fireEvent.click(screen.getByText('Entrega inmediata'));
        fireEvent.click(screen.getByText('Siguiente'));

        await waitFor(() => {
            expect(screen.getByText('Ahorros disponibles:')).toBeInTheDocument();
        });

        // Find numeric input (type=number)
        const inputs = screen.getAllByRole('spinbutton'); // spinbutton is role for input type=number
        expect(inputs.length).toBeGreaterThanOrEqual(2); // Capital + Mensualidad
    });

    it('shows Pre-Login Modal on Finalize', async () => {
        render(<OnboardingCliente />);

        // --- STEP 1 ---
        fireEvent.click(screen.getByText('3'));
        fireEvent.click(screen.getByText('Entrega inmediata'));
        fireEvent.click(screen.getByText('Siguiente'));

        // --- STEP 2 ---
        await waitFor(() => expect(screen.getByText('Hablemos de números')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Siguiente'));

        // --- STEP 3 ---
        await waitFor(() => expect(screen.getByText('¡Listo!')).toBeInTheDocument());

        // Click Final Button (Ver Propiedades)
        const finalBtn = screen.getByText('Ver Propiedades');
        fireEvent.click(finalBtn);

        // MODAL SHOULD APPEAR
        await waitFor(() => {
            expect(screen.getByText('🔐 Datos Seguros')).toBeInTheDocument();
        });

        // CLICK CONTINUE
        fireEvent.click(screen.getByText('Continuar con Google'));
        expect(mockLoginWithGoogle).toHaveBeenCalled();
    });
});
