
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigService } from '../../../src/services/config.service';

describe('ConfigService', () => {
    let configService;
    let mockRepo;

    beforeEach(() => {
        mockRepo = { getSensitiveConfig: vi.fn() };
        configService = new ConfigService(mockRepo);
    });

    it('should get sensitive config from repo', async () => {
        const mockSettings = { hideEmptyDevs: true };
        mockRepo.getSettings.mockResolvedValue(mockSettings);

        const result = await configService.getPlatformSettings();

        expect(result.hideEmptyDevs).toBe(true);
        expect(mockRepo.getSettings).toHaveBeenCalled();
    });

    it('should return defaults on error', async () => {
        mockRepo.getSettings.mockRejectedValue(new Error('Access Denied'));
        const result = await configService.getPlatformSettings();
        expect(result.hideNoPhotosDevs).toBeDefined(); // Should return default
    });
});
