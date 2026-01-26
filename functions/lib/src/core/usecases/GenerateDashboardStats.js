"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateDashboardStats = void 0;
class GenerateDashboardStats {
    constructor(dashboardRepo) {
        this.dashboardRepo = dashboardRepo;
    }
    async execute() {
        console.log("🚀 [UseCase] Starting Daily Dashboard Stats Generation...");
        try {
            const stats = await this.dashboardRepo.generateDailyStats();
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