import { BaseMessageBuilder } from "./BaseMessageBuilder";

/**
 * Builder for User-related Telegram messages.
 */
export class UserMessageBuilder {
    /**
     * Formats a notification message for a new user.
     * @param user - { uid, email, displayName }
     */
    static formatMessage(user: { uid: string, email?: string, displayName?: string }): string {
        const name = user.displayName || "Usuario sin nombre";
        const email = user.email || "No especificado";

        // --- BUILD MESSAGE ---
        let mensaje = `🚀 *Nuevo Usuario Registrado*\n\n`;

        mensaje += `👤 *Nombre:* ${BaseMessageBuilder.escapeMarkdown(name)}\n`;
        mensaje += `📧 *Email:* ${BaseMessageBuilder.escapeMarkdown(email)}\n`;
        mensaje += `🆔 *UID:* \`${user.uid}\`\n\n`;

        mensaje += BaseMessageBuilder.getFooter();

        return mensaje;
    }
}
