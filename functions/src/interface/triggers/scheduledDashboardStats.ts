import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall } from 'firebase-functions/v2/https';
import { GenerateDashboardStats } from '../../core/usecases/GenerateDashboardStats';
import { BigQueryDashboardRepository } from '../../infrastructure/repositories/BigQueryDashboardRepository';

/**
 * Scheduled Function: Runs every day at 00:00 (Midnight).
 * Calculates daily dashboard metrics via BigQuery and saves to Firestore.
 */
export const scheduledDashboardStats = onSchedule("every day 00:00", async (event) => {
    console.log("Starting scheduled dashboard generation...");
    const repo = new BigQueryDashboardRepository();
    const useCase = new GenerateDashboardStats(repo);

    await useCase.execute();
    console.log("Dashboard generation complete.");
});

/**
 * HTTP Callable for manual testing/triggering from Admin Panel.
 */
export const triggerDashboardStats = onCall(async (request) => {
    // Security: Check if user is admin (optional but recommended)
    // if (!request.auth || !request.auth.token.admin) ...

    const repo = new BigQueryDashboardRepository();
    const useCase = new GenerateDashboardStats(repo);

    const stats = await useCase.execute();
    return { success: true, stats };
});

