"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotifyNewUser = void 0;
class NotifyNewUser {
    constructor(notificationPort) {
        this.notificationPort = notificationPort;
    }
    async execute(user) {
        const identifier = user.displayName || user.email || "Usuario sin nombre";
        const message = `🚀 *Nuevo Usuario Registrado*\n\n👤 **Nombre:** ${identifier}\n📧 **Email:** ${user.email || "N/A"}\n🆔 **UID:** \`${user.uid}\`\n\n_Inmueble Advisor Admin_`;
        await this.notificationPort.sendAlert(message);
    }
}
exports.NotifyNewUser = NotifyNewUser;
//# sourceMappingURL=NotifyNewUser.js.map