import axios from 'axios';
import * as crypto from 'crypto';
import { META_CONFIG } from '../../core/constants/meta';
import { TrackingService, TrackingEvent, TrackingUserData } from '../../core/interfaces/TrackingService';



export class MetaAdsService implements TrackingService {
    private readonly baseUrl: string;

    constructor() {
        this.baseUrl = `https://graph.facebook.com/${META_CONFIG.API_VERSION}/${META_CONFIG.PIXEL_ID}/events`;
    }

    /**
     * Hashes a string using SHA256 as required by Meta.
     * @param data The data to hash (email, phone, etc.)
     * @returns The hashed string
     */
    private hashData(data: string): string {
        if (!data) return '';
        // Meta requires: normalized, lowercase, trim, then hash
        const normalized = data.trim().toLowerCase();
        return crypto.createHash('sha256').update(normalized).digest('hex');
    }

    /**
     * Sends an event to Meta CAPI.
     * @param eventName The name of the event (e.g., 'Schedule', 'Contact')
     * @param userData TrackingUserData for matching (PII will be hashed)
     * @param customData Custom properties for the event
     * @param eventId Unique ID for deduplication
     * @param eventSourceUrl The URL where the event occurred (optional but recommended)
     */
    async sendEvent(event: TrackingEvent | string, ...args: any[]): Promise<void> {
        // Adapt legacy signature to interface if needed, or enforce interface
        // We will support the interface structure mainly.

        let eventName: string;
        let userData: TrackingUserData;
        let customData: Record<string, any>;
        let eventId: string;
        let eventSourceUrl: string | undefined;

        if (typeof event === 'object') {
            // It's the TrackingEvent object
            const trackingEvent = event as TrackingEvent;
            eventName = trackingEvent.eventName;
            userData = trackingEvent.userData;
            customData = trackingEvent.customData || {};
            eventId = trackingEvent.eventId;
            eventSourceUrl = trackingEvent.eventSourceUrl;
        } else {
            // Legacy signature support (for existing tests/calls if any remain)
            eventName = event;
            userData = args[0];
            customData = args[1] || {};
            eventId = args[2];
            eventSourceUrl = args[3];
        }

        try {
            const payload = {
                data: [
                    {
                        event_name: eventName,
                        event_time: Math.floor(Date.now() / 1000),
                        action_source: 'website',
                        event_source_url: eventSourceUrl,
                        event_id: eventId,
                        user_data: {
                            em: userData.email ? [this.hashData(userData.email)] : undefined,
                            ph: userData.phone ? [this.hashData(userData.phone)] : undefined,
                            fn: userData.firstName ? [this.hashData(userData.firstName)] : undefined,
                            ln: userData.lastName ? [this.hashData(userData.lastName)] : undefined,
                            zp: userData.zipCode ? [this.hashData(userData.zipCode)] : undefined,
                            client_ip_address: userData.clientIp,
                            client_user_agent: userData.userAgent,
                            fbc: userData.fbc,
                            fbp: userData.fbp,
                        },
                        custom_data: customData,
                    },
                ],
                access_token: META_CONFIG.ACCESS_TOKEN,
                // Add test_event_code if available
                ...(META_CONFIG.TEST_EVENT_CODE ? { test_event_code: META_CONFIG.TEST_EVENT_CODE } : {}),
            };

            // If test event code exists, we should append it to the data or as a query param? 
            // Meta CAPI documentation says it goes in the payload generally, 
            // but let's check if we need to put it inside the 'data' array or top level?
            // Usually it's top level parameter `test_event_code` alongside `data` and `access_token`
            // Re-checking standard implementations: it's a parameter in the POST body alongside `data`.

            // Wait, Axios body is just the object.

            // Note: If TEST_EVENT_CODE is set, we append to payload.
            if (META_CONFIG.TEST_EVENT_CODE) {
                // @ts-ignore
                payload.test_event_code = META_CONFIG.TEST_EVENT_CODE;
            }

            // Sanity Check
            if (!payload.data[0].event_id) {
                console.error("⛔ [FATAL] 'event_id' is MISSING in the generated payload!");
            }

            const response = await axios.post(this.baseUrl, payload);

            if (response.data && response.data.error) {
                console.error('Meta CAPI Error Response:', response.data.error);
                throw new Error(response.data.error.message);
            }

            console.log(`Meta CAPI Event '${eventName}' sent successfully. EventID: ${eventId}`);

        } catch (error: any) {
            console.error('Failed to send Meta CAPI event:', error.response?.data || error.message);
            // We verify if we should throw or just log. Generally we don't want to break the lead flow if tracking fails,
            // but we want to know about it.
        }
    }
}
