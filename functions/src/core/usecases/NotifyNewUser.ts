import { NotificationPort } from "../interfaces/NotificationPort";
import { UserMessageBuilder } from "../services/UserMessageBuilder";

interface NewUserData {
    email?: string;
    uid: string;
    displayName?: string;
}

export class NotifyNewUser {
    constructor(private notificationPort: NotificationPort) { }

    async execute(user: NewUserData): Promise<void> {
        const message = UserMessageBuilder.formatMessage(user);
        await this.notificationPort.sendAlert(message);
    }
}
