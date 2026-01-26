/**
 * Service for handling User Analytics and Behavior Tracking.
 * Facades the AnalyticEventsRepository to manage session lifecycles.
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
   * @param {Object} userData - { uid, userAgent, path }
   */
  async startTracking(userData) {
    try {
      // If already has a session, we might want to close it or just continue.
      // For simplicity, we start a new one if not exists.
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