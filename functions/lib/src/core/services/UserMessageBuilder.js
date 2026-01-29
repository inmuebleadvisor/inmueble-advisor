"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMessageBuilder = void 0;
/**
 * Builder for User-related Telegram messages.
 * Reproduces the pattern of LeadMessageBuilder to ensure consistency.
 */
class UserMessageBuilder {
    /**
     * Formats a notification message for a new user.
     * @param user - { uid, email, displayName }
     */
    static formatMessage(user) {
        // --- HELPERS ---
        const escape = (text) => {
            if (!text)
                return 'N/A';
            // Escapes characters that break Telegram Markdown V1
            return text.replace(/[_*`[\]()]/g, '\\$&');
        };
        const name = user.displayName || "Usuario sin nombre";
        const email = user.email || "No especificado";
        // --- BUILD MESSAGE ---
        let mensaje = `🚀 *Nuevo Usuario Registrado*\n\n`;
        mensaje += `👤 **Nombre:** ${escape(name)}\n`;
        mensaje += `📧 **Email:** ${escape(email)}\n`;
        mensaje += `🆔 **UID:** \`${user.uid}\`\n\n`;
        mensaje += `_Inmueble Advisor Admin_`;
        return mensaje;
    }
}
exports.UserMessageBuilder = UserMessageBuilder;
//# sourceMappingURL=UserMessageBuilder.js.map