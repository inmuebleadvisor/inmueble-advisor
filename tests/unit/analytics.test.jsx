import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAnalytics } from '../../src/hooks/useAnalytics';
import posthog from '../../src/config/posthog';

// Mock posthog module
vi.mock('../../src/config/posthog', () => ({
    default: {
        identify: vi.fn(),
        capture: vi.fn(),
        reset: vi.fn()
    }
}));

describe('useAnalytics Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should identify user correctly', () => {
        const { result } = renderHook(() => useAnalytics());

        const user = { uid: '123', email: 'test@example.com', displayName: 'Test User' };
        result.current.identifyUser(user);

        expect(posthog.identify).toHaveBeenCalledWith('123', {
            email: 'test@example.com',
            name: 'Test User'
        });
    });

    it('should not identify if no uid', () => {
        const { result } = renderHook(() => useAnalytics());

        result.current.identifyUser({});
        expect(posthog.identify).not.toHaveBeenCalled();
    });

    it('should track events correctly', () => {
        const { result } = renderHook(() => useAnalytics());

        result.current.trackEvent('test_event', { prop: 'value' });

        expect(posthog.capture).toHaveBeenCalledWith('test_event', { prop: 'value' });
    });
});
