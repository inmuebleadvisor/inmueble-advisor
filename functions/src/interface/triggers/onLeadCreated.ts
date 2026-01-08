import * as functions from "firebase-functions/v1";
import * as logger from "firebase-functions/logger";
import { NotifyNewLead } from "../../core/usecases/NotifyNewLead";
import { TelegramService } from "../../infrastructure/services/TelegramService";
import { FirebaseUserRepository } from "../../infrastructure/repositories/FirebaseUserRepository";
import { FirebaseLeadRepository } from "../../infrastructure/repositories/FirebaseLeadRepository";

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
            const userRepo = new FirebaseUserRepository();
            const leadRepo = new FirebaseLeadRepository();

            const useCase = new NotifyNewLead(telegramService, userRepo, leadRepo);

            // Meta CAPI logic moved to onLeadWrite to Centralize Schedule event handling and avoid duplication.

            await useCase.execute({
                id: leadId,
                ...leadData
            } as any);

            logger.info(`Notification sent for lead: ${leadId}`);
        } catch (error) {
            logger.error("Error in onLeadCreated trigger:", error);
        }
    });
