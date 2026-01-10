import * as functions from "firebase-functions/v1";
import * as logger from "firebase-functions/logger";
import * as admin from 'firebase-admin';
import { MetaAdsService } from "../../infrastructure/services/MetaAdsService";
import { RegisterConversion } from "../../core/usecases/RegisterConversion";

/**
 * Trigger: onLeadWrite
 * Description: Centralizes the "Status History" logic.
 * Listens for changes to 'leads/{leadId}'.
 * If 'status' changes, it appends to 'statusHistory'.
 * Cleans up transient fields '_statusReason' and '_changedBy'.
 */
export const onLeadWrite = functions.firestore
    .document("leads/{leadId}")
    .onWrite(async (change, context) => {
        // 1. Exit if deleted
        if (!change.after.exists) return;

        const beforeData = change.before.exists ? change.before.data() : {};
        const afterData = change.after.data();

        // Safety check
        if (!afterData) return;

        const leadId = context.params.leadId;
        const oldStatus = beforeData?.status;
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

        const oldEventId = beforeData?.metaEventId;
        const newEventId = afterData.metaEventId;

        const isNewConversionEvent = newEventId && (newEventId !== oldEventId);

        if (isNewConversionEvent) {

            // STRICT EXTRACTION for Meta Quality (em, ph, fn, ln)
            // Priority: Root fields -> clienteDatos -> known aliases (correo, celular)
            const email = afterData.email || afterData.clienteDatos?.email || afterData.correo;
            const phone = afterData.telefono || afterData.clienteDatos?.telefono || afterData.celular;

            // Name Splitting Logic (Parity with Frontend)
            let firstName = afterData.nombre || afterData.clienteDatos?.nombre;
            let lastName = afterData.apellido || afterData.clienteDatos?.apellido || afterData.apellidos;

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
            } else {

                const metaService = new MetaAdsService();
                const registerConversion = new RegisterConversion(metaService);

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
                        conversionValue: afterData.snapshot?.precioAtCapture || 0,
                        contentName: afterData.nombreDesarrollo || 'Cita Inmueble Advisor'
                    });
                } catch (err: any) {
                    logger.error("[MetaCAPI] Failed to execute RegisterConversion", err);
                }
            }
        } else {
            // condition not met, silent skip or debug log if needed
        }

        if (!isStatusChanged && !hasTransientFields) {
            return; // Nothing to do regarding History
        }

        const updates: any = {};

        // 2. Handle Status History Logic
        if (isStatusChanged && newStatus) {
            const historyEntry = {
                status: newStatus,
                timestamp: admin.firestore.Timestamp.now(), // Use server timestamp logic
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
            } catch (error) {
                logger.error(`[LeadHistory] Error updating lead ${leadId}:`, error);
            }
        }
    });
