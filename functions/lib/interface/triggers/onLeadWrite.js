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
    var _a, _b, _c, _d;
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
    // Check if a new appointment was confirmed/set
    const oldCita = beforeData === null || beforeData === void 0 ? void 0 : beforeData.citainicial;
    const newCita = afterData.citainicial;
    // DEBUG LOGS for Meta CAPI
    logger.info(`[MetaCAPI] Checking Trigger for Lead ${leadId}.`, {
        oldCitaDia: oldCita === null || oldCita === void 0 ? void 0 : oldCita.dia,
        newCitaDia: newCita === null || newCita === void 0 ? void 0 : newCita.dia,
        hasMetaId: !!afterData.metaEventId
    });
    // Logic: specific check for "citainicial.dia" existence or CHANGE
    // If a date exists now, and it's different from before (or didn't exist before)
    const hasNewDate = !!(newCita === null || newCita === void 0 ? void 0 : newCita.dia);
    const isDateChanged = (newCita === null || newCita === void 0 ? void 0 : newCita.dia) !== (oldCita === null || oldCita === void 0 ? void 0 : oldCita.dia);
    if (hasNewDate && isDateChanged) {
        logger.info(`[MetaCAPI] Triggering Schedule Event for Lead ${leadId}`);
        const metaService = new MetaAdsService_1.MetaAdsService();
        const msEventId = afterData.metaEventId || afterData.eventId;
        // Ensure we have a valid event ID for deduplication. If not provided by frontend, we generate one but deduplication might fail.
        const scheduleEventId = msEventId || `schedule_${leadId}`;
        try {
            await metaService.sendEvent('Schedule', {
                email: afterData.email || ((_a = afterData.clienteDatos) === null || _a === void 0 ? void 0 : _a.email),
                phone: afterData.telefono || ((_b = afterData.clienteDatos) === null || _b === void 0 ? void 0 : _b.telefono),
                firstName: afterData.nombre || ((_c = afterData.clienteDatos) === null || _c === void 0 ? void 0 : _c.nombre),
                lastName: afterData.apellido || ((_d = afterData.clienteDatos) === null || _d === void 0 ? void 0 : _d.apellido),
                clientIp: afterData.clientIp || afterData.ip,
                userAgent: afterData.clientUserAgent || afterData.userAgent,
                fbc: afterData.fbc || afterData._fbc,
                fbp: afterData.fbp || afterData._fbp,
                zipCode: afterData.zipCode || afterData.codigoPostal
            }, {
                content_name: afterData.nombreDesarrollo || 'Cita Inmueble Advisor',
                status: 'scheduled',
                content_category: 'Vivienda Nueva'
            }, scheduleEventId);
        }
        catch (err) {
            logger.error("[MetaCAPI] Failed to send Schedule event", err);
        }
    }
    else {
        logger.info("[MetaCAPI] Condition not met. Skipping event.");
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