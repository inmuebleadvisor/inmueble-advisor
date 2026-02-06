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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const logger = __importStar(require("firebase-functions/logger"));
const axios_1 = __importDefault(require("axios"));
class TelegramService {
    async sendAlert(message) {
        var _a, _b;
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
            const response = await axios_1.default.post(url, {
                chat_id: chatId,
                text: message,
                parse_mode: "Markdown"
            });
            if (response.status === 200) {
                logger.info("✅ [TelegramService] Message sent successfully.");
            }
            else {
                logger.error("⚠️ [TelegramService] Unexpected response status:", response.status);
            }
        }
        catch (error) {
            const apiError = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data;
            logger.error("❌ [TelegramService] Error sending notification:", {
                status: (_b = error.response) === null || _b === void 0 ? void 0 : _b.status,
                data: apiError,
                message: error.message
            });
            // We log the payload that failed to help debugging
            logger.debug("Failed payload:", { message });
        }
    }
}
exports.TelegramService = TelegramService;
//# sourceMappingURL=TelegramService.js.map