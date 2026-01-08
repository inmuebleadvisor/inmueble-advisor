"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaAdsService = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto = __importStar(require("crypto"));
const meta_1 = require("../../core/constants/meta");
class MetaAdsService {
    constructor() {
        this.baseUrl = `https://graph.facebook.com/${meta_1.META_CONFIG.API_VERSION}/${meta_1.META_CONFIG.PIXEL_ID}/events`;
    }
    /**
     * Hashes a string using SHA256 as required by Meta.
     * @param data The data to hash (email, phone, etc.)
     * @returns The hashed string
     */
    hashData(data) {
        if (!data)
            return '';
        // Meta requires: normalized, lowercase, trim, then hash
        const normalized = data.trim().toLowerCase();
        return crypto.createHash('sha256').update(normalized).digest('hex');
    }
    /**
     * Sends an event to Meta CAPI.
     * @param eventName The name of the event (e.g., 'Schedule', 'Contact')
     * @param userData User data for matching (PII will be hashed)
     * @param customData Custom properties for the event
     * @param eventId Unique ID for deduplication
     */
    async sendEvent(eventName, userData, customData = {}, eventId) {
        var _a;
        try {
            const payload = Object.assign({ data: [
                    {
                        event_name: eventName,
                        event_time: Math.floor(Date.now() / 1000),
                        action_source: 'website',
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
                ], access_token: meta_1.META_CONFIG.ACCESS_TOKEN }, (meta_1.META_CONFIG.TEST_EVENT_CODE ? { test_event_code: meta_1.META_CONFIG.TEST_EVENT_CODE } : {}));
            // If test event code exists, we should append it to the data or as a query param? 
            // Meta CAPI documentation says it goes in the payload generally, 
            // but let's check if we need to put it inside the 'data' array or top level?
            // Usually it's top level parameter `test_event_code` alongside `data` and `access_token`
            // Re-checking standard implementations: it's a parameter in the POST body alongside `data`.
            // Wait, Axios body is just the object.
            // Note: If TEST_EVENT_CODE is set, we append to payload.
            if (meta_1.META_CONFIG.TEST_EVENT_CODE) {
                // @ts-ignore
                payload.test_event_code = meta_1.META_CONFIG.TEST_EVENT_CODE;
            }
            // DEBUG: Print full payload
            console.log("🛠️ [Meta CAPI] Sending Payload:", JSON.stringify(payload, null, 2));
            const response = await axios_1.default.post(this.baseUrl, payload);
            if (response.data && response.data.error) {
                console.error('Meta CAPI Error Response:', response.data.error);
                throw new Error(response.data.error.message);
            }
            console.log(`Meta CAPI Event '${eventName}' sent successfully. EventID: ${eventId}`);
        }
        catch (error) {
            console.error('Failed to send Meta CAPI event:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            // We verify if we should throw or just log. Generally we don't want to break the lead flow if tracking fails,
            // but we want to know about it.
        }
    }
}
exports.MetaAdsService = MetaAdsService;
//# sourceMappingURL=MetaAdsService.js.map