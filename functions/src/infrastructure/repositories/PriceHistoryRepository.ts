import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface PriceHistoryRecord {
    modelId: string;
    developmentId: string;
    oldPrice: number;
    newPrice: number;
    currency: string;
    changedAt: FieldValue;
    radius_of_change: string[];
    reason: string;
}

export class PriceHistoryRepository {
    private db: admin.firestore.Firestore;

    constructor() {
        this.db = admin.firestore();
    }

    /**
     * Saves a new price history record to the subcollection.
     * Path: modelos/{modelId}/bigquery-price-history/{autoId}
     */
    async saveHistory(record: PriceHistoryRecord): Promise<string> {
        const { modelId, ...data } = record;

        // Safety check
        if (!modelId) {
            throw new Error("PriceHistoryRepository: modelId is required.");
        }

        const collectionPath = `modelos/${modelId}/bigquery-price-history`;

        // We include modelId in the document body as well (Wildcard requirement)
        const docData = {
            modelId,
            ...data
        };

        const docRef = await this.db.collection(collectionPath).add(docData);
        return docRef.id;
    }
}
