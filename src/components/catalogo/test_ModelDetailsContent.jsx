/**
 * @file test_ModelDetailsContent.jsx
 * @description Pruebas de alto valor para el componente Orquestador ModelDetailsContent.
 *
 * ALCANCE (per MANUALDEARQUITECTURA.md - Numeral 5):
 *  ✅ Se prueban: Triggers de negocio / lógica de estado (auth, apertura de modales).
 *  🚫 No se prueban: Estilos, renderizado estético, subcomponentes visuales.
 *
 * MOCKS: Todos los subcomponentes visuales son reemplazados por stubs mínimos
 * para aislar el comportamiento del orquestador sin depender del DOM.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModelDetailsContent from './ModelDetailsContent';
import { useUser } from '../../context/UserContext';
import { useStickyPanel } from '../../hooks/useStickyPanel';

// ── Mocks ──────────────────────────────────────────────────────────────────
vi.mock('../../context/UserContext');
vi.mock('../../hooks/useStickyPanel');

// Subcomponentes visuales: stubs mínimos para aislar el orquestador
vi.mock('./model-details/ModelHeader',      () => ({ default: () => <div data-testid="model-header" /> }));
vi.mock('./model-details/ModelPricingCard', () => ({
    default: ({ onSchedule }) => (
        <div data-testid="model-pricing-card">
            <button onClick={onSchedule}>Agenda tu Recorrido</button>
        </div>
    )
}));
vi.mock('./model-details/ModelHeaderInfo',  () => ({ default: () => <div data-testid="model-header-info" /> }));
vi.mock('./model-details/ModelDescription', () => ({ default: () => <div data-testid="model-description" /> }));
vi.mock('./model-details/ModelFloorPlans',  () => ({ default: () => <div data-testid="model-floor-plans" /> }));

// Componentes compartidos
vi.mock('../leads/LeadCaptureForm', () => ({
    default: ({ onCancel }) => (
        <div data-testid="lead-form">
            <button onClick={onCancel}>Cerrar</button>
        </div>
    )
}));
vi.mock('../modals/MortgageSimulatorModal', () => ({
    default: ({ onClose }) => (
        <div data-testid="simulator-modal">
            <button onClick={onClose}>Cerrar</button>
        </div>
    )
}));
vi.mock('./FinanciamientoWidget',           () => ({ default: () => <div /> }));
vi.mock('./DevelopmentInfoSection',         () => ({ default: () => <div /> }));
vi.mock('../layout/StickyActionPanel',      () => ({
    default: ({ onMainAction }) => <button onClick={onMainAction}>FAB Cotizar</button>
}));

// ── Fixture ────────────────────────────────────────────────────────────────
const mockModelo = {
    id: 'modelo-1',
    nombre_modelo: 'Aura',
    precioNumerico: 1500000,
    imagenes: [],
    plants: []
};

describe('ModelDetailsContent — Triggers de Orquestación', () => {
    const mockLoginWithGoogle = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Por defecto: sin sticky panel visible
        useStickyPanel.mockReturnValue(false);
    });

    it('monta los subcomponentes principales correctamente', () => {
        useUser.mockReturnValue({ user: { uid: '123' }, loginWithGoogle: mockLoginWithGoogle });

        render(<ModelDetailsContent modelo={mockModelo} />);

        expect(screen.getByTestId('model-header')).toBeInTheDocument();
        expect(screen.getByTestId('model-header-info')).toBeInTheDocument();
        expect(screen.getAllByTestId('model-pricing-card').length).toBe(2);
        expect(screen.getByTestId('model-description')).toBeInTheDocument();
    });

    it('abre LeadCaptureForm al hacer click en "Agenda tu Recorrido"', async () => {
        useUser.mockReturnValue({ user: { uid: '123' }, loginWithGoogle: mockLoginWithGoogle });

        render(<ModelDetailsContent modelo={mockModelo} />);

        const buttons = screen.getAllByText('Agenda tu Recorrido');
        fireEvent.click(buttons[0]);

        await waitFor(() => {
            expect(screen.getByTestId('lead-form')).toBeInTheDocument();
        });
    });

    it('cierra el LeadCaptureForm al llamar onCancel', async () => {
        useUser.mockReturnValue({ user: { uid: '123' }, loginWithGoogle: mockLoginWithGoogle });

        render(<ModelDetailsContent modelo={mockModelo} />);
        const buttons = screen.getAllByText('Agenda tu Recorrido');
        fireEvent.click(buttons[0]);
        await waitFor(() => expect(screen.getByTestId('lead-form')).toBeInTheDocument());

        fireEvent.click(screen.getByText('Cerrar'));
        await waitFor(() => expect(screen.queryByTestId('lead-form')).not.toBeInTheDocument());
    });

    it('dispara loginWithGoogle si el usuario es anónimo y presiona el botón Agendar', async () => {
        useUser.mockReturnValue({ user: null, loginWithGoogle: mockLoginWithGoogle });
        useStickyPanel.mockReturnValue(true); // Muestra la barra inferior

        render(<ModelDetailsContent modelo={mockModelo} />);

        fireEvent.click(screen.getByText('FAB Cotizar'));

        await waitFor(() => {
            expect(mockLoginWithGoogle).toHaveBeenCalledTimes(1);
        });
    });

    it('abre LeadCaptureForm directamente si el usuario ya está autenticado', async () => {
        useUser.mockReturnValue({ user: { uid: '123' }, loginWithGoogle: mockLoginWithGoogle });
        useStickyPanel.mockReturnValue(true); // Muestra el FAB

        render(<ModelDetailsContent modelo={mockModelo} />);

        fireEvent.click(screen.getByText('FAB Cotizar'));

        await waitFor(() => {
            expect(mockLoginWithGoogle).not.toHaveBeenCalled();
            expect(screen.getByTestId('lead-form')).toBeInTheDocument();
        });
    });

    it('no renderiza nada si modelo es null', () => {
        useUser.mockReturnValue({ user: null, loginWithGoogle: mockLoginWithGoogle });
        const { container } = render(<ModelDetailsContent modelo={null} />);
        expect(container).toBeEmptyDOMElement();
    });
});
