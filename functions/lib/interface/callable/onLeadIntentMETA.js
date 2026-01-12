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
const ipUtils_1 = require("../../core/utils/ipUtils");
/**
 * Callable: onLeadIntentMETA
 * Description: Explicitly triggered by the Frontend when a high-intent action occurs (e.g., Opening the Scheduler).
 * This allows tracking users even if they haven't submitted the full lead form yet (Contact Event).
 *
 * @param request { metaEventId, eventName, leadData: { ... } }
 */
exports.onLeadIntentMETA = (0, https_1.onCall)({ cors: true }, async (request) => {
    // 1. Validation (Relaxed for Intent - allow unauthenticated)
    var _a, _b, _c, _d;
    const { metaEventId, eventName, leadData } = request.data;
    // STRICT VALIDATION: Only ViewContent allowed
    if (eventName !== 'ViewContent') {
        logger.warn(`[MetaCAPI-ViewContent] Invalid usage. Function is now restricted to 'ViewContent' only. Received: ${eventName}`);
        // Fail gracefully or throw error depending on strictness needed. 
        // Returning success=false allows client to know it used the wrong endpoint.
        return { success: false, reason: "endpoint_deprecated_for_this_event_use_specialized_function" };
    }
    if (!metaEventId) {
        logger.warn(`[MetaCAPI-ViewContent] Invalid intent request. Missing 'metaEventId'.`);
        return { success: false, reason: "invalid_args" };
    }
    logger.info(`[MetaCAPI-ViewContent] Received intent '${eventName}' (ID: ${metaEventId})`);
    // 2. Extract Data for Meta (Robust Fallbacks)
    const email = (leadData === null || leadData === void 0 ? void 0 : leadData.email) || ((_a = leadData === null || leadData === void 0 ? void 0 : leadData.clienteDatos) === null || _a === void 0 ? void 0 : _a.email) || (leadData === null || leadData === void 0 ? void 0 : leadData.correo);
    const phone = (leadData === null || leadData === void 0 ? void 0 : leadData.telefono) || ((_b = leadData === null || leadData === void 0 ? void 0 : leadData.clienteDatos) === null || _b === void 0 ? void 0 : _b.telefono) || (leadData === null || leadData === void 0 ? void 0 : leadData.celular);
    // Name Splitting Logic (Standardized)
    let firstName = (leadData === null || leadData === void 0 ? void 0 : leadData.nombre) || ((_c = leadData === null || leadData === void 0 ? void 0 : leadData.clienteDatos) === null || _c === void 0 ? void 0 : _c.nombre);
    let lastName = (leadData === null || leadData === void 0 ? void 0 : leadData.apellido) || ((_d = leadData === null || leadData === void 0 ? void 0 : leadData.clienteDatos) === null || _d === void 0 ? void 0 : _d.apellido);
    if (firstName && !lastName) {
        const parts = firstName.trim().split(' ');
        if (parts.length > 1) {
            firstName = parts[0];
            lastName = parts.slice(1).join(' ');
        }
    }
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
                clientIp: (0, ipUtils_1.extractClientIp)(request, leadData),
                userAgent: request.rawRequest.headers['user-agent'] || (leadData === null || leadData === void 0 ? void 0 : leadData.clientUserAgent) || (leadData === null || leadData === void 0 ? void 0 : leadData.userAgent),
                fbc: (leadData === null || leadData === void 0 ? void 0 : leadData.fbc) || (leadData === null || leadData === void 0 ? void 0 : leadData._fbc),
                fbp: (leadData === null || leadData === void 0 ? void 0 : leadData.fbp) || (leadData === null || leadData === void 0 ? void 0 : leadData._fbp),
                zipCode: leadData === null || leadData === void 0 ? void 0 : leadData.zipCode,
                external_id: leadData === null || leadData === void 0 ? void 0 : leadData.external_id // ✅ External ID
            },
            eventSourceUrl: leadData === null || leadData === void 0 ? void 0 : leadData.urlOrigen,
            customData: Object.assign({ content_name: leadData === null || leadData === void 0 ? void 0 : leadData.nombreDesarrollo, content_category: 'Vivienda Nueva', value: (leadData === null || leadData === void 0 ? void 0 : leadData.value) || 0, currency: (leadData === null || leadData === void 0 ? void 0 : leadData.currency) || 'MXN' }, leadData === null || leadData === void 0 ? void 0 : leadData.customData)
        });
        logger.info(`[MetaCAPI-ViewContent] Successfully processed intent '${eventName}' for ${metaEventId}`);
        return { success: true };
    }
    catch (err) {
        logger.error(`[MetaCAPI-ViewContent] Error processing intent ${metaEventId}:`, err);
        return { success: false, error: err.message };
    }
});
//# sourceMappingURL=onLeadIntentMETA.js.map