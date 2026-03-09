import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShareSimulatorPDF } from './useShareSimulatorPDF';

// Mock dependencias externas
vi.mock('jspdf', () => {
    return {
        jsPDF: vi.fn().mockImplementation(() => ({
            setFillColor: vi.fn(),
            rect: vi.fn(),
            addImage: vi.fn(),
            setFontSize: vi.fn(),
            setTextColor: vi.fn(),
            setFont: vi.fn(),
            text: vi.fn(),
            roundedRect: vi.fn(),
            setDrawColor: vi.fn(),
            line: vi.fn(),
            output: vi.fn().mockReturnValue('mock-blob'),
            internal: { getNumberOfPages: vi.fn().mockReturnValue(1) },
            setPage: vi.fn()
        }))
    };
});

vi.mock('jspdf-autotable', () => {
    return {
        default: vi.fn()
    };
});

// Mock helpers para evitar carga real de imágenes
vi.mock('../utils/imageUtils', () => ({
    resolveImageUrl: vi.fn(url => url),
    getBase64ImageFromUrl: vi.fn().mockResolvedValue('data:image/png;base64,mock')
}));

describe('useShareSimulatorPDF', () => {
    const defaultPayload = {
        propertyData: {
            title: 'Test Property',
            developmentName: 'Test Dev',
            bedrooms: 2, baths: 1, area: 100, url: 'http://test.com'
        },
        hasModifiedPrice: false,
        price: 1000000,
        term: 20,
        downPayment: 100000,
        result: {
            desembolsoInicial: 150000,
            tablaAmortizacion: [{
                mes: 1, saldoInicial: 900000, interes: 7500, capital: 1000, segurosComisiones: 500, pagoMensual: 9000, saldoFinal: 899000
            }]
        },
        promedioMensualidad: 9000,
        extraPayment: 0,
        acceleratedResult: null,
        bankName: 'BANORTE',
        productName: 'Hipoteca',
        interestRate: '10.5%',
        catValue: '12%'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock navigator para la descarga
        global.navigator.canShare = vi.fn().mockReturnValue(false);
        global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock');
        global.URL.revokeObjectURL = vi.fn();
    });

    it('should initialize with correct default states', () => {
        const { result } = renderHook(() => useShareSimulatorPDF());
        expect(result.current.isGeneratingPDF).toBe(false);
        expect(result.current.errorPDF).toBeNull();
    });

    it('should generate PDF without errors', async () => {
        const dummyClick = vi.fn();
        const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
            click: dummyClick
        });

        const { result } = renderHook(() => useShareSimulatorPDF());

        await act(async () => {
            await result.current.generateAndSharePDF(defaultPayload);
        });

        expect(result.current.isGeneratingPDF).toBe(false);
        expect(result.current.errorPDF).toBeNull();
        expect(dummyClick).toHaveBeenCalled();

        createElementSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
        // Force an error
        vi.spyOn(document, 'createElement').mockImplementation(() => {
            throw new Error('Test Generation Error');
        });

        const { result } = renderHook(() => useShareSimulatorPDF());

        await act(async () => {
            await result.current.generateAndSharePDF(defaultPayload);
        });

        expect(result.current.isGeneratingPDF).toBe(false);
        expect(result.current.errorPDF).toBe('No pudimos generar el PDF.');

        vi.restoreAllMocks();
    });
});
