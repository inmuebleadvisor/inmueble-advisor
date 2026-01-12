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
Object.defineProperty(exports, "__esModule", { value: true });
exports.onLeadIntentMETA = void 0;
const https_1 = require("firebase-functions/v2/https");
// import * as functions from "firebase-functions/v1"; // Unused
const logger = __importStar(require("firebase-functions/logger"));
const MetaAdsService_1 = require("../../infrastructure/services/MetaAdsService");
/**
 * Callable: onLeadIntentMETA
 * Description: Explicitly triggered by the Frontend when a high-intent action occurs (e.g., Opening the Scheduler).
 * This allows tracking users even if they haven't submitted the full lead form yet (Contact Event).
 *
 * @param request { metaEventId, eventName, leadData: { ... } }
 */
exports.onLeadIntentMETA = (0, https_1.onCall)({ cors: true }, async (request) => {
    // 1. Validation (Relaxed for Intent - allow unauthenticated)
    // We do NOT strictly check request.auth because a user might be anonymous when clicking "Agendar".
    var _a, _b, _c, _d;
    const { metaEventId, eventName, leadData } = request.data;
    if (!metaEventId || !eventName) {
        logger.warn(`[MetaCAPI] Invalid intent request. Missing 'metaEventId' or 'eventName'.`);
        return { success: false, reason: "invalid_args" };
    }
    // Only allow specific intent events to prevent abuse
    const ALLOWED_INTENTS = ['Contact', 'ViewContent', 'InitiateCheckout', 'PageView'];
    if (!ALLOWED_INTENTS.includes(eventName)) {
        logger.warn(`[MetaCAPI] Blocked unknown event: ${eventName}`);
        return { success: false, reason: "event_not_allowed" };
    }
    logger.info(`[MetaCAPI] Received intent '${eventName}' (ID: ${metaEventId})`);
    // 2. Extract Data for Meta
    // Prioritize passed data, fallback to minimal
    // Note: For 'Contact', we might not have email/phone yet.
    const email = (leadData === null || leadData === void 0 ? void 0 : leadData.email) || ((_a = leadData === null || leadData === void 0 ? void 0 : leadData.clienteDatos) === null || _a === void 0 ? void 0 : _a.email);
    const phone = (leadData === null || leadData === void 0 ? void 0 : leadData.telefono) || ((_b = leadData === null || leadData === void 0 ? void 0 : leadData.clienteDatos) === null || _b === void 0 ? void 0 : _b.telefono);
    const firstName = (leadData === null || leadData === void 0 ? void 0 : leadData.nombre) || ((_c = leadData === null || leadData === void 0 ? void 0 : leadData.clienteDatos) === null || _c === void 0 ? void 0 : _c.nombre);
    const lastName = (leadData === null || leadData === void 0 ? void 0 : leadData.apellido) || ((_d = leadData === null || leadData === void 0 ? void 0 : leadData.clienteDatos) === null || _d === void 0 ? void 0 : _d.apellido);
    // 3. Execution
    const metaService = new MetaAdsService_1.MetaAdsService();
    try {
        await metaService.sendEvent({
            eventName: eventName,
            eventId: metaEventId,
            userData: {
                email: email,
                phone: phone,
                firstName: firstName,
                lastName: lastName,
                clientIp: request.rawRequest.ip || (leadData === null || leadData === void 0 ? void 0 : leadData.clientIp),
                userAgent: request.rawRequest.headers['user-agent'] || (leadData === null || leadData === void 0 ? void 0 : leadData.clientUserAgent),
                fbc: leadData === null || leadData === void 0 ? void 0 : leadData.fbc,
                fbp: leadData === null || leadData === void 0 ? void 0 : leadData.fbp,
                zipCode: leadData === null || leadData === void 0 ? void 0 : leadData.zipCode
            },
            eventSourceUrl: leadData === null || leadData === void 0 ? void 0 : leadData.urlOrigen,
            customData: Object.assign({ content_name: leadData === null || leadData === void 0 ? void 0 : leadData.nombreDesarrollo, content_category: 'Vivienda Nueva' }, leadData === null || leadData === void 0 ? void 0 : leadData.customData)
        });
        logger.info(`[MetaCAPI] Successfully processed intent '${eventName}' for ${metaEventId}`);
        return { success: true };
    }
    catch (err) {
        logger.error(`[MetaCAPI] Error processing intent ${metaEventId}:`, err);
        return { success: false, error: err.message };
    }
});
//# sourceMappingURL=onLeadIntentMETA.js.map