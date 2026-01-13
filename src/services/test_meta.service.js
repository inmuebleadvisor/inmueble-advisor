import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MetaService } from './meta.service';

describe('MetaService', () => {
    let metaService;

    beforeEach(() => {
        // Mock window and fbq on the existing JSDOM window object
        // We do NOT overwrite global.window because JSDOM sets it up.
        window.fbq = vi.fn();

        // Allow setting properties on the mock
        window.fbq.disablePushState = false;

        metaService = new MetaService();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        // Clean up the mock to avoid pollution
        delete window.fbq;
    });

    describe('init', () => {
        it('should properly initialize the pixel and disable pushState', () => {
            const pixelId = '1234567890';

            metaService.init(pixelId);

            // Verify disablePushState is set to true (CRITICAL FIX)
            expect(window.fbq.disablePushState).toBe(true);

            // Verify init call
            expect(window.fbq).toHaveBeenCalledWith('init', pixelId);

            // Verify initialized flag
            expect(metaService.initialized).toBe(true);
        });

        it('should warn if no pixel ID is provided', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            metaService.init(null);
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No Pixel ID provided'));
            expect(window.fbq).not.toHaveBeenCalled();
        });
    });

    describe('track', () => {
        it('should track an event with eventID', () => {
            const eventName = 'PageView';
            const data = { page_path: '/test' };
            const eventId = 'test-uuid-123';

            metaService.track(eventName, data, eventId);

            expect(window.fbq).toHaveBeenCalledWith(
                'track',
                eventName,
                data,
                { eventID: eventId }
            );
        });

        it('should warn if PageView is tracked without eventID', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

            metaService.track('PageView', {});

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Tracking PageView WITHOUT EventID'));
        });
    });

    describe('setUserData', () => {
        it('should call init with user data (Advanced Matching)', () => {
            // Setup internal state
            metaService.pixelId = '123';
            const userData = { em: 'hashed_email' };

            metaService.setUserData(userData);

            expect(window.fbq).toHaveBeenCalledWith('init', '123', userData);
        });
    });
});
