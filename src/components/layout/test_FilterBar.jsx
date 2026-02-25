import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import FilterBar from './FilterBar';

describe('FilterBar Component', () => {
    const defaultFiltros = {
        precioMin: 0,
        precioMax: 10000000,
        habitaciones: 0,
        tipo: 'all',
        status: 'all',
        amenidad: ''
    };

    it('renders the core trigger button', () => {
        render(<FilterBar setIsFilterOpen={vi.fn()} hayFiltrosActivos={false} limpiarTodo={vi.fn()} filtros={defaultFiltros} />);
        expect(screen.getByText(/Filtros/i)).toBeInTheDocument();
        // Clear all button should not be present
        expect(screen.queryByTitle(/Limpiar filtros/i)).not.toBeInTheDocument();
    });

    it('renders the clear all button when filters are active', () => {
        render(<FilterBar setIsFilterOpen={vi.fn()} hayFiltrosActivos={true} limpiarTodo={vi.fn()} filtros={defaultFiltros} />);
        expect(screen.getByTitle(/Limpiar filtros/i)).toBeInTheDocument();
    });

    it('calls setIsFilterOpen when trigger is clicked', () => {
        const mockSetIsFilterOpen = vi.fn();
        render(<FilterBar setIsFilterOpen={mockSetIsFilterOpen} hayFiltrosActivos={false} limpiarTodo={vi.fn()} filtros={defaultFiltros} />);

        const triggerBtn = screen.getByRole('button', { name: /Filtros/i });
        fireEvent.click(triggerBtn);

        expect(mockSetIsFilterOpen).toHaveBeenCalledWith(true);
    });

    it('displays active filter chips correctly', () => {
        const activeFiltros = {
            ...defaultFiltros,
            habitaciones: 2,
            tipo: 'casa',
            status: 'preventa'
        };

        render(<FilterBar setIsFilterOpen={vi.fn()} hayFiltrosActivos={true} limpiarTodo={vi.fn()} filtros={activeFiltros} />);

        expect(screen.getByText('2+ Rec.')).toBeInTheDocument();
        expect(screen.getByText('Casas')).toBeInTheDocument();
        expect(screen.getByText('Pre-Venta')).toBeInTheDocument();
    });
});
