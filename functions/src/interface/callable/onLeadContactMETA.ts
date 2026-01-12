import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { MetaAdsService } from "../../infrastructure/services/MetaAdsService";
import { extractClientIp } from "../../core/utils/ipUtils";

/**
 * Callable: onLeadContactMETA
 * Description: Explicitly triggered by the Frontend when a user initiates contact (e.g., clicking "Agendar").
 * Responsibilities:
 * 1. Validates the request (must contain 'Contact' intent).
 * 2. Sends the 'Contact' event to Meta CAPI.
 * 
 * @param request { metaEventId, leadData: { ... } }
 */
export const onLeadContactMETA = onCall({ cors: true }, async (request) => {

    const { metaEventId, leadData } = request.data;
    const eventName = 'Contact';

    if (!metaEventId) {
        logger.warn(`[MetaCAPI-Contact] Invalid request. Missing 'metaEventId'.`);
        return { success: false, reason: "invalid_args" };
    }

    logger.info(`[MetaCAPI-Contact] Received '${eventName}' (ID: ${metaEventId})`);

    // Extract Data for Meta (Robust Fallbacks)
    // Note: For 'Contact', we might not have email/phone yet unless user is logged in.
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

    // Execution
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
                clientIp: extractClientIp(request, leadData),
                userAgent: request.rawRequest.headers['user-agent'] || leadData?.clientUserAgent || leadData?.userAgent,
                fbc: leadData?.fbc || leadData?._fbc,
                fbp: leadData?.fbp || leadData?._fbp,
                zipCode: leadData?.zipCode
            },
            eventSourceUrl: leadData?.urlOrigen,
            customData: {
                content_name: leadData?.nombreDesarrollo,
                content_category: 'Vivienda Nueva',
                ...leadData?.customData
            }
        });

        logger.info(`[MetaCAPI-Contact] Successfully processed '${eventName}' for ${metaEventId}`);
        return { success: true };

    } catch (err: any) {
        logger.error(`[MetaCAPI-Contact] Error processing ${metaEventId}:`, err);
        return { success: false, error: err.message };
    }
});
