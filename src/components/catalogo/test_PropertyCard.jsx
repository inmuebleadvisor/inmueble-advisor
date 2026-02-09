import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PropertyCard from './PropertyCard';
import { MemoryRouter } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

// Mock contexts
vi.mock('../../context/UserContext', () => ({
    useUser: vi.fn(() => ({
        trackBehavior: vi.fn()
    }))
}));

// Mock child components
vi.mock('../common/ImageLoader', () => ({ default: () => <div data-testid="image-loader" /> }));
vi.mock('../common/FavoriteBtn', () => ({ default: () => <div data-testid="favorite-btn" /> }));
vi.mock('../common/Delightbox', () => ({ default: () => <div data-testid="delightbox" /> }));
vi.mock('../modals/HighlightsModal', () => ({ default: ({ modeloId }) => <div data-testid="highlights-modal" data-modelid={modeloId} /> }));

const MockProviders = ({ children }) => (
    <MemoryRouter>
        {children}
    </MemoryRouter>
);

describe('PropertyCard', () => {
    const mockItem = {
        id: '123',
        nombre_modelo: 'Modelo Test',
        nombreDesarrollo: 'Desarrollo Test',
        precioNumerico: 2500000,
        recamaras: 3,
        banos: 2,
        m2: 120,
        imagenes: [],
        status: ['PREVENTA']
    };

    it('renders basic information correctly', () => {
        render(
            <MockProviders>
                <PropertyCard item={mockItem} />
            </MockProviders>
        );

        expect(screen.getByText('Modelo Test')).toBeDefined();
        expect(screen.getByText('Desarrollo Test')).toBeDefined();
        expect(screen.getByText('$2,500,000')).toBeDefined();
    });

    it('renders Preventa status with correct warning class', () => {
        render(
            <MockProviders>
                <PropertyCard item={mockItem} />
            </MockProviders>
        );

        const statusTag = screen.getByText('PRE-VENTA');
        expect(statusTag).toBeDefined();
        expect(statusTag.className).toContain('property-card__status-tag--warning');
    });

    it('renders Inmediata status with correct success class', () => {
        const itemImmediate = { ...mockItem, status: ['ENTREGA INMEDIATA'] };
        render(
            <MockProviders>
                <PropertyCard item={itemImmediate} />
            </MockProviders>
        );

        const statusTag = screen.getByText('ENTREGA INMEDIATA');
        expect(statusTag).toBeDefined();
        expect(statusTag.className).toContain('property-card__status-tag--success');
    });

    it('renders Mixed status with correct info class', () => {
        const itemMixed = { ...mockItem, status: ['PREVENTA', 'ENTREGA INMEDIATA'] };
        render(
            <MockProviders>
                <PropertyCard item={itemMixed} />
            </MockProviders>
        );

        const statusTag = screen.getByText('Inmediato/Preventa');
        expect(statusTag.className).toContain('property-card__status-tag--info');
    });

    it('applies muted class for hidden price', () => {
        const itemNoPrice = { ...mockItem, precioNumerico: 0 };
        render(
            <MockProviders>
                <PropertyCard item={itemNoPrice} />
            </MockProviders>
        );

        const price = screen.getByText('Consultar Precio');
        expect(price.className).toContain('property-card__price-value--muted');
    });
});
