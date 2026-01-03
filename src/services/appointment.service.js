/**
 * @file appointment.service.js
 * @description Service to handle appointment scheduling business logic.
 * Decouples time slot calculation and rules from the UI.
 */

import {
    addDays,
    setHours,
    setMinutes,
    isBefore,
    addHours,
    startOfHour,
    format,
    isSameDay,
    isValid
} from 'date-fns';

/**
 * Configuration constants for business rules
 */
const CONFIG = {
    START_HOUR: 7, // 07:00 AM
    END_HOUR: 21,  // 09:00 PM
    SLOT_DURATION_MINUTES: 60,
    MIN_ADVANCE_HOURS: 2,
    MAX_DAYS_WINDOW: 15
};

/**
 * Generates available time slots for a specific date, applying business rules.
 * 
 * Rules:
 * 1. 07:00 AM - 09:00 PM (Last slot starts at 20:00 to end at 21:00)
 * 2. Must be at least 2 hours from now.
 * 3. Cannot book further than 15 days (handled primarily by UI maxDate, but validated here).
 * 
 * @param {Date} selectedDate - The date selected by the user
 * @param {Date} [now=new Date()] - Reference "now" time (for testing/validation)
 * @returns {Array<{time: string, available: boolean, date: Date}>} Array of slots
 */
export const getAvailableSlots = (selectedDate, now = new Date()) => {
    if (!isValid(selectedDate)) return [];

    const slots = [];
    const windowEnd = addDays(now, CONFIG.MAX_DAYS_WINDOW);

    // Validate if selected date is within the allowed global window
    if (isBefore(addDays(selectedDate, 1), now) || isBefore(windowEnd, selectedDate)) {
        return []; // Date out of range (past or too far future)
    }

    // Define start and end time for the selected day
    let currentSlot = setMinutes(setHours(selectedDate, CONFIG.START_HOUR), 0);
    const dayEnd = setMinutes(setHours(selectedDate, CONFIG.END_HOUR), 0);

    // Minimum allowed time is Now + 2 hours
    const minTime = addHours(now, CONFIG.MIN_ADVANCE_HOURS);

    while (isBefore(currentSlot, dayEnd)) {
        // A slot is available if:
        // 1. It is logically in the future (implicit in minTime check)
        // 2. It respects the 2-hour buffer rule

        let isAvailable = true;

        if (isBefore(currentSlot, minTime)) {
            isAvailable = false;
        }

        slots.push({
            label: format(currentSlot, 'h:mm a'), // e.g., "2:00 PM"
            value: format(currentSlot, 'HH:mm'),  // e.g., "14:00"
            date: new Date(currentSlot),
            available: isAvailable
        });

        // Increment by 1 hour
        currentSlot = addHours(currentSlot, 1);
    }

    return slots;
};

/**
 * Checks if a user is allowed to schedule (Auth Guard helper)
 * @param {Object} currentUser 
 * @returns {boolean}
 */
export const canSchedule = (currentUser) => {
    return !!currentUser;
};

/**
 * Logic to get the maximum allowed date for scheduling
 * @returns {Date}
 */
export const getMaxScheduleDate = () => {
    return addDays(new Date(), CONFIG.MAX_DAYS_WINDOW);
};
