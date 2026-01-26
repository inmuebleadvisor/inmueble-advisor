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
exports.onLeadContactMETA = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const MetaAdsService_1 = require("../../infrastructure/services/MetaAdsService");
const ipUtils_1 = require("../../core/utils/ipUtils");
/**
 * Callable: onLeadContactMETA
 * Description: Explicitly triggered by the Frontend when a user initiates contact (e.g., clicking "Agendar").
 * Responsibilities:
 * 1. Validates the request (must contain 'Contact' intent).
 * 2. Sends the 'Contact' event to Meta CAPI.
 *
 * @param request { metaEventId, leadData: { ... } }
 */
exports.onLeadContactMETA = (0, https_1.onCall)({ cors: true }, async (request) => {
    var _a, _b, _c, _d;
    const { metaEventId, leadData } = request.data;
    const eventName = 'Contact';
    if (!metaEventId) {
        logger.warn(`[MetaCAPI-Contact] Invalid request. Missing 'metaEventId'.`);
        return { success: false, reason: "invalid_args" };
    }
    logger.info(`[MetaCAPI-Contact] Received '${eventName}' (ID: ${metaEventId})`);
    // Extract Data for Meta (Robust Fallbacks)
    // Note: For 'Contact', we might not have email/phone yet unless user is logged in.
    const email = (leadData === null || leadData === void 0 ? void 0 : leadData.em) || (leadData === null || leadData === void 0 ? void 0 : leadData.email) || ((_a = leadData === null || leadData === void 0 ? void 0 : leadData.clienteDatos) === null || _a === void 0 ? void 0 : _a.email) || (leadData === null || leadData === void 0 ? void 0 : leadData.correo);
    const phone = (leadData === null || leadData === void 0 ? void 0 : leadData.ph) || (leadData === null || leadData === void 0 ? void 0 : leadData.telefono) || ((_b = leadData === null || leadData === void 0 ? void 0 : leadData.clienteDatos) === null || _b === void 0 ? void 0 : _b.telefono) || (leadData === null || leadData === void 0 ? void 0 : leadData.celular);
    // Name Splitting Logic (Standardized)
    let firstName = (leadData === null || leadData === void 0 ? void 0 : leadData.fn) || (leadData === null || leadData === void 0 ? void 0 : leadData.nombre) || ((_c = leadData === null || leadData === void 0 ? void 0 : leadData.clienteDatos) === null || _c === void 0 ? void 0 : _c.nombre);
    let lastName = (leadData === null || leadData === void 0 ? void 0 : leadData.ln) || (leadData === null || leadData === void 0 ? void 0 : leadData.apellido) || ((_d = leadData === null || leadData === void 0 ? void 0 : leadData.clienteDatos) === null || _d === void 0 ? void 0 : _d.apellido);
    if (firstName && !lastName) {
        const parts = firstName.trim().split(' ');
        if (parts.length > 1) {
            firstName = parts[0];
            lastName = parts.slice(1).join(' ');
        }
    }
    // Execution
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
            customData: Object.assign({ content_name: leadData === null || leadData === void 0 ? void 0 : leadData.nombreDesarrollo, content_category: 'Vivienda Nueva' }, leadData === null || leadData === void 0 ? void 0 : leadData.customData)
        });
        logger.info(`[MetaCAPI-Contact] Successfully processed '${eventName}' for ${metaEventId}`);
        return { success: true };
    }
    catch (err) {
        logger.error(`[MetaCAPI-Contact] Error processing ${metaEventId}:`, err);
        return { success: false, error: err.message };
    }
});
//# sourceMappingURL=onLeadContactMETA.js.map