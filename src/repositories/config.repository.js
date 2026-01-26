import { doc, getDoc, setDoc } from 'firebase/firestore';

const SETTINGS_DOC_ID = 'global_config';
const SETTINGS_COLLECTION = 'settings';

/**
 * Repository for accessing Platform Configuration from Firestore.
 */
export class ConfigRepository {
    constructor(db) {
        this.db = db;
    }

    /**
     * Gets the raw configuration document.
     * @returns {Promise<Object|null>} The config data or null if not exists.
     */
    async getSettings() {
        try {
            const docRef = doc(this.db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data();
            }
            return null;
        } catch (error) {
            console.error("Error fetching platform settings (Repo):", error);
            throw error; // Re-throw to let Service handle defaults or logging
        }
    }

    /**
     * Updates the configuration.
     * @param {Object} data 
     * @returns {Promise<void>}
     */
    async updateSettings(data) {
        try {
            const docRef = doc(this.db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
            await setDoc(docRef, data, { merge: true });
        } catch (error) {
            console.error("Error updating platform settings (Repo):", error);
            throw error;
        }
    }
}
