import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import MortgageSimulatorModal from './MortgageSimulatorModal';

// Mock the hook para prevenir cálculos reales y renders asíncronos en test
vi.mock('../../hooks/useMortgageSimulator', () => ({
    useMortgageSimulator: () => ({
        isLoading: false,
        errorMessages: [],
        result: null,
        simulate: vi.fn(),
    }),
}));

describe('MortgageSimulatorModal', () => {
    it('renders the mortgage simulator modal correctly', () => {
        const handleClose = vi.fn();
        render(<MortgageSimulatorModal onClose={handleClose} initialPrice={1500000} />);

        // Verifica que el header renderice
        expect(screen.getByText(/Simulador de Crédito/i)).toBeInTheDocument();

        // Verifica elementos de la UI vertical nueva (Hero)
        expect(screen.getByText(/TU PAGO MENSUAL ESTIMADO/i)).toBeInTheDocument();

        // Verifica textos de Salud Financiera
        expect(screen.getByText(/SALUD FINANCIERA/i)).toBeInTheDocument();
    });
});
