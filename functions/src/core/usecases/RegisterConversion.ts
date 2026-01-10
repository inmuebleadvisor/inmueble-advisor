import { TrackingService, TrackingEvent, TrackingUserData } from "../interfaces/TrackingService";

interface ConversionInput {
    leadId: string;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    clientIp?: string;
    userAgent?: string;
    fbc?: string;
    fbp?: string;
    zipCode?: string;
    eventName: string;
    eventId: string;
    eventSourceUrl?: string;
    conversionValue?: number;
    currency?: string;
    contentName?: string;
    status?: string; // ✅ New Param
}

export class RegisterConversion {
    constructor(private trackingService: TrackingService) { }

    async execute(input: ConversionInput): Promise<void> {
        // Validate critical fields
        if (!input.eventId) {
            console.error(`[RegisterConversion] Missing eventId for lead ${input.leadId}`);
            return;
        }

        const userData: TrackingUserData = {
            email: input.email,
            phone: input.phone,
            firstName: input.firstName,
            lastName: input.lastName,
            clientIp: input.clientIp,
            userAgent: input.userAgent,
            fbc: input.fbc,
            fbp: input.fbp,
            zipCode: input.zipCode
        };

        const event: TrackingEvent = {
            eventName: input.eventName,
            userData: userData,
            eventId: input.eventId,
            eventSourceUrl: input.eventSourceUrl,
            customData: {
                content_name: input.contentName || 'Conversion', // ✅ Fix Typo
                currency: input.currency || 'MXN',
                value: input.conversionValue || 0,
                status: input.status || 'scheduled', // ✅ Dynamic Status
                content_category: 'Vivienda Nueva'
            }
        };

        await this.trackingService.sendEvent(event);
    }
}
