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
     * Normalizes phone number to digits only and adds country code if missing.
     * Default: Mexico (52) for 10-digit numbers.
     * @param phone The input phone string
     */
    normalizePhone(phone) {
        if (!phone)
            return '';
        const digits = phone.replace(/\D/g, '');
        // Assumption: If 10 digits, it's a Mexico number without code. Add 52.
        if (digits.length === 10) {
            return `52${digits}`;
        }
        return digits;
    }
    /**
     * Sends an event to Meta CAPI.
     * @param eventName The name of the event (e.g., 'Schedule', 'Contact')
     * @param userData TrackingUserData for matching (PII will be hashed)
     * @param customData Custom properties for the event
     * @param eventId Unique ID for deduplication
     * @param eventSourceUrl The URL where the event occurred (optional but recommended)
     */
    async sendEvent(event) {
        var _a;
        const { eventName, userData, customData = {}, eventId, eventSourceUrl } = event;
        try {
            const payload = Object.assign({ data: [
                    {
                        event_name: eventName,
                        event_time: Math.floor(Date.now() / 1000),
                        action_source: 'website',
                        event_source_url: eventSourceUrl,
                        event_id: eventId,
                        user_data: {
                            em: userData.email ? [this.hashData(userData.email)] : undefined,
                            // ✅ Apply Normalization before Hashing
                            ph: userData.phone ? [this.hashData(this.normalizePhone(userData.phone))] : undefined,
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
            if (meta_1.META_CONFIG.TEST_EVENT_CODE) {
                console.debug(`🧪 [Meta CAPI] TEST MODE ACTIVE. Code: ${meta_1.META_CONFIG.TEST_EVENT_CODE}`);
            }
            // Sanity Check
            if (!payload.data[0].event_id) {
                console.error("⛔ [FATAL] 'event_id' is MISSING in the generated payload!");
            }
            // ✅ Debug Log: Show full JSON being sent
            console.debug(`📦 [Meta CAPI] Payload for '${eventName}':`, JSON.stringify(payload, null, 2));
            const response = await axios_1.default.post(this.baseUrl, payload);
            if (response.data && response.data.error) {
                console.error('Meta CAPI Error Response:', response.data.error);
                throw new Error(response.data.error.message);
            }
            console.log(`Meta CAPI Event '${eventName}' sent successfully. EventID: ${eventId}`);
        }
        catch (error) {
            console.error('Failed to send Meta CAPI event:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        }
    }
}
exports.MetaAdsService = MetaAdsService;
//# sourceMappingURL=MetaAdsService.js.map