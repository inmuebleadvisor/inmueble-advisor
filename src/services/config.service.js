const DEFAULT_SETTINGS = {
    hideNoPhotosDevs: false,
    hideNoPhotosModels: false,
    hideNoPriceModels: false,
    hideEmptyDevs: false
};

/**
 * Service for managing Global Configuration (Platform Settings).
 * Follows Dependency Injection pattern.
 */
export class ConfigService {
    /**
     * @param {import('../repositories/config.repository').ConfigRepository} configRepository 
     */
    constructor(configRepository) {
        this.configRepository = configRepository;
    }

    /**
     * Obtiene la configuración global de la plataforma.
     * Si no existe, devuelve los valores por defecto.
     */
    async getPlatformSettings() {
        try {
            const data = await this.configRepository.getSettings();

            if (data) {
                return { ...DEFAULT_SETTINGS, ...data };
            } else {
                return DEFAULT_SETTINGS;
            }
        } catch (error) {
            console.error("Error fetching platform settings (Service):", error);
            // Fallback to defaults on error to keep app running
            return DEFAULT_SETTINGS;
        }
    }

    /**
     * Actualiza la configuración global.
     * @param {Object} newSettings - Objeto parcial o completo con los nuevos valores.
     */
    async updatePlatformSettings(newSettings) {
        try {
            await this.configRepository.updateSettings(newSettings);
            return { success: true };
        } catch (error) {
            console.error("Error updating platform settings (Service):", error);
            return { success: false, error };
        }
    }
}

