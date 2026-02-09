import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../Navbar';
import { useUser } from '../../../context/UserContext';
import { useTheme } from '../../../context/ThemeContext';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock contexts
vi.mock('../../../context/UserContext');
vi.mock('../../../context/ThemeContext');

describe('Navbar Component', () => {
    const mockLogout = vi.fn();
    const mockLoginWithGoogle = vi.fn();
    const mockUpdateSelectedCity = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        useTheme.mockReturnValue({
            currentAssets: { logo: 'mock-logo.png' }
        });

        useUser.mockReturnValue({
            user: null,
            userProfile: null,
            logout: mockLogout,
            selectedCity: null,
            updateSelectedCity: mockUpdateSelectedCity,
            loginWithGoogle: mockLoginWithGoogle
        });
    });

    const renderNavbar = () => {
        return render(
            <BrowserRouter>
                <Navbar />
            </BrowserRouter>
        );
    };

    it('renders logo', () => {
        renderNavbar();
        const logo = screen.getByAltText('Inmueble Advisor');
        expect(logo).toBeInTheDocument();
        expect(logo).toHaveAttribute('src', 'mock-logo.png');
    });

    it('renders navigation links', () => {
        renderNavbar();
        expect(screen.getByText('Catálogo')).toBeInTheDocument();
        expect(screen.getByText('Mapa')).toBeInTheDocument();
        expect(screen.getByText('Favoritos')).toBeInTheDocument();
    });

    it('shows login button when user is not logged in', () => {
        renderNavbar();
        expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
    });

    it('shows logout button when user is logged in', () => {
        useUser.mockReturnValue({
            user: { uid: '123' },
            userProfile: { nombre: 'Test User' },
            logout: mockLogout,
            selectedCity: 'Merida',
            updateSelectedCity: mockUpdateSelectedCity
        });
        renderNavbar();
        expect(screen.getByText('Cerrar Sesión (Test)')).toBeInTheDocument();
        expect(screen.queryByText('Iniciar Sesión')).not.toBeInTheDocument();
    });

    it('toggles mobile menu', () => {
        renderNavbar();
        const toggleBtn = screen.getByLabelText('Abrir menú');

        fireEvent.click(toggleBtn);
        // Assuming the button state changes or aria-expanded changes
        expect(screen.getByLabelText('Cerrar menú')).toBeInTheDocument();
    });

    it('shows city selector button if city is selected', () => {
        useUser.mockReturnValue({
            user: null,
            selectedCity: 'Merida',
            updateSelectedCity: mockUpdateSelectedCity,
            loginWithGoogle: mockLoginWithGoogle
        });
        renderNavbar();
        const cityBtn = screen.getByText('📍 Merida');
        expect(cityBtn).toBeInTheDocument();

        fireEvent.click(cityBtn);
        expect(mockUpdateSelectedCity).toHaveBeenCalledWith(null);
    });
});
