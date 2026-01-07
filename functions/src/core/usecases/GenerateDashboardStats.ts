import { DashboardRepository } from "../entities/DashboardStats";

export class GenerateDashboardStats {
    constructor(private dashboardRepo: DashboardRepository) { }

    async execute() {
        console.log("🚀 [UseCase] Starting Daily Dashboard Stats Generation...");

        try {
            const stats = await this.dashboardRepo.generateDailyStats();
            await this.dashboardRepo.saveStats(stats);
            console.log("✅ [UseCase] Stats saved for date:", stats.date);
            return stats;
        } catch (error) {
            console.error("❌ [UseCase] Failed to generate stats:", error);
            throw error;
        }
    }
}
