import * as functions from "firebase-functions/v1";
import * as logger from "firebase-functions/logger";
import { NotifyNewLead } from "../../core/usecases/NotifyNewLead";
import { TelegramService } from "../../infrastructure/services/TelegramService";

export const onLeadCreated = functions
    .runWith({ secrets: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"] })
    .firestore
    .document("leads/{leadId}")
    .onCreate(async (snapshot, context) => {
        try {
            const leadData = snapshot.data();
            const leadId = context.params.leadId;

            if (!leadData) {
                logger.warn("onLeadCreated triggered with no data");
                return;
            }

            const telegramService = new TelegramService();
            const useCase = new NotifyNewLead(telegramService);

            await useCase.execute({
                id: leadId,
                ...leadData
            });

            logger.info(`Notification sent for lead: ${leadId}`);
        } catch (error) {
            logger.error("Error in onLeadCreated trigger:", error);
        }
    });
