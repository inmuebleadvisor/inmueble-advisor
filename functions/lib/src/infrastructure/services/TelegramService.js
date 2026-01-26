"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const params_1 = require("firebase-functions/params");
const telegramBotToken = (0, params_1.defineSecret)("TELEGRAM_BOT_TOKEN");
const telegramChatId = (0, params_1.defineSecret)("TELEGRAM_CHAT_ID");
class TelegramService {
    async sendAlert(message) {
        const token = telegramBotToken.value();
        const chatId = telegramChatId.value();
        if (!token || !chatId) {
            console.error("Missing Telegram configuration secrets.");
            return;
        }
        try {
            const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: "Markdown"
                })
            });
            if (!response.ok) {
                const error = await response.text();
                console.error("Failed to send Telegram message:", error);
                throw new Error(`Telegram API Error: ${response.statusText}`);
            }
        }
        catch (error) {
            console.error("Error sending Telegram notification:", error);
            // We don't throw here to avoid crashing the function if notification fails, 
            // but logging is essential.
        }
    }
}
exports.TelegramService = TelegramService;
//# sourceMappingURL=TelegramService.js.map