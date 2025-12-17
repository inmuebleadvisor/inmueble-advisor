import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../src/components/Layout';
import * as UserContextModule from '../src/context/UserContext';
import * as FavoritesContextModule from '../src/context/FavoritesContext';
import * as ThemeContextModule from '../src/context/ThemeContext';

// Mocks
vi.mock('../src/context/UserContext', () => ({ useUser: vi.fn() }));
vi.mock('../src/context/FavoritesContext', () => ({ useFavorites: vi.fn() }));
vi.mock('../src/context/ThemeContext', () => ({ useTheme: vi.fn() }));
// Mock child components that strictly aren't being tested here to avoid deep dependency issues
vi.mock('../src/components/common/WhatsAppButton/WhatsAppButton', () => ({ default: () => <div data-testid="whatsapp-btn" /> }));
vi.mock('../src/components/shared/ThemeToggle', () => ({ default: () => <div data-testid="theme-toggle" /> }));
vi.mock('../src/components/SeasonalTheme', () => ({ default: () => <div data-testid="seasonal-theme" /> }));

describe('Layout', () => {
    beforeEach(() => {
        // Default Mock Return Values
        UserContextModule.useUser.mockReturnValue({
            userProfile: { role: 'user', nombre: 'TestUser' },
            user: { uid: '123' },
            logout: vi.fn(),
            selectedCity: 'CDMX',
            updateSelectedCity: vi.fn(),
            loginWithGoogle: vi.fn()
        });
        FavoritesContextModule.useFavorites.mockReturnValue({
            favoritosIds: []
        });
        ThemeContextModule.useTheme.mockReturnValue({
            currentAssets: { logo: 'https://example.com/logo.png', footer: null },
            seasonalEnabled: false // Legacy prop just in case, though refactored out
        });
    });

    it('should render the correct logo from ThemeContext', () => {
        render(
            <MemoryRouter>
                <Layout />
            </MemoryRouter>
        );
        const logo = screen.getByAltText('Inmueble Advisor');
        expect(logo).toHaveAttribute('src', 'https://example.com/logo.png');
    });

    it('should render navigation links', () => {
        render(
            <MemoryRouter>
                <Layout />
            </MemoryRouter>
        );
        expect(screen.getByText('Catálogo')).toBeInTheDocument();
        expect(screen.getByText('Mapa')).toBeInTheDocument();
        expect(screen.getByText('Favoritos')).toBeInTheDocument();
    });

    it('should show "Mis Leads" for asesor role', () => {
        UserContextModule.useUser.mockReturnValue({
            userProfile: { role: 'asesor', nombre: 'AsesorUser' },
            user: { uid: '456' },
            logout: vi.fn(),
            selectedCity: null,
            updateSelectedCity: vi.fn()
        });

        render(
            <MemoryRouter>
                <Layout />
            </MemoryRouter>
        );
        expect(screen.getByText('Mis Leads')).toBeInTheDocument();
    });
});
