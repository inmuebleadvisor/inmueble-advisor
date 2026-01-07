import posthog from '../config/posthog';
import { useCallback } from 'react';

/**
 * Service Layer hook for User Analytics.
 * Abstracts the underlying analytics provider (PostHog) to ensure loose coupling.
 * 
 * @returns {Object} Analytics methods
 */
export const useAnalytics = () => {

    /**
     * Identifies a user in the analytics platform.
     * Should be called after login or when user details are updated.
     * 
     * @param {Object} user - The user object
     * @param {string} user.uid - Unique user identifier
     * @param {string} [user.email] - User email
     * @param {string} [user.displayName] - User name
     */
    const identifyUser = useCallback((user) => {
        if (!user || !user.uid) return;

        posthog.identify(user.uid, {
            email: user.email,
            name: user.displayName,
        });
    }, []);

    /**
     * Tracks a custom event in the analytics platform.
     * 
     * @param {string} eventName - The name of the event (e.g., 'lead_created', 'viewed_property')
     * @param {Object} [properties] - Additional metadata for the event
     */
    const trackEvent = useCallback((eventName, properties = {}) => {
        posthog.capture(eventName, properties);
    }, []);

    /**
     * Resets the analytics session.
     * Should be called on logout.
     */
    const resetAnalytics = useCallback(() => {
        posthog.reset();
    }, []);

    return {
        identifyUser,
        trackEvent,
        resetAnalytics
    };
};
