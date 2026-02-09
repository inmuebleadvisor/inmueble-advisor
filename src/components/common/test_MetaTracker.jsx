import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import MetaTracker from './MetaTracker';
import { useService } from '../../hooks/useService';
import { useUser } from '../../context/UserContext';
import { getAuth } from 'firebase/auth';

// Mock Dependencies
vi.mock('../../hooks/useService');
vi.mock('../../context/UserContext');
vi.mock('firebase/auth');
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useLocation: vi.fn(),
    };
});

import { useLocation as useLocationMock } from 'react-router-dom';

describe('MetaTracker Component', () => {
    let mockMetaService;
    let mockUserContext;

    afterEach(() => {
        delete window.fbq;
    });

    beforeEach(() => {
        vi.clearAllMocks();
        window.fbq = vi.fn();

        mockMetaService = {
            initialized: false,
            init: vi.fn(),
            generateEventId: vi.fn(() => 'test-event-id'),
            prepareUserData: vi.fn(() => ({ em: 'test@example.com' })),
            setUserData: vi.fn(),
            track: vi.fn(),
            trackPageViewCAPI: vi.fn().mockResolvedValue({}),
            getFbp: vi.fn(() => 'fbp-123'),
            getFbc: vi.fn(() => 'fbc-123'),
        };

        mockUserContext = {
            user: { uid: 'user-123', email: 'user@example.com' },
            userProfile: { nombre: 'Test', apellido: 'User', email: 'profile@example.com' },
        };

        useService.mockReturnValue({ meta: mockMetaService });
        useUser.mockReturnValue(mockUserContext);
        getAuth.mockReturnValue({ currentUser: mockUserContext.user });

        vi.mocked(useLocationMock).mockReturnValue({ pathname: '/catalog', key: 'key-1' });
    });

    it('should initialize the pixel if not initialized', async () => {
        render(
            <MemoryRouter>
                <MetaTracker />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(mockMetaService.init).toHaveBeenCalled();
        }, { timeout: 3000 });
    });

    it('should track PageView on route change', async () => {
        render(
            <MemoryRouter>
                <MetaTracker />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(mockMetaService.track).toHaveBeenCalledWith('PageView', {}, 'test-event-id');
            expect(mockMetaService.trackPageViewCAPI).toHaveBeenCalledWith('test-event-id', { em: 'test@example.com' });
        }, { timeout: 3000 });
    });

    it('should skip PageView on ViewContent routes', async () => {
        vi.mocked(useLocationMock).mockReturnValue({ pathname: '/desarrollo/some-id', key: 'key-2' });

        render(
            <MemoryRouter>
                <MetaTracker />
            </MemoryRouter>
        );

        // Should not track PageView because it's a ViewContent route
        // We wait a bit to be sure it didn't fire
        await new Promise(r => setTimeout(r, 1000));

        expect(mockMetaService.track).not.toHaveBeenCalledWith('PageView', expect.anything(), expect.anything());
    });

    it('should enrich with user data when available', async () => {
        render(
            <MemoryRouter>
                <MetaTracker />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(mockMetaService.prepareUserData).toHaveBeenCalledWith(
                mockUserContext.user,
                mockUserContext.userProfile
            );
            expect(mockMetaService.setUserData).toHaveBeenCalledWith({ em: 'test@example.com' });
        }, { timeout: 3000 });
    });
});
