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

// Mock del hook de PDF para evitar errores de renderizado en vitest
vi.mock('../../hooks/useShareSimulatorPDF', () => ({
    useShareSimulatorPDF: () => ({
        isGeneratingPDF: false,
        errorPDF: null,
        generateAndSharePDF: vi.fn(),
    }),
}));

describe('MortgageSimulatorModal', () => {
    it('renders the mortgage simulator modal correctly', () => {
        const handleClose = vi.fn();
        render(<MortgageSimulatorModal onClose={handleClose} initialPrice={1500000} />);

        // Verifica que el header renderice
        expect(screen.getByText(/Simulador de Crédito/i)).toBeInTheDocument();

        // Verifica elementos de la UI vertical nueva (Hero)
        expect(screen.getByText(/PAGO MENSUAL ESTIMADO/i)).toBeInTheDocument();
    });

    it('should trigger PDF generation when share button is clicked', async () => {
        const mockGenerate = vi.fn();
        vi.mocked(require('../../hooks/useShareSimulatorPDF').useShareSimulatorPDF).mockReturnValue({
            isGeneratingPDF: false,
            errorPDF: null,
            generateAndSharePDF: mockGenerate
        });

        const handleClose = vi.fn();
        render(<MortgageSimulatorModal onClose={handleClose} initialPrice={1500000} />);

        // Obtnemos el botón de exportar usando aria-label o role (en este caso es el único con "Compartir PDF" en hover o el icono)
        // Buscamos por texto si existe algún tooltip/texto visible, u obtenemos el botón específico.
        // Dado que el componente envuelve el icono en un action-btn:
        const shareBtn = screen.getByTitle('Compartir PDF');

        expect(shareBtn).toBeInTheDocument();
        shareBtn.click();

        // Verificamos que se haya intentado generar el PDF. 
        // Se llama de forma asíncrona, pero el handler interno hace 'await generateAndSharePDF(...)'.
        // Debido a cómo funcionan los eventos de React testing library con mocks, verificamos si fue llamado.
        expect(mockGenerate).toHaveBeenCalled();

        // Verificamos partes clave del payload que se inyectan en el nuevo PDF
        const callArgs = mockGenerate.mock.calls[0][0];
        expect(callArgs).toHaveProperty('bankName', 'BANORTE');
        expect(callArgs).toHaveProperty('interestRate', '10.15%');
        expect(callArgs).toHaveProperty('catValue', '12.3%');
    });
});
