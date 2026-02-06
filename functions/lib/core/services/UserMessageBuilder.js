"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMessageBuilder = void 0;
const BaseMessageBuilder_1 = require("./BaseMessageBuilder");
/**
 * Builder for User-related Telegram messages.
 */
class UserMessageBuilder {
    /**
     * Formats a notification message for a new user.
     * @param user - { uid, email, displayName }
     */
    static formatMessage(user) {
        const name = user.displayName || "Usuario sin nombre";
        const email = user.email || "No especificado";
        // --- BUILD MESSAGE ---
        let mensaje = `🚀 *Nuevo Usuario Registrado*\n\n`;
        mensaje += `👤 *Nombre:* ${BaseMessageBuilder_1.BaseMessageBuilder.escapeMarkdown(name)}\n`;
        mensaje += `📧 *Email:* ${BaseMessageBuilder_1.BaseMessageBuilder.escapeMarkdown(email)}\n`;
        mensaje += `🆔 *UID:* \`${user.uid}\`\n\n`;
        mensaje += BaseMessageBuilder_1.BaseMessageBuilder.getFooter();
        return mensaje;
    }
}
exports.UserMessageBuilder = UserMessageBuilder;
//# sourceMappingURL=UserMessageBuilder.js.map