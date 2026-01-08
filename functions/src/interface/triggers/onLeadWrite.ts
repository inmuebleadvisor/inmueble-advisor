import * as functions from "firebase-functions/v1";
import * as logger from "firebase-functions/logger";
import * as admin from 'firebase-admin';

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

        if (!isStatusChanged && !hasTransientFields) {
            return; // Nothing to do
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
                // Use update to avoid infinite loops?
                // Writing to the same document triggers onWrite again.
                // We must be careful.
                // Infinite loop protection:
                // If we are ONLY deleting transient fields, and status didn't change, 
                // the next run will find !isStatusChanged and !hasTransientFields (since we deleted them).
                // If we are appending history, the next run will see status SAME, and no transient fields.
                // So it should be safe.

                await change.after.ref.update(updates);
            } catch (error) {
                logger.error(`[LeadHistory] Error updating lead ${leadId}:`, error);
            }
        }
    });
