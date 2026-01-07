import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardService } from '../../src/services/dashboard.service';
import * as firestore from 'firebase/firestore';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    doc: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    limit: vi.fn(),
    orderBy: vi.fn(),
    where: vi.fn()
}));

vi.mock('../../src/firebase/config', () => ({
    db: {}
}));

describe('DashboardService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getLatestStats', () => {
        it('should return data from "latest" doc if it exists', async () => {
            const mockData = { activeUsers: 100 };
            firestore.getDoc.mockResolvedValue({
                exists: () => true,
                data: () => mockData
            });

            const result = await DashboardService.getLatestStats();
            expect(result).toEqual(mockData);
            expect(firestore.doc).toHaveBeenCalledWith(expect.any(Object), 'dashboard_stats', 'latest');
        });

        it('should fallback to query if "latest" doc does not exist', async () => {
            firestore.getDoc.mockResolvedValue({ exists: () => false });

            const mockData = { activeUsers: 50, date: '2023-01-01' };
            firestore.getDocs.mockResolvedValue({
                empty: false,
                docs: [{ data: () => mockData }]
            });

            const result = await DashboardService.getLatestStats();
            expect(result).toEqual(mockData);
            expect(firestore.query).toHaveBeenCalled();
        });

        it('should return null if no data found', async () => {
            firestore.getDoc.mockResolvedValue({ exists: () => false });
            firestore.getDocs.mockResolvedValue({ empty: true });

            const result = await DashboardService.getLatestStats();
            expect(result).toBeNull();
        });
    });

    describe('getDailyHistory', () => {
        it('should return array of stats', async () => {
            const mockDocs = [
                { data: () => ({ users: 10 }) },
                { data: () => ({ users: 20 }) }
            ];
            firestore.getDocs.mockResolvedValue({ docs: mockDocs });

            const result = await DashboardService.getDailyHistory(7);
            expect(result).toHaveLength(2);
            expect(result[0].users).toBe(10);
            expect(firestore.limit).toHaveBeenCalledWith(7);
        });

        it('should return empty array on error', async () => {
            firestore.getDocs.mockRejectedValue(new Error('Firestore error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const result = await DashboardService.getDailyHistory();
            expect(result).toEqual([]);

            consoleSpy.mockRestore();
        });
    });
});
