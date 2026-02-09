import { describe, it, expect } from 'vitest';
import { getAvailableSlots, canSchedule } from '../../../src/services/appointment.service';

describe('AppointmentService', () => {
    describe('getAvailableSlots', () => {
        const mockNow = new Date('2026-02-10T10:00:00'); // Tuesday 10:00 AM

        it('should return empty array for past dates', () => {
            const pastDate = new Date('2026-02-09');
            const slots = getAvailableSlots(pastDate, mockNow);
            expect(slots).toEqual([]);
        });

        it('should mark slots before 2-hour buffer as unavailable', () => {
            const today = new Date('2026-02-10');
            const slots = getAvailableSlots(today, mockNow);

            // 10:00 AM + 2 hours = 12:00 PM
            const slot11am = slots.find(s => s.value === '11:00');
            const slot1pm = slots.find(s => s.value === '13:00');

            expect(slot11am.available).toBe(false);
            expect(slot1pm.available).toBe(true);
        });

        it('should respect business hours (7 AM to 9 PM)', () => {
            const tomorrow = new Date('2026-02-11');
            const slots = getAvailableSlots(tomorrow, mockNow);

            expect(slots[0].value).toBe('07:00');
            expect(slots[slots.length - 1].value).toBe('20:00'); // Last slot starts at 8 PM ends at 9 PM
        });
    });

    describe('canSchedule', () => {
        it('should return true if user exists', () => {
            expect(canSchedule({ uid: '123' })).toBe(true);
        });

        it('should return false if no user', () => {
            expect(canSchedule(null)).toBe(false);
        });
    });
});
