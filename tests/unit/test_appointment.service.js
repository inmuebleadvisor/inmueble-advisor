import { describe, it, expect } from 'vitest';
import { getAvailableSlots, getMaxScheduleDate } from '../../src/services/appointment.service';
import { addHours, subHours, setHours, addDays, startOfDay } from 'date-fns';

describe('Appointment Service - getAvailableSlots', () => {

    it('should generate slots between 7 AM and 9 PM', () => {
        // Use a future date to avoid "Now + 2h" conflicts for this basic test
        const futureDate = addDays(new Date(), 2);
        const slots = getAvailableSlots(futureDate);

        expect(slots.length).toBeGreaterThan(0);
        expect(slots[0].label).toBe('7:00 AM');
        // Last slot should start at 20:00 (8 PM) to end at 9 PM
        expect(slots[slots.length - 1].label).toBe('8:00 PM');
    });

    it('should mark slots as unavailable if they are less than 2 hours from now', () => {
        const now = setHours(startOfDay(new Date()), 10); // 10:00 AM fixed
        const today = now;

        // Slots should be generated for today
        const slots = getAvailableSlots(today, now);

        // 10 AM + 2 hours = 12:00 PM.
        // Slots before 12:00 PM should be unavailable.

        const slot11AM = slots.find(s => s.label === '11:00 AM');
        const slot12PM = slots.find(s => s.label === '12:00 PM');

        if (slot11AM) expect(slot11AM.available).toBe(false);
        if (slot12PM) expect(slot12PM.available).toBe(true);
    });

    it('should return empty slots if date is in the past', () => {
        const pastDate = subHours(new Date(), 25);
        const slots = getAvailableSlots(pastDate);
        // Depending on implementation, it might return slots but all unavailable, or empty.
        // My implementation returns empty if validation fails or effectively all filtered? 
        // Actually my impl: if (isBefore(addDays(selectedDate, 1), now)) return []
        // So yesterday should return empty.
        expect(slots).toEqual([]);
    });

    it('should respect the 15-day window', () => {
        const maxDate = getMaxScheduleDate();
        const futureDate = addDays(maxDate, 2);

        const slots = getAvailableSlots(futureDate);
        expect(slots).toEqual([]);
    });
});
