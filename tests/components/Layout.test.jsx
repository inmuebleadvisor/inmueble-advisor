import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../../src/components/Layout';
// Mock hooks directly
import * as UserContextModule from '../../src/context/UserContext';
import * as ThemeContextModule from '../../src/context/ThemeContext';
import * as FavoritesContextModule from '../../src/context/FavoritesContext';

// Mock values
const mockUserContextValue = {
    userProfile: { role: 'cliente', nombre: 'Test User' },
    user: { uid: '123' },
    logout: vi.fn(),
    selectedCity: null,
    updateSelectedCity: vi.fn(),
    loginWithGoogle: vi.fn(),
};

const mockThemeContextValue = {
    theme: 'dark',
    toggleTheme: vi.fn(),
};

const mockFavoritesContextValue = {
    favoritosIds: []
};

// Mock useCatalog from the correct path
vi.mock('../../src/context/CatalogContext', () => ({
    useCatalog: () => ({
        getModeloById: vi.fn(),
        getDesarrolloById: vi.fn(),
    }),
}));

describe('Layout Component', () => {
    // Setup mocks before each test
    vi.spyOn(UserContextModule, 'useUser').mockReturnValue(mockUserContextValue);
    vi.spyOn(ThemeContextModule, 'useTheme').mockReturnValue(mockThemeContextValue);
    vi.spyOn(FavoritesContextModule, 'useFavorites').mockReturnValue(mockFavoritesContextValue);

    it('renders with correct BEM classes', () => {
        const { container } = render(
            <MemoryRouter>
                <Layout />
            </MemoryRouter>
        );

        // removing inline styles check, verifying classes
        const layoutElement = container.querySelector('.layout');
        expect(layoutElement).toBeInTheDocument();
        expect(layoutElement).not.toHaveAttribute('style'); // Should not have inline styles for container

        const header = container.querySelector('.header');
        expect(header).toBeInTheDocument();

        // Check for logo
        const logoLink = container.querySelector('.header__logo-link');
        expect(logoLink).toBeInTheDocument();
    });

    it('renders navigation menu', () => {
        const { container } = render(
            <MemoryRouter>
                <Layout />
            </MemoryRouter>
        );
        const nav = container.querySelector('.nav');
        expect(nav).toBeInTheDocument();

        // Check nav links classes
        const links = container.querySelectorAll('.nav__link');
        expect(links.length).toBeGreaterThan(0);
    });

    it('renders footer with classes', () => {
        const { container } = render(
            <MemoryRouter>
                <Layout />
            </MemoryRouter>
        );
        const footer = container.querySelector('.footer');
        expect(footer).toBeInTheDocument();

        const footerLinks = container.querySelector('.footer__links');
        expect(footerLinks).toBeInTheDocument();
    });
});
