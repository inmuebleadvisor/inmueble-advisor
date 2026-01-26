
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminService } from '../../../src/services/admin.service';

describe('AdminService', () => {
    let adminService;
    let mockUserRepo;
    let mockLeadRepo;
    let mockCatalogRepo;

    beforeEach(() => {
        mockUserRepo = { getAllUsers: vi.fn() };
        mockLeadRepo = { getAllLeads: vi.fn() };
        mockCatalogRepo = { getAllDesarrollos: vi.fn(), getAllModelos: vi.fn() };

        adminService = new AdminService(mockUserRepo, mockLeadRepo, mockCatalogRepo);
    });

    it('should fetch all users', async () => {
        mockUserRepo.getAllUsers.mockResolvedValue(['u1', 'u2']);
        const result = await adminService.getAllUsers();
        expect(result).toHaveLength(2);
        expect(mockUserRepo.getAllUsers).toHaveBeenCalled();
    });

    it('should fetch all leads', async () => {
        mockLeadRepo.getAllLeads.mockResolvedValue(['l1']);
        const result = await adminService.getAllLeads();
        expect(result).toHaveLength(1);
        expect(mockLeadRepo.getAllLeads).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
        mockUserRepo.getAllUsers.mockRejectedValue(new Error('DB Error'));
        const result = await adminService.getAllUsers();
        expect(result).toEqual([]);
    });
});
