import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import SearchBar from './SearchBar';

describe('SearchBar Component', () => {
    it('renders correctly with given placeholder', () => {
        render(<SearchBar searchTerm="" setSearchTerm={vi.fn()} />);
        expect(screen.getByPlaceholderText(/Buscar desarrollo, zona, constructora/i)).toBeInTheDocument();
    });

    it('calls setSearchTerm on input change', () => {
        const mockSetSearchTerm = vi.fn();
        render(<SearchBar searchTerm="" setSearchTerm={mockSetSearchTerm} />);

        const input = screen.getByPlaceholderText(/Buscar desarrollo/i);
        fireEvent.change(input, { target: { value: 'Tulum' } });

        expect(mockSetSearchTerm).toHaveBeenCalledWith('Tulum');
    });

    it('triggers onClick when clicked', () => {
        const mockOnClick = vi.fn();
        const { container } = render(<SearchBar searchTerm="" setSearchTerm={vi.fn()} onClick={mockOnClick} />);

        // The outermost div has the onClick event handler
        fireEvent.click(container.firstChild);

        expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
});
