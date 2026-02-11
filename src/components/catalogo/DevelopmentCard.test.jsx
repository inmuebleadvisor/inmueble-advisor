import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DevelopmentCard from './DevelopmentCard';
import { MemoryRouter } from 'react-router-dom';

// Mocks
vi.mock('../common/ImageLoader', () => ({
    default: ({ src, alt, className }) => <img src={src} alt={alt} className={className} data-testid="image-loader" />
}));

vi.mock('../../utils/amenityIconMapper.jsx', () => ({
    getAmenityIcon: () => () => <span data-testid="amenity-icon" />
}));

vi.mock('../../services/developmentService', () => ({
    getDevelopmentStatusTag: vi.fn((dev) => {
        if (dev.status === 'Preventa') return { label: 'PRE-VENTA', class: 'tag-warning' };
        return null;
    }),
    getDevelopmentCoverImage: vi.fn((dev, fallback) => dev?.imagen || fallback)
}));

const mockDevelopment = {
    id: 'dev-1',
    nombre: 'Test Development',
    ubicacion: { zona: 'Test Zone' },
    precioDesde: 5000000,
    amenidades: ['Pool', 'Gym'],
    matchingModels: [],
    matchCount: 0,
    imagen: 'test-image.jpg'
};

describe('DevelopmentCard', () => {
    it('renders correctly with basic props', () => {
        render(
            <MemoryRouter>
                <DevelopmentCard development={mockDevelopment} />
            </MemoryRouter>
        );

        expect(screen.getByText('Test Development')).toBeInTheDocument();
        expect(screen.getByText('Test Zone')).toBeInTheDocument();
        expect(screen.getByText('$5,000,000')).toBeInTheDocument(); // Checks default currency formatting
    });

    it('renders status tag when applicable', () => {
        const devWithStatus = { ...mockDevelopment, status: 'Preventa' };
        render(
            <MemoryRouter>
                <DevelopmentCard development={devWithStatus} />
            </MemoryRouter>
        );
        expect(screen.getByText('PRE-VENTA')).toBeInTheDocument();
    });

    it('shows amenities tooltip on interaction', () => {
        render(
            <MemoryRouter>
                <DevelopmentCard development={mockDevelopment} />
            </MemoryRouter>
        );

        const trigger = screen.getByText('2 Amenidades').closest('.development-card__amenities-trigger');
        fireEvent.click(trigger);

        expect(screen.getByText('Pool')).toBeInTheDocument();
        expect(screen.getByText('Gym')).toBeInTheDocument();
    });

    it('renders nothing if development is null', () => {
        const { container } = render(
            <MemoryRouter>
                <DevelopmentCard development={null} />
            </MemoryRouter>
        );
        expect(container).toBeEmptyDOMElement();
    });
});
