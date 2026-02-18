import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import Home from '../../screens/cliente/Home';
import { ServiceProvider } from '../../context/ServiceContext';

// Mocks
vi.mock('../../services/catalog.service', () => ({
    CatalogService: class {
        obtenerInventarioDesarrollos = vi.fn().mockResolvedValue([]);
        obtenerDatosUnificados = vi.fn().mockResolvedValue([]);
    }
}));

describe('Home Screen', () => {
    it('renders Hero and Sections without crashing', () => {
        render(
            <BrowserRouter>
                <ServiceProvider>
                    <Home />
                </ServiceProvider>
            </BrowserRouter>
        );

        // Check for static text elements
        expect(screen.getByText(/Encuentra tu/i)).toBeInTheDocument();
        expect(screen.getByText(/Calculadora de Poder de Compra/i)).toBeInTheDocument();
    });
});
