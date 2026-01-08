import { db } from '../firebase/config';
import { doc, getDoc, collection, query, limit, getDocs, orderBy } from 'firebase/firestore';

/**
 * Service for fetching Dashboard Analytics.
 * Follows Dependency Injection pattern.
 */
export class DashboardServiceImpl {
    constructor(firestoreDb) {
        this.db = firestoreDb;
        this.collectionName = 'dashboard_stats';
    }

    /**
     * Retrieves the latest generated dashboard stats.
     * @returns {Promise<Object|null>} Stats object or null if not ready
     */
    async getLatestStats() {
        try {
            // Try reading the convenience 'latest' doc
            const docRef = doc(this.db, this.collectionName, 'latest');
            const snap = await getDoc(docRef);

            if (snap.exists()) {
                return snap.data();
            }

            // Fallback: Query by date desc if 'latest' pointer missing
            const q = query(
                collection(this.db, this.collectionName),
                orderBy('date', 'desc'),
                limit(1)
            );
            const querySnap = await getDocs(q);

            if (!querySnap.empty) {
                return querySnap.docs[0].data();
            }

            return null;
        } catch (error) {
            console.error("❌ [DashboardService] Failed to fetch stats:", error);
            throw error;
        }
    }

    /**
     * Retrieves stats for a specific historical date (for charts).
     */
    async getDailyHistory(days = 7) {
        try {
            const q = query(
                collection(this.db, this.collectionName),
                orderBy('date', 'desc'),
                limit(days)
            );
            const snap = await getDocs(q);
            return snap.docs.map(d => d.data());
        } catch (error) {
            console.error("❌ [DashboardService] Failed to fetch history:", error);
            return [];
        }
    }
}

// Export singleton instance with injected dependency
export const DashboardService = new DashboardServiceImpl(db);
