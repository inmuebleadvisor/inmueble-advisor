# Documentación Técnica: Función `onLeadCreatedMETA`

## 1. Descripción General
La función `onLeadCreatedMETA` es una **Cloud Function de tipo Callable** (invocable directamente desde el cliente) diseñada con un propósito único y exclusivo: **Notificar a la API de Conversiones de Meta (CAPI)** cuando un usuario agenda una cita exitosamente.

A diferencia de su predecesora (`onLeadWrite`), esta función **NO** es reactiva. Solo se ejecuta cuando el Frontend la invoca explícitamente tras confirmar que el lead se ha guardado en la base de datos. Esto garantiza que el evento "Schedule" se envíe una sola vez, eliminando duplicados accidentales por actualizaciones de base de datos posteriores.

## 2. Activadores (Triggers)
*   **Tipo:** `onCall` (HTTPS Callable).
*   **Invocador:** Frontend (`LeadRepository.js` -> `createLead`).
*   **Momento:** Inmediatamente después de `addDoc` (creación del Lead en Firestore).

## 3. Lógica de Funcionamiento

### A. Validación
1.  **Autenticación:** Verifica que la llamada provenga de un usuario autenticado (`request.auth`).
2.  **Argumentos:** Exige la presencia de `leadId` y `leadData`.

### B. Extracción de Datos (Meta Quality)
La función implementa una lógica estricta para extraer y normalizar los datos del usuario antes de enviarlos a Meta, maximizando la calidad del emparejamiento (Event Match Quality):
*   **Emails/Teléfonos:** Busca en múltiples campos (`email`, `clienteDatos.email`, `correo`) por redundancia.
*   **Nombres:** Divide automáticamente el campo `nombre` si no existe un campo explícito `apellido`, alineándose con la lógica del Pixel.
*   **Identificadores:** Extrae `metaEventId` (clave para deduplicación), `fbp` y `fbc`.

### C. Ejecución (Caso de Uso)
Utiliza la arquitectura limpia del proyecto:
1.  Instancia `MetaAdsService`.
2.  Ejecuta el caso de uso `RegisterConversion` con el evento hardcodeado como **'Schedule'** y estatus **'scheduled'**.

## 4. Código Fuente Final

```typescript
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
```
