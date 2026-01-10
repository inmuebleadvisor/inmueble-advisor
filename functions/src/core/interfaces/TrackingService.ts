export interface TrackingUserData {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    zipCode?: string;
    clientIp?: string;
    userAgent?: string;
    fbc?: string;
    fbp?: string;
}

export interface TrackingEvent {
    eventName: string;
    userData: TrackingUserData;
    customData?: Record<string, any>;
    eventId: string;
    eventSourceUrl?: string;
}

export interface TrackingService {
    sendEvent(event: TrackingEvent): Promise<void>;
}
