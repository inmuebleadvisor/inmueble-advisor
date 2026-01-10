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
exports.onLeadWrite = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const logger = __importStar(require("firebase-functions/logger"));
const admin = __importStar(require("firebase-admin"));
const MetaAdsService_1 = require("../../infrastructure/services/MetaAdsService");
const RegisterConversion_1 = require("../../core/usecases/RegisterConversion");
/**
 * Trigger: onLeadWrite
 * Description: Centralizes the "Status History" logic.
 * Listens for changes to 'leads/{leadId}'.
 * If 'status' changes, it appends to 'statusHistory'.
 * Cleans up transient fields '_statusReason' and '_changedBy'.
 */
exports.onLeadWrite = functions.firestore
    .document("leads/{leadId}")
    .onWrite(async (change, context) => {
    var _a, _b, _c, _d, _e;
    // 1. Exit if deleted
    if (!change.after.exists)
        return;
    const beforeData = change.before.exists ? change.before.data() : {};
    const afterData = change.after.data();
    // Safety check
    if (!afterData)
        return;
    const leadId = context.params.leadId;
    const oldStatus = beforeData === null || beforeData === void 0 ? void 0 : beforeData.status;
    const newStatus = afterData.status;
    // Detect if status changed OR if it's a new lead (and we want initial history)
    // If it's a new lead, beforeData is empty/undefined.
    const isStatusChanged = oldStatus !== newStatus;
    // Transient fields
    const statusReason = afterData._statusReason;
    const changedBy = afterData._changedBy;
    // Has transient fields to clean?
    const hasTransientFields = statusReason !== undefined || changedBy !== undefined;
    // 2a. Handle Appointment Scheduling (Meta CAPI)
    // Check if a new appointment was confirmed/set - IDEMPOTENT CHECK
    // We only trigger if the 'metaEventId' has changed or is newly added.
    // This handles:
    // 1. New Lead (beforeData is empty -> new ID)
    // 2. Reschedule (Frontend generates new ID -> ID changes)
    // 3. Admin Update/History Update (ID stays same -> NO trigger)
    const oldEventId = beforeData === null || beforeData === void 0 ? void 0 : beforeData.metaEventId;
    const newEventId = afterData.metaEventId;
    const isNewConversionEvent = newEventId && (newEventId !== oldEventId);
    if (isNewConversionEvent) {
        // STRICT EXTRACTION for Meta Quality (em, ph, fn, ln)
        // Priority: Root fields -> clienteDatos -> known aliases (correo, celular)
        const email = afterData.email || ((_a = afterData.clienteDatos) === null || _a === void 0 ? void 0 : _a.email) || afterData.correo;
        const phone = afterData.telefono || ((_b = afterData.clienteDatos) === null || _b === void 0 ? void 0 : _b.telefono) || afterData.celular;
        // Name Splitting Logic (Parity with Frontend)
        let firstName = afterData.nombre || ((_c = afterData.clienteDatos) === null || _c === void 0 ? void 0 : _c.nombre);
        let lastName = afterData.apellido || ((_d = afterData.clienteDatos) === null || _d === void 0 ? void 0 : _d.apellido) || afterData.apellidos;
        if (firstName && !lastName) {
            const parts = firstName.trim().split(' ');
            if (parts.length > 1) {
                firstName = parts[0];
                lastName = parts.slice(1).join(' ');
            }
        }
        // Tracking IDs from Frontend (Critical for Deduplication)
        // 'metaEventId' MUST be explicitly passed from LeadCaptureForm.jsx
        const eventId = newEventId; // We already checked validation below, but let's be strict in var usage
        // Extract Source URL (Parity with Pixel)
        // Priority: urlOrigen -> url -> landingUrl
        const eventSourceUrl = afterData.urlOrigen || afterData.url || afterData.landingUrl;
        // DEBUG URL
        logger.info(`[MetaCAPI] URL Resolution:`, {
            urlOrigen: afterData.urlOrigen,
            url: afterData.url,
            resolved: eventSourceUrl
        });
        // STRICT VALIDATION
        if (!eventId) {
            logger.error(`[MetaCAPI] ABORTING Schedule Event for Lead ${leadId}: 'metaEventId' is missing. Deduplication would fail.`);
        }
        else {
            const metaService = new MetaAdsService_1.MetaAdsService();
            const registerConversion = new RegisterConversion_1.RegisterConversion(metaService);
            // ✅ STANDARDIZED SYNC LOG
            logger.info(`[Meta Sync] Processing Conversion via UseCase: RegisterConversion`);
            try {
                await registerConversion.execute({
                    leadId: leadId,
                    email: email,
                    phone: phone,
                    firstName: firstName,
                    lastName: lastName,
                    clientIp: afterData.clientIp || afterData.ip,
                    userAgent: afterData.clientUserAgent || afterData.userAgent,
                    fbc: afterData.fbc || afterData._fbc,
                    fbp: afterData.fbp || afterData._fbp,
                    zipCode: afterData.zipCode || afterData.codigoPostal,
                    eventName: 'Schedule',
                    eventId: eventId,
                    eventSourceUrl: eventSourceUrl,
                    conversionValue: ((_e = afterData.snapshot) === null || _e === void 0 ? void 0 : _e.precioAtCapture) || 0,
                    contentName: afterData.nombreDesarrollo || 'Cita Inmueble Advisor'
                });
            }
            catch (err) {
                logger.error("[MetaCAPI] Failed to execute RegisterConversion", err);
            }
        }
    }
    else {
        // condition not met, silent skip or debug log if needed
    }
    if (!isStatusChanged && !hasTransientFields) {
        return; // Nothing to do regarding History
    }
    const updates = {};
    // 2. Handle Status History Logic
    if (isStatusChanged && newStatus) {
        const historyEntry = {
            status: newStatus,
            timestamp: admin.firestore.Timestamp.now(),
            note: statusReason || (change.before.exists ? "Estatus actualizado" : "Lead creado"),
            changedBy: changedBy || "SYSTEM"
        };
        updates.statusHistory = admin.firestore.FieldValue.arrayUnion(historyEntry);
        updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        logger.info(`[LeadHistory] Updating history for ${leadId}: ${oldStatus} -> ${newStatus}`);
    }
    // 3. Clean Transient Fields
    if (hasTransientFields) {
        updates._statusReason = admin.firestore.FieldValue.delete();
        updates._changedBy = admin.firestore.FieldValue.delete();
    }
    // Apply updates if any
    if (Object.keys(updates).length > 0) {
        try {
            await change.after.ref.update(updates);
        }
        catch (error) {
            logger.error(`[LeadHistory] Error updating lead ${leadId}:`, error);
        }
    }
});
//# sourceMappingURL=onLeadWrite.js.map