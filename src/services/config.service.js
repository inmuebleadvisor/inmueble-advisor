import { doc, getDoc, setDoc } from 'firebase/firestore';

const SETTINGS_DOC_ID = 'global_config';
const SETTINGS_COLLECTION = 'settings';

const DEFAULT_SETTINGS = {
    hideNoPhotosDevs: false,
    hideNoPhotosModels: false,
    hideNoPriceModels: false,
    hideEmptyDevs: false
};

/**
 * Service for managing Global Configuration (Platform Settings).
 * Stores settings in Firestore 'settings/global_config'.
 */
export class ConfigService {
    constructor(db) {
        this.db = db;
    }

    /**
     * Obtiene la configuración global de la plataforma.
     * Si no existe, devuelve los valores por defecto.
     */
    async getPlatformSettings() {
        try {
            const docRef = doc(this.db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { ...DEFAULT_SETTINGS, ...docSnap.data() };
            } else {
                return DEFAULT_SETTINGS;
            }
        } catch (error) {
            console.error("Error fetching platform settings:", error);
            return DEFAULT_SETTINGS;
        }
    }

    /**
     * Actualiza la configuración global.
     * @param {Object} newSettings - Objeto parcial o completo con los nuevos valores.
     */
    async updatePlatformSettings(newSettings) {
        try {
            const docRef = doc(this.db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
            await setDoc(docRef, newSettings, { merge: true });
            return { success: true };
        } catch (error) {
            console.error("Error updating platform settings:", error);
            return { success: false, error };
        }
    }
}

