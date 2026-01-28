
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModelDetailsContent from './ModelDetailsContent';
import { useUser } from '../../context/UserContext';
import { useStickyPanel } from '../../hooks/useStickyPanel';

// Mocks
vi.mock('../../context/UserContext');
vi.mock('../../hooks/useStickyPanel');
vi.mock('../leads/LeadCaptureForm', () => ({
    default: ({ onCancel }) => <div data-testid="lead-form">Lead Form <button onClick={onCancel}>Close</button></div>
}));
vi.mock('./Carousel', () => ({ default: () => <div data-testid="carousel" /> }));
vi.mock('../common/CaracteristicasBox', () => ({ default: () => <div /> }));
vi.mock('./AmenidadesList', () => ({ default: () => <div /> }));
vi.mock('./FinanciamientoWidget', () => ({ default: () => <div /> }));
vi.mock('./DevelopmentInfoSection', () => ({ default: () => <div /> }));
vi.mock('../common/FavoriteBtn', () => ({ default: () => <div /> }));
vi.mock('../layout/StickyActionPanel', () => ({
    default: ({ onMainAction }) => <button onClick={onMainAction}>Sticky Button</button>
}));

describe('ModelDetailsContent Auth Triggers', () => {
    const mockLoginWithGoogle = vi.fn();
    const mockModelo = {
        id: 'modelo-1',
        nombre_modelo: 'Modelo Test',
        precioNumerico: 1500000,
        imagenes: []
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useStickyPanel.mockReturnValue(false);
    });

    it('triggers login if anonymous user clicks "Cotizar / Agendar"', async () => {
        useUser.mockReturnValue({
            user: null,
            loginWithGoogle: mockLoginWithGoogle
        });

        render(<ModelDetailsContent modelo={mockModelo} />);

        const agendarBtn = screen.getByText(/Cotizar \/ Agendar/i);
        fireEvent.click(agendarBtn);

        expect(mockLoginWithGoogle).toHaveBeenCalledTimes(1);
    });

    it('opens form directly if user is already logged in', async () => {
        useUser.mockReturnValue({
            user: { uid: '123' },
            loginWithGoogle: mockLoginWithGoogle
        });

        render(<ModelDetailsContent modelo={mockModelo} />);

        const agendarBtn = screen.getByText(/Cotizar \/ Agendar/i);
        fireEvent.click(agendarBtn);

        expect(mockLoginWithGoogle).not.toHaveBeenCalled();
        expect(screen.getByTestId('lead-form')).toBeInTheDocument();
    });

    it('opens form after successful login', async () => {
        useUser.mockReturnValue({
            user: null,
            loginWithGoogle: mockLoginWithGoogle.mockResolvedValue({ uid: 'new-user' })
        });

        const { rerender } = render(<ModelDetailsContent modelo={mockModelo} />);

        const agendarBtn = screen.getByText(/Cotizar \/ Agendar/i);
        fireEvent.click(agendarBtn);

        await waitFor(() => {
            expect(mockLoginWithGoogle).toHaveBeenCalled();
        });

        // Simular que el usuario ahora existe tras el login exitoso
        useUser.mockReturnValue({
            user: { uid: 'new-user' },
            loginWithGoogle: mockLoginWithGoogle
        });
        rerender(<ModelDetailsContent modelo={mockModelo} />);

        // El estado local isLeadFormOpen ya debería ser true en el componente real
        // pero en el test verificamos que el renderizado condicional funcione
        expect(screen.getByTestId('lead-form')).toBeInTheDocument();
    });
});
