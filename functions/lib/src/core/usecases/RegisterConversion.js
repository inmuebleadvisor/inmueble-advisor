"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterConversion = void 0;
class RegisterConversion {
    constructor(trackingService) {
        this.trackingService = trackingService;
    }
    async execute(input) {
        // Validate critical fields
        if (!input.eventId) {
            console.error(`[RegisterConversion] Missing eventId for lead ${input.leadId}`);
            return;
        }
        const userData = {
            email: input.email,
            phone: input.phone,
            firstName: input.firstName,
            lastName: input.lastName,
            clientIp: input.clientIp,
            userAgent: input.userAgent,
            fbc: input.fbc,
            fbp: input.fbp,
            zipCode: input.zipCode,
            external_id: input.external_id // ✅ Map it
        };
        const event = {
            eventName: input.eventName,
            userData: userData,
            eventId: input.eventId,
            eventSourceUrl: input.eventSourceUrl,
            customData: {
                content_name: input.contentName || 'Conversion',
                currency: input.currency || 'MXN',
                value: input.conversionValue || 0,
                status: input.status || 'scheduled',
                content_category: 'Vivienda Nueva'
            }
        };
        await this.trackingService.sendEvent(event);
    }
}
exports.RegisterConversion = RegisterConversion;
//# sourceMappingURL=RegisterConversion.js.map