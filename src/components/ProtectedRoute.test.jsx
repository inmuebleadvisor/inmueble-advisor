import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useUser } from '../context/UserContext';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock UserContext
vi.mock('../context/UserContext', () => ({
    useUser: vi.fn(),
}));

describe('ProtectedRoute', () => {
    const MockProtectedComponent = () => <div>Protected Content</div>;
    const MockPublicComponent = () => <div>Public Content</div>;
    const MockLoginComponent = () => <div>Login Page</div>;
    const MockOnboardingComponent = () => <div>Onboarding Page</div>;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderWithRouter = (ui, initialEntries = ['/protected']) => {
        return render(
            <MemoryRouter initialEntries={initialEntries}>
                <Routes>
                    <Route path="/" element={<MockLoginComponent />} />
                    <Route path="/onboarding-asesor" element={<MockOnboardingComponent />} />
                    <Route path="/protected" element={ui} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('shows loading state when loadingUser is true', () => {
        useUser.mockReturnValue({
            user: null,
            userProfile: null,
            loadingUser: true,
        });

        renderWithRouter(<ProtectedRoute><MockProtectedComponent /></ProtectedRoute>);
        expect(screen.getByText('Cargando sesión...')).toBeInTheDocument();
    });

    it('redirects to / when no user is logged in', () => {
        useUser.mockReturnValue({
            user: null,
            userProfile: null,
            loadingUser: false,
        });

        renderWithRouter(<ProtectedRoute><MockProtectedComponent /></ProtectedRoute>);
        expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('renders children when user is logged in and no special requirements', () => {
        useUser.mockReturnValue({
            user: { uid: '123' },
            userProfile: { role: 'cliente' },
            loadingUser: false,
        });

        renderWithRouter(<ProtectedRoute><MockProtectedComponent /></ProtectedRoute>);
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('redirects to / when requireAdmin is true and user is not admin', () => {
        useUser.mockReturnValue({
            user: { uid: '123' },
            userProfile: { role: 'asesor' },
            loadingUser: false,
        });

        renderWithRouter(<ProtectedRoute requireAdmin={true}><MockProtectedComponent /></ProtectedRoute>);
        expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('renders children when requireAdmin is true and user is admin', () => {
        useUser.mockReturnValue({
            user: { uid: 'admin123' },
            userProfile: { role: 'admin' },
            loadingUser: false,
        });

        renderWithRouter(<ProtectedRoute requireAdmin={true}><MockProtectedComponent /></ProtectedRoute>);
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('redirects to /onboarding-asesor when requireOnboarding is true, user is asesor, and onboarding is incomplete', () => {
        useUser.mockReturnValue({
            user: { uid: 'asesor123' },
            userProfile: { role: 'asesor', onboardingCompleto: false },
            loadingUser: false,
        });

        renderWithRouter(<ProtectedRoute requireOnboarding={true}><MockProtectedComponent /></ProtectedRoute>);
        expect(screen.getByText('Onboarding Page')).toBeInTheDocument();
    });

    it('permits access (skips onboarding check) when user is admin even if requireOnboarding is true', () => {
        useUser.mockReturnValue({
            user: { uid: 'admin123' },
            userProfile: { role: 'admin', onboardingCompleto: false }, // Admins might not have this flag
            loadingUser: false,
        });

        renderWithRouter(<ProtectedRoute requireOnboarding={true}><MockProtectedComponent /></ProtectedRoute>);
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
});
