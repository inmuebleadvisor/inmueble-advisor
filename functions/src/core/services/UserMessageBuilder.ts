
/**
 * Builder for User-related Telegram messages.
 * Reproduces the pattern of LeadMessageBuilder to ensure consistency.
 */
export class UserMessageBuilder {
    /**
     * Formats a notification message for a new user.
     * @param user - { uid, email, displayName }
     */
    static formatMessage(user: { uid: string, email?: string, displayName?: string }): string {
        // --- HELPERS ---
        const escape = (text: string | undefined) => {
            if (!text) return 'N/A';
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
