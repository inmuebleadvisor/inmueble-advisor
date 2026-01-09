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
        // 2a. Handle Appointment Scheduling (Meta CAPI)
        // Check if a new appointment was confirmed/set
        // Force Deploy: 2026-01-08-FIX-V3 (Strict PII & Deduplication)
        const oldCita = beforeData?.citainicial;
        const newCita = afterData.citainicial;

        // Logic: specific check for "citainicial.dia" existence or CHANGE
        const hasNewDate = !!newCita?.dia;
        const isDateChanged = newCita?.dia !== oldCita?.dia;

        if (hasNewDate && isDateChanged) {

            // STRICT EXTRACTION for Meta Quality (em, ph, fn, ln)
            // Priority: Root fields -> clienteDatos -> known aliases (correo, celular)
            const email = afterData.email || afterData.clienteDatos?.email || afterData.correo;
            const phone = afterData.telefono || afterData.clienteDatos?.telefono || afterData.celular;
            const firstName = afterData.nombre || afterData.clienteDatos?.nombre;
            const lastName = afterData.apellido || afterData.clienteDatos?.apellido || afterData.apellidos;

            // Tracking IDs from Frontend (Critical for Deduplication)
            // 'metaEventId' MUST be explicitly passed from LeadCaptureForm.jsx
            const eventId = afterData.metaEventId;

            if (!eventId) {
                logger.warn(`[MetaCAPI] ERROR: 'metaEventId' missing from lead ${leadId}. Deduplication WILL FAIL.`);
            } else {
                logger.info(`[MetaCAPI] Triggering Schedule Event for Lead ${leadId}. EventID: ${eventId}`);
            }

            // Only proceed if we have an ID to deduplicate against
            const finalEventId = eventId || `schedule_${leadId}`; // Kept as last resort backup but log says it will fail sync.

            const metaService = new MetaAdsService();

            try {
                await metaService.sendEvent(
                    'Schedule',
                    {
                        email: email,      // em
                        phone: phone,      // ph
                        firstName: firstName, // fn
                        lastName: lastName,   // ln
                        clientIp: afterData.clientIp || afterData.ip,
                        userAgent: afterData.clientUserAgent || afterData.userAgent,
                        fbc: afterData.fbc || afterData._fbc,
                        fbp: afterData.fbp || afterData._fbp,
                        zipCode: afterData.zipCode || afterData.codigoPostal
                    },
                    {
                        content_name: afterData.nombreDesarrollo || 'Cita Inmueble Advisor',
                        status: 'scheduled',
                        content_category: 'Vivienda Nueva',
                        currency: 'MXN',
                        value: afterData.snapshot?.precioAtCapture || 0
                    },
                    finalEventId
                );
            } catch (err: any) {
                logger.error("[MetaCAPI] Failed to send Schedule event", err);
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
