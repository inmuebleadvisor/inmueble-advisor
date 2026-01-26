import { doc, getDoc, collection, query, limit, getDocs, orderBy } from 'firebase/firestore';

/**
 * Repository for accessing Dashboard Analytics data from Firestore.
 */
export class DashboardRepository {
    constructor(db) {
        this.db = db;
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
            console.error("❌ [DashboardRepository] Failed to fetch stats:", error);
            throw error;
        }
    }

    /**
     * Retrieves stats for a specific historical timeline.
     * @param {number} days Number of days to look back
     * @returns {Promise<Array>} Array of stats objects
     */
    async getHistory(days = 7) {
        try {
            const q = query(
                collection(this.db, this.collectionName),
                orderBy('date', 'desc'),
                limit(days)
            );
            const snap = await getDocs(q);
            return snap.docs.map(d => d.data());
        } catch (error) {
            console.error("❌ [DashboardRepository] Failed to fetch history:", error);
            return [];
        }
    }
}
