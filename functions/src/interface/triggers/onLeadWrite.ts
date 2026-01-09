import * as functions from "firebase-functions/v1";
import * as logger from "firebase-functions/logger";
import * as admin from 'firebase-admin';
import { MetaAdsService } from "../../infrastructure/services/MetaAdsService";

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
        // Check if a new appointment was confirmed/set
        // Force Deploy: 2026-01-08-FIX-V2
        const oldCita = beforeData?.citainicial;
        const newCita = afterData.citainicial;

        // DEBUG LOGS for Meta CAPI
        logger.info(`[MetaCAPI] Checking Trigger for Lead ${leadId}.`, {
            oldCitaDia: oldCita?.dia,
            newCitaDia: newCita?.dia,
            hasMetaId: !!afterData.metaEventId
        });

        // Logic: specific check for "citainicial.dia" existence or CHANGE
        // If a date exists now, and it's different from before (or didn't exist before)
        const hasNewDate = !!newCita?.dia;
        const isDateChanged = newCita?.dia !== oldCita?.dia;

        if (hasNewDate && isDateChanged) {
            logger.info(`[MetaCAPI] Triggering Schedule Event for Lead ${leadId}`);

            const metaService = new MetaAdsService();
            const msEventId = afterData.metaEventId || afterData.eventId;
            // Ensure we have a valid event ID for deduplication. If not provided by frontend, we generate one but deduplication might fail.
            const scheduleEventId = msEventId || `schedule_${leadId}`;

            try {
                await metaService.sendEvent(
                    'Schedule',
                    {
                        email: afterData.email || afterData.clienteDatos?.email,
                        phone: afterData.telefono || afterData.clienteDatos?.telefono,
                        firstName: afterData.nombre || afterData.clienteDatos?.nombre,
                        lastName: afterData.apellido || afterData.clienteDatos?.apellido,
                        clientIp: afterData.clientIp || afterData.ip,
                        userAgent: afterData.clientUserAgent || afterData.userAgent,
                        fbc: afterData.fbc || afterData._fbc,
                        fbp: afterData.fbp || afterData._fbp,
                        zipCode: afterData.zipCode || afterData.codigoPostal
                    },
                    {
                        content_name: afterData.nombreDesarrollo || 'Cita Inmueble Advisor',
                        status: 'scheduled',
                        content_category: 'Vivienda Nueva'
                    },
                    scheduleEventId
                );
            } catch (err: any) {
                logger.error("[MetaCAPI] Failed to send Schedule event", err);
            }
        } else {
            logger.info("[MetaCAPI] Condition not met. Skipping event.");
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
