import { NotificationPort } from "../interfaces/NotificationPort";

interface NewUserData {
    email?: string;
    uid: string;
    displayName?: string;
}

export class NotifyNewUser {
    constructor(private notificationPort: NotificationPort) { }

    async execute(user: NewUserData): Promise<void> {
        const identifier = user.displayName || user.email || "Usuario sin nombre";
        const message = `🚀 *Nuevo Usuario Registrado*\n\n👤 **Nombre:** ${identifier}\n📧 **Email:** ${user.email || "N/A"}\n🆔 **UID:** \`${user.uid}\`\n\n_Inmueble Advisor Admin_`;

        await this.notificationPort.sendAlert(message);
    }
}
