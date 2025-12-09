import { db } from '../firebase/config';
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
 * Obtiene la configuración global de la plataforma.
 * Si no existe, devuelve los valores por defecto.
 */
export const getPlatformSettings = async () => {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { ...DEFAULT_SETTINGS, ...docSnap.data() };
        } else {
            // Si no existe, creamos el doc por defecto para la próxima vez
            // (Opcional: podemos no crearlo y solo retornar defaults)
            return DEFAULT_SETTINGS;
        }
    } catch (error) {
        console.error("Error fetching platform settings:", error);
        return DEFAULT_SETTINGS;
    }
};

/**
 * Actualiza la configuración global.
 * @param {Object} newSettings - Objeto parcial o completo con los nuevos valores.
 */
export const updatePlatformSettings = async (newSettings) => {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        await setDoc(docRef, newSettings, { merge: true });
        return { success: true };
    } catch (error) {
        console.error("Error updating platform settings:", error);
        return { success: false, error };
    }
};
