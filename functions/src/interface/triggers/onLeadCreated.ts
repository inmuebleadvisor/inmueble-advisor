import * as functions from "firebase-functions/v1";
import * as logger from "firebase-functions/logger";
import { NotifyNewLead } from "../../core/usecases/NotifyNewLead";
import { TelegramService } from "../../infrastructure/services/TelegramService";
import { FirebaseUserRepository } from "../../infrastructure/repositories/FirebaseUserRepository";
import { FirebaseLeadRepository } from "../../infrastructure/repositories/FirebaseLeadRepository";
import { MetaAdsService } from "../../infrastructure/services/MetaAdsService";

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
            const metaService = new MetaAdsService();

            const useCase = new NotifyNewLead(telegramService, userRepo, leadRepo);

            // 1. Send CAPI Event (Contact) - Non-blocking preferred but await is safer for Cloud Functions lifecycle
            if (leadData.metaEventId) {
                try {
                    await metaService.sendEvent(
                        'Contact',
                        leadData.metaEventId,
                        {
                            em: leadData.email,
                            ph: leadData.telefono,
                            fn: leadData.nombre,
                            ln: leadData.apellido,
                            client_user_agent: leadData.clientUserAgent,
                            fbp: leadData.fbp,
                            fbc: leadData.fbc,
                            external_id: leadData.uid
                        },
                        {
                            content_name: leadData.idDesarrollo || 'Lead Gen',
                            content_category: 'Housing',
                            value: 0,
                            currency: 'MXN'
                        }
                    );
                } catch (metaError) {
                    logger.error("Failed to send Meta CAPI event:", metaError);
                    // Don't fail the main trigger
                }
            }

            await useCase.execute({
                id: leadId,
                ...leadData
            } as any);

            logger.info(`Notification sent for lead: ${leadId}`);
        } catch (error) {
            logger.error("Error in onLeadCreated trigger:", error);
        }
    });
