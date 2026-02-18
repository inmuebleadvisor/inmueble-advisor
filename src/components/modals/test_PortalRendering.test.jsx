
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import FilterModal from './FilterModal';
import { BrowserRouter } from 'react-router-dom';

// Mocks
vi.mock('../common/Icons', () => ({
    Icons: { Close: () => <span>CloseIcon</span> }
}));

vi.mock('../../utils/formatters', () => ({
    formatoMoneda: (val) => `$${val}`
}));

vi.mock('../../config/constants', () => ({
    UI_OPCIONES: { FILTRO_PRECIO_MAX: 10000000, FILTRO_PRECIO_STEP: 100000 }
}));

// Mock Portal to verify it's used
vi.mock('../common/Portal', () => ({
    default: ({ children }) => <div data-testid="portal-mock">{children}</div>
}));

const renderWithRouter = (ui) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('FilterModal Portal Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe renderizarse dentro de un Portal cuando está abierto', () => {
        const props = {
            isOpen: true,
            onClose: vi.fn(),
            filtros: { precioMin: 0, precioMax: 10000000, habitaciones: 0, tipo: 'all', status: 'all', amenidad: '' },
            setFiltros: vi.fn(),
            limpiarTodo: vi.fn(),
            topAmenidades: [],
            resultadosCount: 5
        };

        renderWithRouter(<FilterModal {...props} />);

        // Verify Portal wrapper exists
        expect(screen.getByTestId('portal-mock')).toBeInTheDocument();
        // Verify Modal content is inside
        expect(screen.getByText('Filtros')).toBeInTheDocument();
    });

    it('no debe renderizar nada si isOpen es false', () => {
        const props = {
            isOpen: false,
            // ... other props
        };
        renderWithRouter(<FilterModal {...props} />);
        expect(screen.queryByTestId('portal-mock')).not.toBeInTheDocument();
    });
});
