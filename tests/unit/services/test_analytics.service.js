import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsService } from '../../../src/services/analytics.service';

describe('AnalyticsService', () => {
    let analyticsService;
    let mockRepository;

    beforeEach(() => {
        vi.stubGlobal('localStorage', {
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn()
        });
        vi.stubGlobal('navigator', { userAgent: 'test-agent' });

        mockRepository = {
            startSession: vi.fn().mockResolvedValue('session-123'),
            logPageView: vi.fn(),
            logBusinessEvent: vi.fn(),
            endSession: vi.fn()
        };
        analyticsService = new AnalyticsService(mockRepository);
    });

    it('should start tracking and store session in localStorage', async () => {
        const userData = { uid: 'u1', path: '/' };
        await analyticsService.startTracking(userData);

        expect(mockRepository.startSession).toHaveBeenCalled();
        expect(localStorage.setItem).toHaveBeenCalledWith('analytics_session_id', 'session-123');
    });

    it('should track page views if session exists', async () => {
        analyticsService.currentSessionId = 'session-123';
        await analyticsService.trackPageView('/home');

        expect(mockRepository.logPageView).toHaveBeenCalledWith('session-123', '/home');
    });

    it('should track business events', async () => {
        analyticsService.currentSessionId = 'session-123';
        await analyticsService.trackEvent('LEAD_CREATED', { leadId: 'l1' });

        expect(mockRepository.logBusinessEvent).toHaveBeenCalledWith('LEAD_CREATED', {
            sessionId: 'session-123',
            leadId: 'l1'
        });
    });

    it('should clearing session on stopTracking', async () => {
        analyticsService.currentSessionId = 'session-123';
        await analyticsService.stopTracking();

        expect(mockRepository.endSession).toHaveBeenCalledWith('session-123');
        expect(localStorage.removeItem).toHaveBeenCalledWith('analytics_session_id');
        expect(analyticsService.currentSessionId).toBeNull();
    });
});
