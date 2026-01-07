export interface NotificationPort {
    sendAlert(message: string): Promise<void>;
}
