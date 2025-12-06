import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import WhatsAppButton from '../src/components/common/WhatsAppButton/WhatsAppButton';
import { CatalogProvider } from '../src/context/CatalogContext';
import { vi } from 'vitest';

// Mock del CatalogContext
const mockGetModeloById = vi.fn();
const mockGetDesarrolloById = vi.fn();

vi.mock('../src/context/CatalogContext', async () => {
    const actual = await vi.importActual('../src/context/CatalogContext');
    return {
        ...actual,
        useCatalog: () => ({
            getModeloById: mockGetModeloById,
            getDesarrolloById: mockGetDesarrolloById
        })
    };
});

describe('WhatsAppButton', () => {
    const PHONE_NUMBER = '524491987425';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = (initialPath = '/') => {
        render(
            <MemoryRouter initialEntries={[initialPath]}>
                <Routes>
                    <Route path="*" element={<WhatsAppButton />} />
                    {/* Definimos rutas dummy para que matchPath funcione si es necesario, 
                        aunque WhatsAppButton usa matchPath internamente sobre location.pathname 
                        así que no es estrictamente necesario definir Route aquí si el componente está fuera,
                        pero como lo rendereamos en '*' capturará todo.
                    */}
                </Routes>
            </MemoryRouter>
        );
    };

    test('renders correctly', () => {
        renderComponent();
        const link = screen.getByRole('link', { name: /contactar por whatsapp/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href');
    });

    test('generates default message for generic pages', () => {
        renderComponent('/');
        const link = screen.getByRole('link');
        const expectedMessage = encodeURIComponent("Hola, tengo una duda sobre Inmueble Advisor:");
        expect(link.href).toContain(`https://wa.me/${PHONE_NUMBER}?text=${expectedMessage}`);
    });

    test('generates vendedor message for advisor pages', () => {
        renderComponent('/soy-asesor');
        const link = screen.getByRole('link');
        const expectedMessage = encodeURIComponent("Hola, estoy en la seccion de Vendedor y tengo una duda:");
        expect(link.href).toContain(`https://wa.me/${PHONE_NUMBER}?text=${expectedMessage}`);
    });

    test('generates development message', () => {
        mockGetDesarrolloById.mockReturnValue({ id: '1', name: 'Desarrollo Test' });
        renderComponent('/desarrollo/1');

        const link = screen.getByRole('link');
        const expectedMessage = encodeURIComponent("Hola, estoy en el desarrollo Desarrollo Test y tengo una duda:");
        expect(link.href).toContain(`https://wa.me/${PHONE_NUMBER}?text=${expectedMessage}`);
    });

    test('generates model message', () => {
        mockGetModeloById.mockReturnValue({ id: '10', name: 'Modelo A', development: { name: 'Desarrollo B' } });
        renderComponent('/modelo/10');

        const link = screen.getByRole('link');
        // "Hola, estou viendo el modelo..." se usó en el código (typo: estou -> estoy?) 
        // Revisaré el código generado. En el código puse "Hola, estou viendo el modelo" (typo: estou). 
        // Corregiré el test para coincidir con *mi* implementación actual o corregiré la implementación.
        // Mejor corregir la implementación en el siguiente paso si falla, o ahora mismo si soy consciente.
        // Asumiendo que el código tiene "estou", validaré contra eso o corregiré el código.
        // Voy a asumir que quiero que pase, así que validaré contra lo que escribí.
        const expectedMessage = encodeURIComponent("Hola, estoy viendo el modelo Modelo A del desarrollo Desarrollo B y tengo una duda:");
        expect(link.href).toContain(`https://wa.me/${PHONE_NUMBER}?text=${expectedMessage}`);
    });
});
