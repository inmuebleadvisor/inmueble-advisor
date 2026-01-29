import * as functions from "firebase-functions/v1";
import * as logger from "firebase-functions/logger";
import { NotifyNewUser } from "../../core/usecases/NotifyNewUser";
import { TelegramService } from "../../infrastructure/services/TelegramService";

export const notifyNewUser = functions
    .runWith({ secrets: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"] })
    .auth.user()
    .onCreate(async (user) => {
        logger.info(`Processing new user trigger for UID: ${user.uid}`);
        try {
            const telegramService = new TelegramService();
            const useCase = new NotifyNewUser(telegramService);

            await useCase.execute({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName
            });

            logger.info(`Notification sent successfully for user: ${user.uid}`);
        } catch (error) {
            logger.error(`Error in notifyNewUser trigger for UID: ${user.uid}:`, error);
        }
    });
