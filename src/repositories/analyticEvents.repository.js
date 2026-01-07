import {
    collection,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc,
    increment,
    setDoc
} from 'firebase/firestore';

/**
 * Repository for storing Analytics Events.
 * This collection 'analytic_events' should be synced to BigQuery
 * to allow accurate determination of:
 * - Time on Site (Session Duration)
 * - Pages per Visit
 * - Active Users (with historical fidelity)
 */
export class AnalyticEventsRepository {
    constructor(db) {
        this.db = db;
        this.collectionName = 'analytic_events';
    }

    /**
     * Starts a new tracking session.
     * @param {Object} sessionData - { uid, userAgent, path, deviceType }
     * @returns {Promise<string>} sessionId
     */
    async startSession(sessionData) {
        // We look for a collection specifically for raw events
        const docRef = await addDoc(collection(this.db, this.collectionName), {
            type: 'SESSION_START',
            uid: sessionData.uid || 'ANONYMOUS',
            path: sessionData.path || '/',
            userAgent: sessionData.userAgent || '',
            deviceType: sessionData.deviceType || 'unknown',
            createdAt: serverTimestamp(),
            // Initial stats for this session doc (optional, if we want to aggregate in place)
            pageViews: 1,
            sessionDuration: 0,
            isClosed: false
        });
        return docRef.id;
    }

    /**
     * Logs a page view event linked to a session.
     * @param {string} sessionId 
     * @param {string} path 
     */
    async logPageView(sessionId, path) {
        if (!sessionId) return;

        // 1. Add a separate event doc for the page view (Granular history)
        await addDoc(collection(this.db, this.collectionName), {
            type: 'PAGE_VIEW',
            sessionId: sessionId,
            path: path,
            createdAt: serverTimestamp()
        });

        // 2. Update the parent session doc (Fast aggregation)
        // This allows us to query "Average Pages per Visit" directly from the session docs
        // without expensive joins in BigQuery if we don't want to.
        const sessionRef = doc(this.db, this.collectionName, sessionId);
        await updateDoc(sessionRef, {
            pageViews: increment(1),
            lastActiveAt: serverTimestamp(),
            lastPath: path
        }).catch(err => console.warn("Failed to update session counter", err));
    }

    /**
     * Ends a session, calculating final duration if start time is available.
     * @param {string} sessionId 
     * @param {number} durationSeconds - Optional client-side calculated duration
     */
    async endSession(sessionId, durationSeconds = 0) {
        if (!sessionId) return;
        const sessionRef = doc(this.db, this.collectionName, sessionId);

        await updateDoc(sessionRef, {
            type: 'SESSION_END', // Mark the doc as a completed session record
            isClosed: true,
            endedAt: serverTimestamp(),
            durationSeconds: durationSeconds
        }).catch(err => console.warn("Failed to close session", err));
    }

    /**
     * Logs a critical business event (Lead Assigned, Sale, etc)
     * These are 'hard data' points for the Dashboard.
     */
    async logBusinessEvent(eventName, metadata = {}) {
        await addDoc(collection(this.db, this.collectionName), {
            type: 'BUSINESS_EVENT',
            subtype: eventName,
            ...metadata,
            createdAt: serverTimestamp()
        });
    }
}
