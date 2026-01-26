/**
 * Service for fetching Dashboard Analytics.
 * Follows Dependency Injection pattern.
 */
export class DashboardServiceImpl {
    /**
     * @param {import('../repositories/dashboard.repository').DashboardRepository} dashboardRepository 
     */
    constructor(dashboardRepository) {
        this.dashboardRepository = dashboardRepository;
    }

    /**
     * Retrieves the latest generated dashboard stats.
     * @returns {Promise<Object|null>} Stats object or null if not ready
     */
    async getLatestStats() {
        return this.dashboardRepository.getLatestStats();
    }

    /**
     * Retrieves stats for a specific historical date (for charts).
     */
    async getDailyHistory(days = 7) {
        return this.dashboardRepository.getHistory(days);
    }
}
