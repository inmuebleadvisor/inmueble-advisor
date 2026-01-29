"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateDashboardStats = void 0;
class GenerateDashboardStats {
    constructor(dashboardRepo) {
        this.dashboardRepo = dashboardRepo;
    }
    async execute(isHistorical = true) {
        console.log(`🚀 [UseCase] Starting Dashboard Stats Generation (Historical: ${isHistorical})...`);
        try {
            const stats = await this.dashboardRepo.generateDailyStats(isHistorical);
            await this.dashboardRepo.saveStats(stats);
            console.log("✅ [UseCase] Stats saved for date:", stats.date);
            return stats;
        }
        catch (error) {
            console.error("❌ [UseCase] Failed to generate stats:", error);
            throw error;
        }
    }
}
exports.GenerateDashboardStats = GenerateDashboardStats;
//# sourceMappingURL=GenerateDashboardStats.js.map