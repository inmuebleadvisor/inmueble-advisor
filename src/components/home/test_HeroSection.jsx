import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import HeroSection from './HeroSection';

const mockedUsedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockedUsedNavigate,
    };
});

describe('HeroSection Component', () => {
    it('renders title, search bar placeholder and filter buttons', () => {
        render(
            <BrowserRouter>
                <HeroSection />
            </BrowserRouter>
        );

        // Check text highlights
        expect(screen.getAllByText(/Encuentra tu/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/Sueño/i)).toBeInTheDocument();
        expect(screen.getByText(/Hogar/i)).toBeInTheDocument();

        // Ensure filters render
        expect(screen.getByRole('button', { name: /Lista/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Mapa/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Casas/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Deptos/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Preventa/i })).toBeInTheDocument();
    });

    it('navigates to catalog with proper state when clicking a filter', () => {
        render(
            <BrowserRouter>
                <HeroSection />
            </BrowserRouter>
        );

        const gridButton = screen.getByRole('button', { name: /Lista/i });
        fireEvent.click(gridButton);

        expect(mockedUsedNavigate).toHaveBeenCalledWith('/catalogo', { state: { viewMode: 'grid' } });
    });
});
