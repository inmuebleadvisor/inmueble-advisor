import { onCall } from "firebase-functions/v2/https";
// import * as functions from "firebase-functions/v1"; // Unused

import * as logger from "firebase-functions/logger";
import { MetaAdsService } from "../../infrastructure/services/MetaAdsService";

/**
 * Callable: onLeadIntentMETA
 * Description: Explicitly triggered by the Frontend when a high-intent action occurs (e.g., Opening the Scheduler).
 * This allows tracking users even if they haven't submitted the full lead form yet (Contact Event).
 * 
 * @param request { metaEventId, eventName, leadData: { ... } }
 */
export const onLeadIntentMETA = onCall({ cors: true }, async (request) => {
    // 1. Validation (Relaxed for Intent - allow unauthenticated)
    // We do NOT strictly check request.auth because a user might be anonymous when clicking "Agendar".

    const { metaEventId, eventName, leadData } = request.data;

    if (!metaEventId || !eventName) {
        logger.warn(`[MetaCAPI] Invalid intent request. Missing 'metaEventId' or 'eventName'.`);
        return { success: false, reason: "invalid_args" };
    }

    // Only allow specific intent events to prevent abuse
    const ALLOWED_INTENTS = ['Contact', 'ViewContent', 'InitiateCheckout'];
    if (!ALLOWED_INTENTS.includes(eventName)) {
        logger.warn(`[MetaCAPI] Blocked unknown event: ${eventName}`);
        return { success: false, reason: "event_not_allowed" };
    }

    logger.info(`[MetaCAPI] Received intent '${eventName}' (ID: ${metaEventId})`);

    // 2. Extract Data for Meta
    // Prioritize passed data, fallback to minimal
    // Note: For 'Contact', we might not have email/phone yet.
    const email = leadData?.email || leadData?.clienteDatos?.email;
    const phone = leadData?.telefono || leadData?.clienteDatos?.telefono;
    const firstName = leadData?.nombre || leadData?.clienteDatos?.nombre;
    const lastName = leadData?.apellido || leadData?.clienteDatos?.apellido;

    // 3. Execution
    const metaService = new MetaAdsService();

    try {
        await metaService.sendEvent({
            eventName: eventName,
            eventId: metaEventId,
            userData: {
                email: email,
                phone: phone,
                firstName: firstName,
                lastName: lastName,
                clientIp: request.rawRequest.ip || leadData?.clientIp, // V2 automatically provides header info via rawRequest usually, but safe to pass from client
                userAgent: request.rawRequest.headers['user-agent'] || leadData?.clientUserAgent,
                fbc: leadData?.fbc,
                fbp: leadData?.fbp,
                zipCode: leadData?.zipCode
            },
            eventSourceUrl: leadData?.urlOrigen,
            customData: {
                content_name: leadData?.nombreDesarrollo,
                content_category: 'Vivienda Nueva',
                ...leadData?.customData
            }
        });

        logger.info(`[MetaCAPI] Successfully processed intent '${eventName}' for ${metaEventId}`);
        return { success: true };

    } catch (err: any) {
        logger.error(`[MetaCAPI] Error processing intent ${metaEventId}:`, err);
        return { success: false, error: err.message };
    }
});
