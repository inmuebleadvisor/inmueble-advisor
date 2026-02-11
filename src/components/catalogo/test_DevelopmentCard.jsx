import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import DevelopmentCard from './DevelopmentCard';

/**
 * Mocks and Helpers for DevelopmentCard tests
 */
const mockDevelopment = {
    id: 'dev123',
    nombre: 'Residencial Paraíso',
    imagen: 'https://example.com/image.jpg',
    precioDesde: 2500000,
    ubicacion: { zona: 'Norte' },
    amenidades: ['Alberca', 'Gimnasio', 'Seguridad'],
    matchingModels: [
        { id: 'm1', nombre_modelo: 'Modelo A', precioNumerico: 2500000, recamaras: 3, banos: 2 }
    ],
    matchCount: 1
};

const renderWithRouter = (ui) => {
    return render(
        <BrowserRouter>
            {ui}
        </BrowserRouter>
    );
};

describe('DevelopmentCard', () => {

    /**
     * Test basic rendering of the card
     */
    it('debe renderizar el nombre del desarrollo', () => {
        renderWithRouter(<DevelopmentCard development={mockDevelopment} />);
        expect(screen.getByText('Residencial Paraíso')).toBeInTheDocument();
    });

    /**
     * Test price formatting
     */
    it('debe mostrar el precio formateado', () => {
        renderWithRouter(<DevelopmentCard development={mockDevelopment} />);
        // formatoMoneda uses es-MX, so $2,500,000 is expected
        expect(screen.getByText(/\$2,500,000/)).toBeInTheDocument();
    });

    /**
     * Test the updated amenities badge text (Requirement check)
     */
    it('debe mostrar el conteo de amenidades con el texto "Amenidades"', () => {
        renderWithRouter(<DevelopmentCard development={mockDevelopment} />);
        expect(screen.getByText('3 Amenidades')).toBeInTheDocument();
    });

    /**
     * Verify the redundant label is not visible (Requirement check)
     */
    it('no debe mostrar el texto visible "AMENIDADES"', () => {
        renderWithRouter(<DevelopmentCard development={mockDevelopment} />);
        const labels = screen.queryAllByText('Amenidades');
        // The one in the badge should be "3 Amenidades", so we check the exact "Amenidades" label
        const amenityLabel = labels.find(el => el.textContent === 'Amenidades');

        if (amenityLabel) {
            expect(amenityLabel).toHaveStyle({ opacity: 0 });
        }
    });

    /**
     * Test the updated models preview title (Requirement check)
     */
    it('debe mostrar el título dinámico "X Modelos:"', () => {
        renderWithRouter(<DevelopmentCard development={mockDevelopment} />);
        expect(screen.getByText('1 Modelos:')).toBeInTheDocument();
    });

    /**
     * Test the million-formatted price in model preview
     */
    it('debe mostrar el precio del modelo en formato millones', () => {
        renderWithRouter(<DevelopmentCard development={mockDevelopment} />);
        expect(screen.getByText('$2.50 Mill.')).toBeInTheDocument();
    });

    /**
     * Test room and bathroom counts in model preview
     */
    it('debe mostrar el conteo de habitaciones y baños', () => {
        renderWithRouter(<DevelopmentCard development={mockDevelopment} />);
        expect(screen.getByText('3')).toBeInTheDocument(); // Recámaras
        expect(screen.getByText('2')).toBeInTheDocument(); // Baños
    });

    /**
     * Test interactive tooltip
     */
    it('debe mostrar el tooltip al interactuar con las amenidades', () => {
        renderWithRouter(<DevelopmentCard development={mockDevelopment} />);

        // Find the badge text which is part of the trigger
        const badgeText = screen.getByText('3 Amenidades');
        const trigger = badgeText.closest('.development-card__amenities-trigger');

        fireEvent.mouseEnter(trigger);

        expect(screen.getByText('Alberca')).toBeInTheDocument();
        expect(screen.getByText('Gimnasio')).toBeInTheDocument();
    });

    /**
     * Test empty development handling
     */
    it('debe retornar null si no hay desarrollo', () => {
        const { container } = renderWithRouter(<DevelopmentCard development={null} />);
        expect(container.firstChild).toBeNull();
    });
});
