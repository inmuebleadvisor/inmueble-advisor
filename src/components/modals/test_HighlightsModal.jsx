import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HighlightsModal from './HighlightsModal';

// Mock Modal since it might depend on other things or context
vi.mock('../Modal', () => {
    return {
        default: ({ isOpen, onClose, title, children }) => {
            if (!isOpen) return null;
            return (
                <div role="dialog">
                    <h1>{title}</h1>
                    <button onClick={onClose} aria-label="Cerrar">X</button>
                    {children}
                    <button onClick={onClose} className="btn-entendido">¡Entendido!</button>
                </div>
            );
        }
    };
});

vi.mock('../../context/UserContext', () => ({
    useUser: vi.fn(() => ({ selectedCity: 'Cancun' }))
}));

vi.mock('../../context/FavoritesContext', () => ({
    useFavorites: vi.fn(() => ({ isFavorite: vi.fn(() => false) }))
}));

vi.mock('../common/FavoriteBtn', () => ({
    default: () => <div data-testid="favorite-btn" />
}));

describe('HighlightsModal', () => {
    const mockHighlights = ['Precio bajo', 'Cocina equipada', 'Jardín amplio'];
    const mockOnClose = vi.fn();

    it('renders nothing when highlights is empty', () => {
        const { container } = render(
            <HighlightsModal isOpen={true} onClose={mockOnClose} highlights={[]} />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing when highlights is null', () => {
        const { container } = render(
            <HighlightsModal isOpen={true} onClose={mockOnClose} highlights={null} />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('renders correctly when open and has highlights', () => {
        render(
            <HighlightsModal isOpen={true} onClose={mockOnClose} highlights={mockHighlights} />
        );

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/Felicidades, encontraste un/i)).toBeInTheDocument();

        mockHighlights.forEach(highlight => {
            expect(screen.getByText(highlight)).toBeInTheDocument();
        });
    });

    it('calls onClose when close button is clicked', () => {
        render(
            <HighlightsModal isOpen={true} onClose={mockOnClose} highlights={mockHighlights} />
        );

        // This targets the "¡Entendido!" button styled in the component
        const button = screen.getByText(/Entendido/i);
        fireEvent.click(button);
        expect(mockOnClose).toHaveBeenCalled();
    });
});
