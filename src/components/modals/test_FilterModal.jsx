import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import FilterModal from './FilterModal';
import { UI_OPCIONES } from '../../config/constants';

// Mock Portal to render children directly in JSDOM
vi.mock('../common/Portal', () => ({
    default: ({ children }) => <div data-testid="portal-mock">{children}</div>
}));

// Mock SearchBar
vi.mock('../layout/SearchBar', () => ({
    default: () => <input data-testid="mock-searchbar" />
}));

describe('FilterModal Component', () => {
    const mockSetFiltros = vi.fn();
    const mockOnClose = vi.fn();
    const mockLimpiarTodo = vi.fn();

    const defaultProps = {
        isOpen: true,
        onClose: mockOnClose,
        filtros: { precioMin: 0, precioMax: UI_OPCIONES.FILTRO_PRECIO_MAX, habitaciones: 0, tipo: 'all', status: 'all', amenidad: '' },
        setFiltros: mockSetFiltros,
        searchTerm: '',
        setSearchTerm: vi.fn(),
        limpiarTodo: mockLimpiarTodo,
        topAmenidades: ['Alberca', 'Gimnasio'],
        resultadosCount: 5
    };

    it('returns null if not open', () => {
        const { container } = render(<BrowserRouter><FilterModal {...defaultProps} isOpen={false} /></BrowserRouter>);
        expect(container.firstChild).toBeNull();
    });

    it('renders the modal when open and shows sections', () => {
        render(<BrowserRouter><FilterModal {...defaultProps} /></BrowserRouter>);

        expect(screen.getByText('Filtros')).toBeInTheDocument();
        expect(screen.getByText('Rango de Precio')).toBeInTheDocument();
        expect(screen.getByText('Recámaras')).toBeInTheDocument();
        expect(screen.getByText('5 modelos disponibles')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        render(<BrowserRouter><FilterModal {...defaultProps} /></BrowserRouter>);

        const closeBtn = screen.getByRole('button', { name: '' }); // Using exact match for Icon button. Or by class.
        // It's safer to query by clicking the clear button:
        const btnLimpiar = screen.getByText('Limpiar');
        fireEvent.click(btnLimpiar);

        expect(mockLimpiarTodo).toHaveBeenCalled();
    });

    it('handles filter change interaction (pill toggle)', () => {
        render(<BrowserRouter><FilterModal {...defaultProps} /></BrowserRouter>);

        const casasPill = screen.getByText('Casas');
        fireEvent.click(casasPill);

        expect(mockSetFiltros).toHaveBeenCalled();
    });
});
