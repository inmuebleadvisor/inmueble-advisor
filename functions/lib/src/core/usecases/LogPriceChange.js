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
exports.LogPriceChange = void 0;
const firestore_1 = require("firebase-admin/firestore");
const logger = __importStar(require("firebase-functions/logger"));
class LogPriceChange {
    constructor(repository) {
        this.repository = repository;
    }
    /**
     * Executes the logic to detect and log price changes.
     * @param before - Data before update
     * @param after - Data after update
     * @param modelId - ID of the model being updated
     */
    async execute(before, after, modelId) {
        var _a, _b, _c;
        if (!before || !after || !modelId) {
            return;
        }
        // 1. Extract Prices
        const oldPriceBase = (_a = before.precios) === null || _a === void 0 ? void 0 : _a.base;
        const newPriceBase = (_b = after.precios) === null || _b === void 0 ? void 0 : _b.base;
        const oldPriceNumeric = before.precioNumerico;
        const newPriceNumeric = after.precioNumerico;
        // 2. Compare
        const changes = [];
        let oldVal = 0;
        let newVal = 0;
        // Check precios.base (Source of Truth usually)
        if (oldPriceBase !== newPriceBase) {
            changes.push('precios.base');
            oldVal = Number(oldPriceBase) || 0;
            newVal = Number(newPriceBase) || 0;
        }
        // Fallback: Check precioNumerico (Index field) if base didn't change but this did (Correction?)
        else if (oldPriceNumeric !== newPriceNumeric) {
            changes.push('precioNumerico');
            oldVal = Number(oldPriceNumeric) || 0;
            newVal = Number(newPriceNumeric) || 0;
        }
        // 3. Logic: If no change, or change is negligible (floating point), skip
        if (changes.length === 0)
            return;
        if (Math.abs(oldVal - newVal) < 1.0)
            return; // Ignore cents diffs if strictly identical otherwise
        // 4. Construct Record
        const record = {
            modelId: modelId,
            developmentId: after.idDesarrollo || 'UNKNOWN',
            oldPrice: oldVal,
            newPrice: newVal,
            currency: ((_c = after.precios) === null || _c === void 0 ? void 0 : _c.moneda) || after.moneda || 'MXN',
            changedAt: firestore_1.FieldValue.serverTimestamp(),
            radius_of_change: changes,
            reason: 'manual_update' // Trigger doesn't know WHO did it without Context.auth, often SYSTEM or Admin.
        };
        // 5. Persist
        try {
            await this.repository.saveHistory(record);
            logger.info(`[PriceHistory] Logged change for ${modelId}: ${oldVal} -> ${newVal}`);
        }
        catch (error) {
            logger.error(`[PriceHistory] Failed to log change for ${modelId}:`, error);
        }
    }
}
exports.LogPriceChange = LogPriceChange;
//# sourceMappingURL=LogPriceChange.js.map