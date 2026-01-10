import { onCall } from "firebase-functions/v2/https";
import * as functions from "firebase-functions/v1"; // ✅ Import v1 for HttpsError compatibility or use v2 equivalent
import * as logger from "firebase-functions/logger";
import { MetaAdsService } from "../../infrastructure/services/MetaAdsService";
import { RegisterConversion } from "../../core/usecases/RegisterConversion";

/**
 * Callable: onLeadCreatedMETA
 * Description: Explicitly triggered by the Frontend after a successful lead creation.
 * Responsibilities:
 * 1. Validates the lead payload.
 * 2. Sends the 'Schedule' event to Meta CAPI using the standardized RegisterConversion use case.
 * 
 * @param request { leadId: string, leadData: any }
 */
export const onLeadCreatedMETA = onCall(async (request) => {
    // 1. Validation
    if (!request.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }

    const { leadId, leadData } = request.data;

    if (!leadId || !leadData) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'The function must be called with "leadId" and "leadData" arguments.'
        );
    }

    logger.info(`[MetaCAPI] Received explicit notification for Lead ${leadId}`);

    // 2. Extract Data for Meta
    // STRICT EXTRACTION for Meta Quality (em, ph, fn, ln)
    // Priority: Root fields -> clienteDatos -> known aliases
    const email = leadData.email || leadData.clienteDatos?.email || leadData.correo;
    const phone = leadData.telefono || leadData.clienteDatos?.telefono || leadData.celular;

    // Name Splitting Logic (Parity with previous onLeadWrite)
    let firstName = leadData.nombre || leadData.clienteDatos?.nombre;
    let lastName = leadData.apellido || leadData.clienteDatos?.apellido || leadData.apellidos;

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
    const metaService = new MetaAdsService();
    const registerConversion = new RegisterConversion(metaService);

    try {
        await registerConversion.execute({
            leadId: leadId,
            email: email,
            phone: phone,
            firstName: firstName,
            lastName: lastName,
            clientIp: leadData.clientIp || leadData.ip,
            userAgent: leadData.clientUserAgent || leadData.userAgent,
            fbc: leadData.fbc || leadData._fbc,
            fbp: leadData.fbp || leadData._fbp,
            zipCode: leadData.zipCode || leadData.codigoPostal,
            eventName: 'Schedule', // Hardcoded as this is strictly for New Appointments
            eventId: eventId,
            eventSourceUrl: eventSourceUrl,
            conversionValue: leadData.snapshot?.precioAtCapture || 0,
            contentName: leadData.nombreDesarrollo || 'Cita Inmueble Advisor',
            status: 'scheduled' // Default for creation
        });

        logger.info(`[MetaCAPI] Successfully processed event for ${leadId}`);
        return { success: true };

    } catch (err: any) {
        logger.error(`[MetaCAPI] Error processing ${leadId}:`, err);
        // We do not throw error to client to avoid disrupting their flow, just log it.
        return { success: false, error: err.message };
    }
});
