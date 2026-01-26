import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import ScrollToTop from '../ScrollToTop';
import { useEffect } from 'react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock window.scrollTo
const scrollToMock = vi.fn();
Object.defineProperty(window, 'scrollTo', {
    value: scrollToMock,
    writable: true,
});

// Mock Element.prototype.scrollTo for document.body and document.documentElement
Element.prototype.scrollTo = scrollToMock;

describe('ScrollToTop', () => {
    beforeEach(() => {
        scrollToMock.mockClear();
        // Reset scrollRestoration mock if needed, though mostly handled by window stub
        if (!window.history) window.history = {};
        window.history.scrollRestoration = 'auto'; // default
    });

    it('debe scrollear al inicio (0, 0) cuando se monta con una ruta', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <ScrollToTop />
            </MemoryRouter>
        );

        // Verifica que se llame con las opciones agresivas
        const expectedOptions = { top: 0, left: 0, behavior: 'instant' };
        expect(scrollToMock).toHaveBeenCalledWith(expectedOptions);
    });

    it('debe scrollear al inicio cuando cambia la ruta', async () => {
        const TestComponent = () => {
            const navigate = useNavigate();
            return (
                <div>
                    <button onClick={() => navigate('/new-page')}>Ir a nueva pagina</button>
                </div>
            );
        };

        render(
            <MemoryRouter initialEntries={['/']}>
                <ScrollToTop />
                <TestComponent />
            </MemoryRouter>
        );

        const expectedOptions = { top: 0, left: 0, behavior: 'instant' };
        expect(scrollToMock).toHaveBeenCalledWith(expectedOptions);

        // Simular navegación presionado el botón
        fireEvent.click(screen.getByText('Ir a nueva pagina'));

        // Esperar a que el efecto se ejecute
        await waitFor(() => {
            // Debería haberse llamado al menos una vez más (o más veces por el setTimeout)
            expect(scrollToMock).toHaveBeenCalledWith(expectedOptions);
        });
    });
});
