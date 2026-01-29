"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onLeadCreated = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const logger = __importStar(require("firebase-functions/logger"));
const NotifyNewLead_1 = require("../../core/usecases/NotifyNewLead");
const TelegramService_1 = require("../../infrastructure/services/TelegramService");
const FirebaseUserRepository_1 = require("../../infrastructure/repositories/FirebaseUserRepository");
const FirebaseLeadRepository_1 = require("../../infrastructure/repositories/FirebaseLeadRepository");
exports.onLeadCreated = functions
    .runWith({ secrets: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"] })
    .firestore
    .document("leads/{leadId}")
    .onCreate(async (snapshot, context) => {
    const leadId = context.params.leadId;
    logger.info(`[LEAD_TRIGGER] New lead detected: ${leadId}`);
    try {
        const leadData = snapshot.data();
        if (!leadData) {
            logger.warn("onLeadCreated triggered with no data");
            return;
        }
        const telegramService = new TelegramService_1.TelegramService();
        const userRepo = new FirebaseUserRepository_1.FirebaseUserRepository();
        const leadRepo = new FirebaseLeadRepository_1.FirebaseLeadRepository();
        const useCase = new NotifyNewLead_1.NotifyNewLead(telegramService, userRepo, leadRepo);
        await useCase.execute(Object.assign({ id: leadId }, leadData));
    }
    catch (error) {
        logger.error("Error in onLeadCreated trigger:", error);
    }
});
//# sourceMappingURL=onLeadCreated.js.map