import { NotificationPort } from "../../core/interfaces/NotificationPort";
import * as logger from "firebase-functions/logger";
import axios from "axios";

export class TelegramService implements NotificationPort {
    async sendAlert(message: string): Promise<void> {
        // In v1 functions with secrets: [] secrets are available in process.env
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!token || !chatId) {
            logger.error("❌ [TelegramService] Missing secrets in environment.", {
                hasToken: !!token,
                hasChatId: !!chatId
            });
            return;
        }

        try {
            logger.info(`📡 [TelegramService] Sending message to chat ${chatId.substring(0, 4)}...`);

            const url = `https://api.telegram.org/bot${token}/sendMessage`;
            const response = await axios.post(url, {
                chat_id: chatId,
                text: message,
                parse_mode: "Markdown"
            });

            if (response.status === 200) {
                logger.info("✅ [TelegramService] Message sent successfully.");
            } else {
                logger.error("⚠️ [TelegramService] Unexpected response status:", response.status);
            }
        } catch (error: any) {
            const apiError = error.response?.data;
            logger.error("❌ [TelegramService] Error sending notification:", {
                status: error.response?.status,
                data: apiError,
                message: error.message
            });
            // We log the payload that failed to help debugging
            logger.debug("Failed payload:", { message });
        }
    }
}
