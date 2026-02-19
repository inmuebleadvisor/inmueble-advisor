import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import FeaturedDevelopers from './FeaturedDevelopers';
import { ServiceProvider } from '../../context/ServiceContext';
import { UserContext } from '../../context/UserContext';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('FeaturedDevelopers Component', () => {
    const mockCatalog = {
        obtenerInventarioDesarrollos: vi.fn(),
    };

    const mockTrackBehavior = vi.fn();
    const mockUserContext = {
        selectedCity: 'Tulum',
        trackBehavior: mockTrackBehavior,
    };

    const mockDevelopers = [
        { id: 'dev1', nombre: 'Desarrollo 1', ubicacion: { ciudad: 'Tulum' }, imagen: 'img1.jpg' },
        { id: 'dev2', nombre: 'Desarrollo 2', ubicacion: { ciudad: 'Cancun' }, imagen: 'img2.jpg' },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockCatalog.obtenerInventarioDesarrollos.mockResolvedValue(mockDevelopers);
    });

    const renderComponent = (userCtx = mockUserContext) => {
        return render(
            <BrowserRouter>
                <ServiceProvider overrideServices={{ catalog: mockCatalog }}>
                    <UserContext.Provider value={userCtx}>
                        <FeaturedDevelopers />
                    </UserContext.Provider>
                </ServiceProvider>
            </BrowserRouter>
        );
    };

    it('renders filtered developments based on selected city', async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Desarrollos en Tulum')).toBeInTheDocument();
            expect(screen.getByText('Desarrollo 1')).toBeInTheDocument();
            expect(screen.queryByText('Desarrollo 2')).not.toBeInTheDocument();
        });
    });

    it('navigates and tracks when a development is clicked', async () => {
        renderComponent();

        await waitFor(() => {
            const devItem = screen.getByText('Desarrollo 1').closest('.featured-developers__item');
            fireEvent.click(devItem);
        });

        expect(mockTrackBehavior).toHaveBeenCalledWith('select_development', {
            id: 'dev1',
            nombre: 'Desarrollo 1',
            origin: 'home_featured'
        });
        expect(mockNavigate).toHaveBeenCalledWith('/desarrollo/dev1');
    });

    it('renders generic title when no city is selected', async () => {
        renderComponent({ ...mockUserContext, selectedCity: null });

        await waitFor(() => {
            expect(screen.getByText('Desarrollos Destacados')).toBeInTheDocument();
            expect(screen.getByText('Desarrollo 1')).toBeInTheDocument();
            expect(screen.getByText('Desarrollo 2')).toBeInTheDocument();
        });
    });
});
