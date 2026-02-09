
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LeadCaptureForm from './LeadCaptureForm';
import { useUser } from '../../context/UserContext';
import { useService } from '../../hooks/useService';

// Mocks
vi.mock('../../context/UserContext');
vi.mock('../../hooks/useService');
vi.mock('../../components/common/AppointmentScheduler', () => {
    return {
        default: ({ onSelect }) => (
            <button onClick={() => onSelect({ dia: new Date(), hora: '10:00 AM' })} data-testid="scheduler-select">
                Select Date
            </button>
        )
    };
});
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

describe('LeadCaptureForm', () => {
    const mockLoginWithGoogle = vi.fn();
    const mockGenerarLeadAutomatico = vi.fn();
    const mockCheckActiveAppointment = vi.fn();

    beforeEach(() => {
        useUser.mockReturnValue({
            user: { uid: 'test-user-uid', displayName: 'Test User', email: 'test@example.com' },
            userProfile: { nombre: 'Test User Profile', email: 'test@example.com', telefono: '5555555555' },
            loginWithGoogle: mockLoginWithGoogle,
        });

        useService.mockReturnValue({
            leadAssignment: {
                generarLeadAutomatico: mockGenerarLeadAutomatico,
                checkActiveAppointment: mockCheckActiveAppointment,
            },
        });

        mockGenerarLeadAutomatico.mockResolvedValue({ success: true });
        mockCheckActiveAppointment.mockResolvedValue({ hasAppointment: false });
        vi.clearAllMocks();
    });

    it('submits the form and calls leadAssignment.generarLeadAutomatico', async () => {
        const mockDesarrollo = { id: 'dev-1', nombre: 'Desarrollo Test', idDesarrollador: 'dev-owner-1' };
        const mockModelo = { nombre_modelo: 'Modelo A', precio: 1000000 };

        render(
            <LeadCaptureForm
                desarrollo={mockDesarrollo}
                modelo={mockModelo}
                onSuccess={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        // Step 1: Select Date
        fireEvent.click(screen.getByTestId('scheduler-select'));

        // Check if next button is enabled
        const nextButton = screen.getByText(/Continuar/i);
        expect(nextButton).toBeEnabled();
        fireEvent.click(nextButton);

        // Step 2: Confirm Info
        // Check if form is preloaded
        expect(screen.getByDisplayValue('Test User Profile')).toBeInTheDocument();

        // Submit
        const submitButton = screen.getByText(/Confirmar Visita/i);
        fireEvent.click(submitButton);

        // Assert Service Call
        await waitFor(() => {
            expect(mockGenerarLeadAutomatico).toHaveBeenCalledTimes(1);
        });

        expect(mockGenerarLeadAutomatico).toHaveBeenCalledWith(
            expect.objectContaining({
                nombre: 'Test User Profile',
                email: 'test@example.com',
                telefono: '5555555555'
            }),
            'dev-1',
            'Desarrollo Test',
            'Modelo A',
            'test-user-uid',
            'dev-owner-1',
            1000000,
            expect.objectContaining({
                origen: 'web_cita_vip',
                citainicial: expect.any(Object)
            })
        );
    });

    it('handles error when service fails', async () => {
        mockGenerarLeadAutomatico.mockResolvedValue({ success: false, error: 'Simulated Error' });

        render(
            <LeadCaptureForm
                desarrollo={{}}
                modelo={{}}
                onSuccess={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        // Step 1: Select Date
        fireEvent.click(screen.getByTestId('scheduler-select'));
        fireEvent.click(screen.getByText(/Continuar/i));

        // Step 2: Submit
        fireEvent.click(screen.getByText(/Confirmar Visita/i));

        await waitFor(() => {
            expect(screen.getByText(/Hubo un error al agendar/i)).toBeInTheDocument();
        });
    });
});
