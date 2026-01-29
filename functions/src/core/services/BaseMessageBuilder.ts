
/**
 * Base class for message building utilities.
 * Follows DRY principle for Telegram message formatting.
 */
export class BaseMessageBuilder {
    /**
     * Escapes characters that break Telegram Markdown V1.
     */
    static escapeMarkdown(text: string | undefined): string {
        if (!text) return 'N/A';
        return text.replace(/[_*`[\]()]/g, '\\$&');
    }

    /**
     * Formats currency in MXN.
     */
    static fmtMoney(amount: any): string {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            maximumFractionDigits: 0
        }).format(Number(amount));
    }

    /**
     * Formats Firestore timestamp or generic date string to locale date.
     */
    static fmtDate(timestamp: any): string {
        if (!timestamp) return 'Por confirmar';
        let date;
        if (timestamp.toDate) {
            date = timestamp.toDate();
        } else if (timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else {
            date = new Date(timestamp);
        }
        return date.toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            timeZone: 'America/Mexico_City'
        });
    }

    /**
     * Common footer for all admin notifications.
     */
    static getFooter(): string {
        return `_Inmueble Advisor Admin_`;
    }
}
