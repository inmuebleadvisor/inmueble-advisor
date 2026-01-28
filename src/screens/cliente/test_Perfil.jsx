
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Perfil from './Perfil';
import { useUser } from '../../context/UserContext';
import { MemoryRouter } from 'react-router-dom';

// Mocks
vi.mock('../../context/UserContext');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

describe('Perfil - Home Screen Redesign', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useUser.mockReturnValue({
            loginWithGoogle: vi.fn(),
            user: null,
            userProfile: null,
            loadingUser: false
        });
    });

    it('renders the new title and three buttons', () => {
        render(
            <MemoryRouter>
                <Perfil />
            </MemoryRouter>
        );

        expect(screen.getByRole('heading', { level: 1, name: /Encuentra tu mejor inversión/i })).toBeInTheDocument();
        expect(screen.queryByText(/Descubre la propiedad perfecta para ti/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Descubre tu monto de compra/i)).toBeInTheDocument();
        expect(screen.getByText(/Conoce los modelos/i)).toBeInTheDocument();
        expect(screen.getByText(/Navega por el mapa/i)).toBeInTheDocument();
    });

    it('navigates to onboarding when clicking "Descubre tu monto de compra"', () => {
        render(
            <MemoryRouter>
                <Perfil />
            </MemoryRouter>
        );

        const onboardingBtn = screen.getByText(/Descubre tu monto de compra/i);
        fireEvent.click(onboardingBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding-cliente');
    });

    it('navigates to catalog when clicking "Conoce los modelos"', () => {
        render(
            <MemoryRouter>
                <Perfil />
            </MemoryRouter>
        );

        const catalogBtn = screen.getByText(/Conoce los modelos/i);
        fireEvent.click(catalogBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/catalogo');
    });

    it('navigates to map when clicking "Navega por el mapa"', () => {
        render(
            <MemoryRouter>
                <Perfil />
            </MemoryRouter>
        );

        const mapBtn = screen.getByText(/Navega por el mapa/i);
        fireEvent.click(mapBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/mapa');
    });
});
