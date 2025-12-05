// src/screens/test_Perfil.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Perfil from './Perfil';
import { UserContext } from '../context/UserContext';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('Perfil Screen', () => {
    const mockTrackBehavior = vi.fn();
    const mockLoginWithGoogle = vi.fn();

    const renderComponent = () => {
        return render(
            <UserContext.Provider value={{
                loginWithGoogle: mockLoginWithGoogle,
                trackBehavior: mockTrackBehavior,
                user: null
            }}>
                <MemoryRouter>
                    <Perfil />
                </MemoryRouter>
            </UserContext.Provider>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        renderComponent();
        expect(screen.getByText('Bienvenido')).toBeInTheDocument();
        expect(screen.getByText('Busco mi Hogar')).toBeInTheDocument();
        expect(screen.getByText('Soy Asesor')).toBeInTheDocument();
    });

    it('navigates to /onboarding-cliente when "Busco mi Hogar" is clicked', () => {
        renderComponent();
        fireEvent.click(screen.getByText('Busco mi Hogar'));

        expect(mockTrackBehavior).toHaveBeenCalledWith('select_role', { role: 'comprador' });
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding-cliente');
    });

    it('navigates to /soy-asesor when "Soy Asesor" is clicked', () => {
        renderComponent();
        fireEvent.click(screen.getByText('Soy Asesor'));

        expect(mockTrackBehavior).toHaveBeenCalledWith('select_role', { role: 'asesor' });
        expect(mockNavigate).toHaveBeenCalledWith('/soy-asesor');
    });
});
