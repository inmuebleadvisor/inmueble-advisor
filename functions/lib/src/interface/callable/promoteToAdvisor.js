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
exports.promoteToAdvisor = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const FirebaseUserRepository_1 = require("../../infrastructure/repositories/FirebaseUserRepository");
const PromoteUserUseCase_1 = require("../../core/usecases/PromoteUserUseCase");
const userRepository = new FirebaseUserRepository_1.FirebaseUserRepository();
const promoteUserUseCase = new PromoteUserUseCase_1.PromoteUserUseCase(userRepository);
exports.promoteToAdvisor = functions.https.onCall(async (data, context) => {
    // 1. Auth Guard
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const requesterUid = context.auth.uid;
    const targetUid = data.uid || requesterUid; // Support both self and admin-led
    // 2. Execute Use Case
    try {
        await promoteUserUseCase.execute(targetUid, requesterUid);
        return { success: true, message: `User ${targetUid} promoted successfully` };
    }
    catch (error) {
        console.error("Error promoting user:", error);
        const message = error instanceof Error ? error.message : 'Unable to promote user';
        throw new functions.https.HttpsError('internal', message);
    }
});
//# sourceMappingURL=promoteToAdvisor.js.map