import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMortgageSimulator } from './useMortgageSimulator';

// Mock del hook bridge useService para aislar useMortgageSimulator
vi.mock('./useService', () => ({
    useService: () => ({
        mortgageSimulator: mockMortgageSimulator
    })
}));

// Mock del servicio inyectado
const mockMortgageSimulator = {
    getSimulation: vi.fn(),
    getAcceleratedSimulation: vi.fn()
};

describe('useMortgageSimulator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debería inicializar con estado vacío', () => {
        const { result } = renderHook(() => useMortgageSimulator());

        expect(result.current.result).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.errorMessages).toEqual([]);
    });

    it('simulate() debería llamar a mortgageSimulator.getSimulation y actualizar result', async () => {
        const mockSimulation = {
            error: false,
            mensualidad: 15000,
            montoCredito: 900000,
            tablaAmortizacion: []
        };
        mockMortgageSimulator.getSimulation.mockReturnValue(mockSimulation);

        const { result } = renderHook(() => useMortgageSimulator());

        await act(async () => {
            await result.current.simulate(1000000, 100000, 20);
        });

        expect(mockMortgageSimulator.getSimulation).toHaveBeenCalledWith(1000000, 100000, 20);
        expect(result.current.result).toEqual(mockSimulation);
        expect(result.current.errorMessages).toEqual([]);
        expect(result.current.isLoading).toBe(false);
    });

    it('simulate() debería manejar un resultado con error sin romper la UI', async () => {
        mockMortgageSimulator.getSimulation.mockReturnValue({
            error: true,
            messages: ['El enganche debe ser al menos del 10%.']
        });

        const { result } = renderHook(() => useMortgageSimulator());

        await act(async () => {
            await result.current.simulate(1000000, 10000, 20);
        });

        expect(result.current.result).toBeNull();
        expect(result.current.errorMessages).toContain('El enganche debe ser al menos del 10%.');
        expect(result.current.isLoading).toBe(false);
    });

    it('simulateAccelerated() debería delegar al servicio y retornar el resultado', () => {
        const mockAhorro = {
            mesesAhorrados: 24,
            interesAhorrado: 50000
        };
        mockMortgageSimulator.getAcceleratedSimulation.mockReturnValue(mockAhorro);

        const { result } = renderHook(() => useMortgageSimulator());

        let ahorro;
        act(() => {
            ahorro = result.current.simulateAccelerated(1000000, 100000, 20, 2000);
        });

        expect(mockMortgageSimulator.getAcceleratedSimulation).toHaveBeenCalledWith(1000000, 100000, 20, 2000);
        expect(ahorro).toEqual(mockAhorro);
    });

    it('simulateAccelerated() debería retornar error controlado si el servicio lanza excepción', () => {
        mockMortgageSimulator.getAcceleratedSimulation.mockImplementation(() => {
            throw new Error('Fallo interno');
        });

        const { result } = renderHook(() => useMortgageSimulator());

        let ahorro;
        act(() => {
            ahorro = result.current.simulateAccelerated(1000000, 100000, 20, 2000);
        });

        expect(ahorro.error).toBe(true);
        expect(ahorro.messages[0]).toContain('Error interno');
    });
});
