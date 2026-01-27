import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminSidebar from '../../../../src/components/admin/AdminSidebar';
import { describe, it, expect, vi } from 'vitest';

describe('AdminSidebar Component', () => {
    const renderSidebar = (collapsed = false, toggleCollapse = vi.fn()) => {
        return render(
            <BrowserRouter>
                <AdminSidebar collapsed={collapsed} toggleCollapse={toggleCollapse} />
            </BrowserRouter>
        );
    };

    it('renders the brand title when not collapsed', () => {
        renderSidebar(false);
        expect(screen.getByText('Inmueble Advisor')).toBeInTheDocument();
    });

    it('renders the abbreviated brand (IA) when collapsed', () => {
        renderSidebar(true);
        expect(screen.getByText('IA')).toBeInTheDocument();
    });

    it('renders all navigation links', () => {
        renderSidebar();
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Gestión de Leads')).toBeInTheDocument();
        expect(screen.getByText('Usuarios')).toBeInTheDocument();
        expect(screen.getByText('Gestión Asesores')).toBeInTheDocument();
    });

    it('calls toggleCollapse when toggle button is clicked', () => {
        const toggleMock = vi.fn();
        renderSidebar(false, toggleMock);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(toggleMock).toHaveBeenCalledTimes(1);
    });

    it('should show correct toggle text based on state', () => {
        const { rerender } = renderSidebar(false);
        expect(screen.getByText('<< Colapsar')).toBeInTheDocument();

        // Rerender collapsed
        render(
            <BrowserRouter>
                <AdminSidebar collapsed={true} toggleCollapse={() => { }} />
            </BrowserRouter>
        );
        expect(screen.getByText('→')).toBeInTheDocument();
    });
});
