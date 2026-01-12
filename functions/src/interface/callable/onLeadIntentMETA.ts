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
    const email = leadData?.email || leadData?.clienteDatos?.email || leadData?.correo;
    const phone = leadData?.telefono || leadData?.clienteDatos?.telefono || leadData?.celular;

    // Name Splitting Logic (Standardized)
    let firstName = leadData?.nombre || leadData?.clienteDatos?.nombre;
    let lastName = leadData?.apellido || leadData?.clienteDatos?.apellido;

    if (firstName && !lastName) {
        const parts = firstName.trim().split(' ');
        if (parts.length > 1) {
            firstName = parts[0];
            lastName = parts.slice(1).join(' ');
        }
    }

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
                clientIp: request.rawRequest.ip || leadData?.clientIp || leadData?.ip,
                userAgent: request.rawRequest.headers['user-agent'] || leadData?.clientUserAgent || leadData?.userAgent,
                fbc: leadData?.fbc || leadData?._fbc,
                fbp: leadData?.fbp || leadData?._fbp,
                zipCode: leadData?.zipCode
            },
            eventSourceUrl: leadData?.urlOrigen,
            customData: {
                content_name: leadData?.nombreDesarrollo,
                content_category: 'Vivienda Nueva',
                value: leadData?.value || 0,
                currency: leadData?.currency || 'MXN',
                ...leadData?.customData
            }
        });

        logger.info(`[MetaCAPI-ViewContent] Successfully processed intent '${eventName}' for ${metaEventId}`);
        return { success: true };

    } catch (err: any) {
        logger.error(`[MetaCAPI-ViewContent] Error processing intent ${metaEventId}:`, err);
        return { success: false, error: err.message };
    }
});
