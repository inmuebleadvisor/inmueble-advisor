import * as functions from "firebase-functions/v1";
import { LogPriceChange } from "../../core/usecases/LogPriceChange";
import { PriceHistoryRepository } from "../../infrastructure/repositories/PriceHistoryRepository";

/**
 * Trigger: onModelUpdate
 * Listens for updates in the 'modelos' collection to detect price changes.
 */
export const onModelUpdate = functions.firestore
    .document("modelos/{modelId}")
    .onUpdate(async (change, context) => {
        const modelId = context.params.modelId;
        const before = change.before.data();
        const after = change.after.data();

        // Hexagonal Wiring
        const repo = new PriceHistoryRepository();
        const useCase = new LogPriceChange(repo);

        await useCase.execute(before, after, modelId);
    });
