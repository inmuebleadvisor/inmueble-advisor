import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MetaService } from '../../src/services/meta.service';

describe('MetaService (Frontend)', () => {
    let service;

    beforeEach(() => {
        service = new MetaService();
        vi.stubGlobal('document', { cookie: '' });
        vi.stubGlobal('window', { fbq: vi.fn(), navigator: { userAgent: 'test-agent' } });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should initialize successfully', () => {
        service.init('12345');
        expect(window.fbq).toHaveBeenCalledWith('init', '12345');
        expect(window.fbq).toHaveBeenCalledWith('track', 'PageView');
    });

    it('should not re-initialize if already initialized', () => {
        service.init('12345');
        expect(window.fbq).toHaveBeenCalledTimes(2); // init + PageView

        service.init('12345');
        expect(window.fbq).toHaveBeenCalledTimes(2); // No extra calls
    });

    it('should track events with data and eventID', () => {
        const eventId = 'uuid-123';
        service.track('Contact', { foo: 'bar' }, eventId);
        expect(window.fbq).toHaveBeenCalledWith('track', 'Contact', {
            foo: 'bar',
            eventID: eventId
        });
    });

    it('should generate a valid UUID', () => {
        const id = service.generateEventId();
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(10);
    });

    it('should extract fbp cookie', () => {
        document.cookie = "_fbp=fb.1.123456789";
        expect(service.getFbp()).toBe("fb.1.123456789");
    });

    it('should extract fbc cookie', () => {
        document.cookie = "_fbc=fb.1.987654321";
        expect(service.getFbc()).toBe("fb.1.987654321");
    });

    it('should return null if cookie not found', () => {
        document.cookie = "other=cookie";
        expect(service.getFbp()).toBeNull();
    });
});
