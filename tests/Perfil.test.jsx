// tests/Perfil.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Perfil from '../src/screens/Perfil';
import React from 'react';

// Mocks
const mockNavigate = vi.fn();
const mockLocation = { state: {}, pathname: '/' };
const mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
    useSearchParams: () => [mockSearchParams, vi.fn()],
}));

const mockLoginWithGoogle = vi.fn(() => Promise.resolve({ uid: '123' }));
const mockTrackBehavior = vi.fn();

vi.mock('../src/context/UserContext', () => ({
    useUser: () => ({
        loginWithGoogle: mockLoginWithGoogle,
        trackBehavior: mockTrackBehavior,
        user: null,
        userProfile: null,
        loadingUser: false
    }),
}));

describe('Perfil Screen (Buyer Landing)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the Hero Section with correct title and subtitle', () => {
        render(<Perfil />);

        // Check Title parts (flexible match due to spans)
        expect(screen.getByText(/Inversión/i)).toBeInTheDocument();
        expect(screen.getByText(/inteligente/i)).toBeInTheDocument();
        expect(screen.getByText(/para tu futuro/i)).toBeInTheDocument();

        // Check Subtitle parts
        expect(screen.getByText(/Encuentra la propiedad perfecta/i)).toBeInTheDocument();
        expect(screen.getByText(/con la mejor asesoría/i)).toBeInTheDocument();
    });

    it('renders the Buyer CTA buttons', () => {
        render(<Perfil />);

        const ctaPrimary = screen.getByText('Descubre tu monto de compra');
        const ctaSecondary = screen.getByText('Ver Catálogo');

        expect(ctaPrimary).toBeInTheDocument();
        expect(ctaSecondary).toBeInTheDocument();
    });

    it('navigates to Onboarding when Primary CTA is clicked', () => {
        render(<Perfil />);

        const ctaPrimary = screen.getByText('Descubre tu monto de compra');
        fireEvent.click(ctaPrimary);

        expect(mockNavigate).toHaveBeenCalledWith('/onboarding-cliente');
    });

    it('does NOT render old Role Selection cards', () => {
        render(<Perfil />);

        // Buscamos textos del diseño anterior
        const oldRoleText = screen.queryByText('Busco mi Hogar');
        const oldAdvisorText = screen.queryByText('Soy Asesor');

        expect(oldRoleText).not.toBeInTheDocument();
        expect(oldAdvisorText).not.toBeInTheDocument();
    });

    it('allows Direct Login', async () => {
        render(<Perfil />);

        const loginBtn = screen.getByText(/Iniciar Sesión/i);
        fireEvent.click(loginBtn);

        // Expect login function to be called
        expect(mockLoginWithGoogle).toHaveBeenCalled();
    });
});
