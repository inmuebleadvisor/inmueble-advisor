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
exports.onModelUpdate = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const LogPriceChange_1 = require("../../core/usecases/LogPriceChange");
const PriceHistoryRepository_1 = require("../../infrastructure/repositories/PriceHistoryRepository");
/**
 * Trigger: onModelUpdate
 * Listens for updates in the 'modelos' collection to detect price changes.
 */
exports.onModelUpdate = functions.firestore
    .document("modelos/{modelId}")
    .onUpdate(async (change, context) => {
    const modelId = context.params.modelId;
    const before = change.before.data();
    const after = change.after.data();
    // Hexagonal Wiring
    const repo = new PriceHistoryRepository_1.PriceHistoryRepository();
    const useCase = new LogPriceChange_1.LogPriceChange(repo);
    await useCase.execute(before, after, modelId);
});
//# sourceMappingURL=onModelUpdate.js.map