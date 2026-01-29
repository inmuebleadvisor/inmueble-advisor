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
exports.notifyNewUser = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const logger = __importStar(require("firebase-functions/logger"));
const NotifyNewUser_1 = require("../../core/usecases/NotifyNewUser");
const TelegramService_1 = require("../../infrastructure/services/TelegramService");
exports.notifyNewUser = functions
    .runWith({ secrets: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"] })
    .auth.user()
    .onCreate(async (user) => {
    logger.info(`Processing new user trigger for UID: ${user.uid}`);
    try {
        const telegramService = new TelegramService_1.TelegramService();
        const useCase = new NotifyNewUser_1.NotifyNewUser(telegramService);
        await useCase.execute({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
        });
        logger.info(`Notification sent successfully for user: ${user.uid}`);
    }
    catch (error) {
        logger.error(`Error in notifyNewUser trigger for UID: ${user.uid}:`, error);
    }
});
//# sourceMappingURL=onUserCreated.js.map