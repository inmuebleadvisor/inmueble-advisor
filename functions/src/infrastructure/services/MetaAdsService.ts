import * as crypto from 'crypto';
import * as logger from "firebase-functions/logger";

/**
 * Service to handle Server-Side API events (CAPI) for Meta Ads.
 * Follows "Hybrid Tracking" architecture.
 */
export class MetaAdsService {
    private pixelId: string;
    private accessToken: string;
    private apiVersion = 'v19.0';
    private testEventCode: string | null;

    constructor() {
        // Hardcoded for project speed as per request, but ideally env vars
        this.pixelId = "25721482294159393";
        this.accessToken = "EAAMPefbZC6fwBQS1EHbrRtdkZBtnEZCAFv0ZBCtX1YhKA4ttRKUgUm6EeLwbQwwswFUZAwShkaRu43gl7z29fwrp47nsXLs3NTA5IDqlmVFuf1fcZBx9QfnSEE4OOG4fcL2FumVuDRAotDe9fVU5s6gbkTZAQaMCHRHu7XkJd4hiBbpyvKKC6wbxosK1Y7HxAZDZD";

        // For development/testing
        this.testEventCode = "TEST41315";
    }

    /**
     * Sends an event to Meta CAPI.
     * @param eventName Standard Event Name (Contact, Schedule, etc)
     * @param eventId Deduplication ID (Must match Browser Pixel)
     * @param userData User Data (em, ph, fn, ln, etc) - Will be hashed automatically
     * @param customData Custom Data (value, currency, content_name)
     * @param sourceUrl The URL where the event happened
     */
    async sendEvent(
        eventName: string,
        eventId: string,
        userData: any,
        customData: any = {},
        sourceUrl: string = 'https://inmueble-advisor.web.app/'
    ) {
        if (!eventId) {
            logger.warn(`[MetaCAPI] Missing eventId for ${eventName}. Deduplication might fail.`);
        }

        const payload = {
            data: [
                {
                    event_name: eventName,
                    event_time: Math.floor(Date.now() / 1000),
                    event_source_url: sourceUrl,
                    event_id: eventId,
                    action_source: "website",
                    user_data: this.processUserData(userData),
                    custom_data: customData,
                }
            ],
            test_event_code: this.testEventCode // ONLY FOR DEBUGGING/DEV
        };

        try {
            const url = `https://graph.facebook.com/${this.apiVersion}/${this.pixelId}/events?access_token=${this.accessToken}`;

            logger.info(`[MetaCAPI] Sending ${eventName} (ID: ${eventId})...`);

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const responseData = await response.json();

            if (!response.ok) {
                logger.error(`[MetaCAPI] Error calling Graph API:`, responseData);
                throw new Error(JSON.stringify(responseData));
            }

            logger.info(`[MetaCAPI] Success:`, responseData);
            return responseData;

        } catch (error) {
            logger.error(`[MetaCAPI] Exception sending event:`, error);
        }
    }

    /**
     * Hashes PII data using SHA256 as required by Meta.
     * Normalizes data (lowercase, trim) before hashing.
     */
    private processUserData(userData: any) {
        const processed: any = {};

        // 1. Direct Pass Fields (IP, User Agent, fbp, fbc)
        if (userData.client_ip_address) processed.client_ip_address = userData.client_ip_address;
        if (userData.client_user_agent) processed.client_user_agent = userData.client_user_agent;
        if (userData.fbp) processed.fbp = userData.fbp;
        if (userData.fbc) processed.fbc = userData.fbc;

        // 2. Hashed Fields
        const fieldsToHash = ['em', 'ph', 'fn', 'ln', 'ct', 'st', 'zp', 'country'];

        fieldsToHash.forEach(field => {
            if (userData[field]) {
                processed[field] = this.hash(userData[field]);
            }
        });

        // 3. External ID (uid) - hashed
        if (userData.external_id) {
            processed.external_id = this.hash(userData.external_id);
        }

        return processed;
    }

    private hash(value: string): string {
        if (!value) return '';
        const normalized = value.trim().toLowerCase();
        return crypto.createHash('sha256').update(normalized).digest('hex');
    }
}
