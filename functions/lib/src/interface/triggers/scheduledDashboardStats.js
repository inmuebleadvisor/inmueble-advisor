"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerDashboardStats = exports.scheduledDashboardStats = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const GenerateDashboardStats_1 = require("../../core/usecases/GenerateDashboardStats");
const BigQueryDashboardRepository_1 = require("../../infrastructure/repositories/BigQueryDashboardRepository");
/**
 * Scheduled Function: Runs every day at 00:00 (Midnight).
 * Calculates daily dashboard metrics via BigQuery and saves to Firestore.
 */
exports.scheduledDashboardStats = (0, scheduler_1.onSchedule)("every day 00:01", async (event) => {
    console.log("Starting scheduled dashboard generation...");
    const repo = new BigQueryDashboardRepository_1.BigQueryDashboardRepository();
    const useCase = new GenerateDashboardStats_1.GenerateDashboardStats(repo);
    await useCase.execute(true); // Always historical for schedule
    console.log("Dashboard generation complete.");
});
/**
 * HTTP Callable for manual testing/triggering from Admin Panel.
 */
exports.triggerDashboardStats = (0, https_1.onCall)(async (request) => {
    // Security: Check if user is admin (optional but recommended)
    // if (!request.auth || !request.auth.token.admin) ...
    const repo = new BigQueryDashboardRepository_1.BigQueryDashboardRepository();
    const useCase = new GenerateDashboardStats_1.GenerateDashboardStats(repo);
    const stats = await useCase.execute(false); // Real-time when triggered manually
    return { success: true, stats };
});
//# sourceMappingURL=scheduledDashboardStats.js.map