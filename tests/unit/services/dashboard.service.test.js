
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardServiceImpl } from '../../../src/services/dashboard.service';

describe('DashboardService', () => {
    let dashboardService;
    let mockRepo;

    beforeEach(() => {
        mockRepo = { getLatestStats: vi.fn(), getHistory: vi.fn() };
        dashboardService = new DashboardServiceImpl(mockRepo);
    });

    it('should fetch daily stats', async () => {
        const mockStats = { visitors: 100 };
        mockRepo.getLatestStats.mockResolvedValue(mockStats);

        const result = await dashboardService.getLatestStats();
        expect(result).toEqual(mockStats);
    });

    it('should fetch historical stats', async () => {
        const mockHistory = [{ date: '2023-01-01', visitors: 50 }];
        mockRepo.getHistory.mockResolvedValue(mockHistory);

        const result = await dashboardService.getDailyHistory(7);
        expect(result).toHaveLength(1);
        expect(mockRepo.getHistory).toHaveBeenCalledWith(7);
    });
});
