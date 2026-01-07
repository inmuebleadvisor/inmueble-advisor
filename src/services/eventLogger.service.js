import { AnalyticEventsRepository } from "../repositories/analyticEvents.repository";
import { db } from "../firebase/config";

// Singleton instance
let repository = null;
let currentSessionId = null;
let sessionStartTime = null;

const getRepository = () => {
    if (!repository) {
        repository = new AnalyticEventsRepository(db);
    }
    return repository;
};

export const AnalyticsService = {
    /**
     * Initializes a tracking session.
     * Should be called on App mount.
     */
    startSession: async (user, initialPath) => {
        try {
            const repo = getRepository();
            const sessionData = {
                uid: user?.uid || 'ANONYMOUS',
                path: initialPath,
                userAgent: navigator.userAgent,
                deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
            };

            currentSessionId = await repo.startSession(sessionData);
            sessionStartTime = Date.now();

            // Persist in sessionStorage to survive refreshes (optional)
            sessionStorage.setItem('analytics_session_id', currentSessionId);

            console.log(`📊 [Analytics] Session started: ${currentSessionId}`);
            return currentSessionId;
        } catch (error) {
            console.error("❌ [Analytics] Failed to start session", error);
        }
    },

    /**
     * Tracks navigation changes.
     */
    trackPageView: async (path) => {
        if (!currentSessionId) {
            // If lost (e.g. new tab), try recover or just ignore strictly to avoid noise
            const stored = sessionStorage.getItem('analytics_session_id');
            if (stored) currentSessionId = stored;
            else return; // Don't log page views without a session start
        }

        try {
            const repo = getRepository();
            await repo.logPageView(currentSessionId, path);
            console.log(`📊 [Analytics] Page view: ${path}`);
        } catch (error) {
            console.warn("❌ [Analytics] Failed to log view", error);
        }
    },

    /**
     * Ends the session reliably.
     */
    endSession: async () => {
        if (!currentSessionId) return;

        const duration = sessionStartTime ? (Date.now() - sessionStartTime) / 1000 : 0;

        try {
            const repo = getRepository();
            // We use sendBeacon for reliability on page unload if supported, 
            // but here we use the repo for simplicity.
            // Note: Firestore logic might fail if page is closing *immediately*.
            // For 'unload', navigator.sendBeacon is better, but requires a cloud function URL.
            // We will stick to repo for SPA route changes or explicit logout.
            await repo.endSession(currentSessionId, duration);
            console.log(`📊 [Analytics] Session ended. Duration: ${duration}s`);

            sessionStorage.removeItem('analytics_session_id');
            currentSessionId = null;
        } catch (error) {
            console.error("❌ [Analytics] Failed to end session", error);
        }
    },

    /**
     * Identifying the user after login
     */
    identify: (user) => {
        // If we have an anonymous session, we could update it with the UID here
        // For now, simpler to just start a new session or relying on the next event
        if (currentSessionId) {
            // Ideally we update the session doc with the new UID
            // repo.updateSessionUser(currentSessionId, user.uid)
        }
    }
};
