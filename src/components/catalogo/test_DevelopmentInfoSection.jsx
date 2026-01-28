
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DevelopmentInfoSection from './DevelopmentInfoSection';
import { useUser } from '../../context/UserContext';

// Mocks
vi.mock('../../context/UserContext');
vi.mock('../modals/MapModal', () => ({ default: () => <div /> }));
vi.mock('./AmenidadesList', () => ({ default: () => <div /> }));

// Mock window.open
const originalOpen = window.open;
beforeAll(() => {
    window.open = vi.fn();
});
afterAll(() => {
    window.open = originalOpen;
});

describe('DevelopmentInfoSection Brochure Auth', () => {
    const mockLoginWithGoogle = vi.fn();
    const mockDesarrollo = {
        nombre: 'Desarrollo Test',
        multimedia: {
            brochure: 'https://example.com/brochure.pdf'
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('triggers login if anonymous user clicks "Descargar Brochure"', async () => {
        useUser.mockReturnValue({
            user: null,
            loginWithGoogle: mockLoginWithGoogle
        });

        render(<DevelopmentInfoSection desarrollo={mockDesarrollo} />);

        const brochureBtn = screen.getByText(/Descargar Brochure/i);
        fireEvent.click(brochureBtn);

        expect(mockLoginWithGoogle).toHaveBeenCalledTimes(1);
        expect(window.open).not.toHaveBeenCalled();
    });

    it('opens brochure if user is logged in', async () => {
        useUser.mockReturnValue({
            user: { uid: '123' },
            loginWithGoogle: mockLoginWithGoogle
        });

        render(<DevelopmentInfoSection desarrollo={mockDesarrollo} />);

        const brochureBtn = screen.getByText(/Descargar Brochure/i);
        fireEvent.click(brochureBtn);

        expect(mockLoginWithGoogle).not.toHaveBeenCalled();
        expect(window.open).toHaveBeenCalledWith('https://example.com/brochure.pdf', '_blank');
    });
});
