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
exports.onLeadCreatedMETA = void 0;
const https_1 = require("firebase-functions/v2/https");
const functions = __importStar(require("firebase-functions/v1")); // ✅ Import v1 for HttpsError compatibility or use v2 equivalent
const logger = __importStar(require("firebase-functions/logger"));
const MetaAdsService_1 = require("../../infrastructure/services/MetaAdsService");
const RegisterConversion_1 = require("../../core/usecases/RegisterConversion");
const ipUtils_1 = require("../../core/utils/ipUtils");
/**
 * Callable: onLeadCreatedMETA
 * Description: Explicitly triggered by the Frontend after a successful lead creation.
 * Responsibilities:
 * 1. Validates the lead payload.
 * 2. Sends the 'Schedule' event to Meta CAPI using the standardized RegisterConversion use case.
 *
 * @param request { leadId: string, leadData: any }
 */
exports.onLeadCreatedMETA = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c, _d, _e;
    // 1. Validation
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const { leadId, leadData } = request.data;
    if (!leadId || !leadData) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with "leadId" and "leadData" arguments.');
    }
    logger.info(`[MetaCAPI] Received explicit notification for Lead ${leadId}`);
    // 2. Extract Data for Meta
    // STRICT EXTRACTION for Meta Quality (em, ph, fn, ln)
    // Priority: Root fields -> clienteDatos -> known aliases
    const email = leadData.email || ((_a = leadData.clienteDatos) === null || _a === void 0 ? void 0 : _a.email) || leadData.correo;
    const phone = leadData.telefono || ((_b = leadData.clienteDatos) === null || _b === void 0 ? void 0 : _b.telefono) || leadData.celular;
    // Name Splitting Logic
    let firstName = leadData.nombre || ((_c = leadData.clienteDatos) === null || _c === void 0 ? void 0 : _c.nombre);
    let lastName = leadData.apellido || ((_d = leadData.clienteDatos) === null || _d === void 0 ? void 0 : _d.apellido) || leadData.apellidos;
    if (firstName && !lastName) {
        const parts = firstName.trim().split(' ');
        if (parts.length > 1) {
            firstName = parts[0];
            lastName = parts.slice(1).join(' ');
        }
    }
    const eventId = leadData.metaEventId;
    // Extract Source URL
    const eventSourceUrl = leadData.urlOrigen || leadData.url || leadData.landingUrl;
    if (!eventId) {
        logger.warn(`[MetaCAPI] SKIPPING: Lead ${leadId} missing 'metaEventId'.`);
        return { success: false, reason: "missing_event_id" };
    }
    // 3. Execution
    const metaService = new MetaAdsService_1.MetaAdsService();
    const registerConversion = new RegisterConversion_1.RegisterConversion(metaService);
    try {
        await registerConversion.execute({
            leadId: leadId,
            email: email,
            phone: phone,
            firstName: firstName,
            lastName: lastName,
            clientIp: (0, ipUtils_1.extractClientIp)(request, leadData),
            userAgent: leadData.clientUserAgent || leadData.userAgent,
            fbc: leadData.fbc || leadData._fbc,
            fbp: leadData.fbp || leadData._fbp,
            zipCode: leadData.zipCode || leadData.codigoPostal,
            eventName: 'Schedule',
            eventId: eventId,
            eventSourceUrl: eventSourceUrl,
            conversionValue: ((_e = leadData.snapshot) === null || _e === void 0 ? void 0 : _e.precioAtCapture) || 0,
            contentName: leadData.nombreDesarrollo || 'Cita Inmueble Advisor',
            status: 'scheduled' // Default for creation
        });
        logger.info(`[MetaCAPI] Successfully processed event for ${leadId}`);
        return { success: true };
    }
    catch (err) {
        logger.error(`[MetaCAPI] Error processing ${leadId}:`, err);
        // We do not throw error to client to avoid disrupting their flow, just log it.
        return { success: false, error: err.message };
    }
});
//# sourceMappingURL=onLeadCreatedMETA.js.map