import * as functions from "firebase-functions/v1";
import * as logger from "firebase-functions/logger";
import { NotifyNewUser } from "../../core/usecases/NotifyNewUser";
import { TelegramService } from "../../infrastructure/services/TelegramService";

export const notifyNewUser = functions
    .runWith({ secrets: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"] })
    .auth.user()
    .onCreate(async (user) => {
        logger.info(`[AUTH_TRIGGER] Starting notification for UID: ${user.uid} (${user.email})`);
        try {
            const telegramService = new TelegramService();
            const useCase = new NotifyNewUser(telegramService);

            await useCase.execute({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName
            });

            logger.info(`[AUTH_TRIGGER] SUCCESS: Telegram alert sent for user: ${user.uid}`);
        } catch (error) {
            logger.error(`[AUTH_TRIGGER] ERROR for UID: ${user.uid}:`, error);
        }
    });
