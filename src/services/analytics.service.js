import posthog from '../config/posthog';

/**
 * Service for handling User Analytics and Behavior Tracking.
 * Facades the AnalyticEventsRepository to manage session lifecycles.
 * 
 * ✅ UPDATED 2026-01-27: Now Dual-Writes to Firestore + PostHog
 */
export class AnalyticsService {
  /**
   * @param {import('../repositories/analyticEvents.repository').AnalyticEventsRepository} analyticEventsRepository 
   */
  constructor(analyticEventsRepository) {
    this.repository = analyticEventsRepository;
    this.currentSessionId = localStorage.getItem('analytics_session_id') || null;
  }

  /**
   * Starts a new analytics session.
   * @param {Object} userData - { uid, userAgent, path, email, displayName }
   */
  async startTracking(userData) {
    try {
      // 1. PostHog Identification (Visual Memory)
      if (userData.uid !== 'ANONYMOUS' && userData.uid) {
        posthog.identify(userData.uid, {
          email: userData.email,
          name: userData.displayName
        });
      }

      // 2. Firestore Session (Transactional Memory)
      if (!this.currentSessionId) {
        const sessionId = await this.repository.startSession({
          ...userData,
          deviceType: this._getDeviceType()
        });
        this.currentSessionId = sessionId;
        localStorage.setItem('analytics_session_id', sessionId);
      }
    } catch (error) {
      console.error("Failed to start analytics tracking:", error);
    }
  }

  /**
   * Logs a page view.
   * @param {string} path 
   */
  async trackPageView(path) {
    // 1. PostHog PageView
    // PostHog handles this automatically if capture_pageview is on, 
    // but Single Page Apps (SPAs) usually require manual triggers on route change.
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      path: path
    });

    // 2. Firestore PageView
    if (!this.currentSessionId) return;
    try {
      await this.repository.logPageView(this.currentSessionId, path);
    } catch (error) {
      console.warn("Failed to track page view:", error);
    }
  }

  /**
   * Track a specific business event.
   * @param {string} eventName 
   * @param {Object} metadata 
   */
  async trackEvent(eventName, metadata = {}) {
    // 1. PostHog Event
    posthog.capture(eventName, metadata);

    // 2. Firestore Event
    try {
      await this.repository.logBusinessEvent(eventName, {
        sessionId: this.currentSessionId,
        ...metadata
      });
    } catch (error) {
      console.warn(`Failed to track event ${eventName}:`, error);
    }
  }

  /**
   * Clears session (on logout).
   */
  async stopTracking() {
    // 1. PostHog Reset
    posthog.reset();

    // 2. Firestore End Session
    if (this.currentSessionId) {
      await this.repository.endSession(this.currentSessionId);
      this.currentSessionId = null;
      localStorage.removeItem('analytics_session_id');
    }
  }

  _getDeviceType() {
    if (/Mobi|Android/i.test(navigator.userAgent)) return 'mobile';
    return 'desktop';
  }
}