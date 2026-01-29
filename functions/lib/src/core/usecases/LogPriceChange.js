"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogPriceChange = void 0;
const firestore_1 = require("firebase-admin/firestore");
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
            console.log(`[PriceHistory] Logged change for ${modelId}: ${oldVal} -> ${newVal}`);
        }
        catch (error) {
            console.error(`[PriceHistory] Failed to log change for ${modelId}:`, error);
        }
    }
}
exports.LogPriceChange = LogPriceChange;
//# sourceMappingURL=LogPriceChange.js.map