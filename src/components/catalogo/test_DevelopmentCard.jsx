import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import DevelopmentCard from './DevelopmentCard';

// Mocks
vi.mock('../common/ImageLoader', () => ({
    default: ({ src, alt }) => <img data-testid="image-loader" src={src} alt={alt} />
}));

describe('DevelopmentCard Component', () => {
    const mockDevelopment = {
        id: 'dev123',
        nombre: 'Torre Zafiro',
        ubicacion: { zona: 'Norte' },
        amenidades: ['Alberca', 'Gimnasio', 'Seguridad 24/7'],
        matchingModels: [
            { id: 'mod1', nombre_modelo: 'Loft', precioNumerico: 1500000, recamaras: 1, banos: 1 },
            { id: 'mod2', nombre_modelo: 'Penthouse', precioNumerico: 3500000, recamaras: 3, banos: 2 }
        ],
        matchCount: 2,
        precioDesde: 1500000
    };

    it('renders the development details correctly', () => {
        render(
            <BrowserRouter>
                <DevelopmentCard development={mockDevelopment} />
            </BrowserRouter>
        );

        expect(screen.getByText('Torre Zafiro')).toBeInTheDocument();
        expect(screen.getByText('Norte')).toBeInTheDocument();

        // Formatter check
        expect(screen.getByText('$1,500,000')).toBeInTheDocument();

        // Check if models are rendered
        expect(screen.getByText('Loft')).toBeInTheDocument();
        expect(screen.getByText('Penthouse')).toBeInTheDocument();
    });

    it('displays the amenity count', () => {
        render(
            <BrowserRouter>
                <DevelopmentCard development={mockDevelopment} />
            </BrowserRouter>
        );

        expect(screen.getByText('3 Amenidades')).toBeInTheDocument();
    });

    it('renders nothing if development is null', () => {
        const { container } = render(
            <BrowserRouter>
                <DevelopmentCard development={null} />
            </BrowserRouter>
        );

        expect(container.firstChild).toBeNull();
    });
});
