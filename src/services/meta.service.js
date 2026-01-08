/**
 * @file meta.service.js
 * @description Service to handle Meta Ads Pixel tracking and Event Deduplication.
 * Integrates with standard 'fbq' object.
 */


// Fallback UUID generator if uuid package not available (common in frontend unless added)
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export class MetaService {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initializes the Pixel
     * @param {string} pixelId 
     */
    init(pixelId) {
        if (!pixelId) {
            console.warn("⚠️ [MetaService] No Pixel ID provided.");
            return;
        }
        if (this.initialized) return;

        /* eslint-disable */
        if (typeof window !== 'undefined') {
            !function (f, b, e, v, n, t, s) {
                if (f.fbq) return; n = f.fbq = function () {
                    n.callMethod ?
                        n.callMethod.apply(n, arguments) : n.queue.push(arguments)
                };
                if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
                n.queue = []; t = b.createElement(e); t.async = !0;
                t.src = v; s = b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t, s)
            }(window, document, 'script',
                'https://connect.facebook.net/en_US/fbevents.js');

            window.fbq('init', pixelId);
            window.fbq('track', 'PageView');
            this.initialized = true;
            console.log(`✅ [MetaService] Pixel Initialized: ${pixelId}`);
        }
        /* eslint-enable */
    }

    /**
     * Generates a unique Event ID for deduplication.
     * MUST be shared between Pixel and Server (CAPI).
     * @returns {string} UUID
     */
    generateEventId() {
        return generateUUID();
    }

    /**
     * Tracks a standard event.
     * @param {string} eventName - e.g. "ViewContent", "Contact", "Schedule"
     * @param {Object} data - Event parameters (content_name, value, etc.)
     * @param {string} eventId - Unique ID for deduplication
     */
    track(eventName, data = {}, eventId = null) {
        if (typeof window !== 'undefined' && window.fbq) {
            const params = { ...data };
            const options = {};

            if (eventId) {
                options.eventID = eventId;
            }

            // Syntax: fbq('track', eventName, params, options)
            window.fbq('track', eventName, params, options);
            console.log(`📡 [MetaService] Tracked ${eventName}`, params, options);
        } else {
            console.warn("⚠️ [MetaService] fbq not defined. Pixel might be blocked.");
        }
    }

    /**
     * Extracts _fbp cookie value
     */
    getFbp() {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; _fbp=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    /**
     * Extracts _fbc cookie value
     */
    getFbc() {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; _fbc=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }
}
