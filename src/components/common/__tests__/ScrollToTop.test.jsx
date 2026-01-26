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

// Componente helper para simular cambio de ruta
const RouteChanger = ({ to }) => {
    const location = useLocation();
    // No hacemos nada, solo necesitamos el hook para que MemoryRouter funcione
    // y podamos simular clicks o cambios si fuera necesario, 
    // pero para este test bastará con renderizar con initialEntries o cambiar props
    return null;
};

describe('ScrollToTop', () => {
    beforeEach(() => {
        scrollToMock.mockClear();
    });

    it('debe scrollear al inicio (0, 0) cuando se monta con una ruta', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <ScrollToTop />
            </MemoryRouter>
        );

        expect(scrollToMock).toHaveBeenCalledWith(0, 0);
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

        expect(scrollToMock).toHaveBeenCalledTimes(1);

        // Simular navegación presionado el botón
        fireEvent.click(screen.getByText('Ir a nueva pagina'));

        // Esperar a que el efecto se ejecute (aunque es síncrono en mock DOM, a veces React batching afecta)
        await waitFor(() => {
            expect(scrollToMock).toHaveBeenCalledTimes(2);
        });

        expect(scrollToMock).toHaveBeenLastCalledWith(0, 0);
    });
});
