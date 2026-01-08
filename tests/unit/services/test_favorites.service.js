import { FavoritesService } from '../../../src/services/favorites.service';

const mockRepo = {
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
    getFavorites: vi.fn()
};

describe('FavoritesService', () => {
    let service;

    beforeEach(() => {
        service = new FavoritesService(mockRepo);
        vi.clearAllMocks();
    });

    it('addFavorite should delegate to repo and return result', async () => {
        mockRepo.addFavorite.mockResolvedValue(true);
        const result = await service.addFavorite('user1', 'model1');
        expect(mockRepo.addFavorite).toHaveBeenCalledWith('user1', 'model1');
        expect(result).toBe(true);
    });

    it('addFavorite should return false on error', async () => {
        mockRepo.addFavorite.mockRejectedValue(new Error('Fail'));
        const result = await service.addFavorite('user1', 'model1');
        expect(result).toBe(false);
    });

    it('removeFavorite should delegate to repo and return result', async () => {
        mockRepo.removeFavorite.mockResolvedValue(true);
        const result = await service.removeFavorite('user1', 'model1');
        expect(mockRepo.removeFavorite).toHaveBeenCalledWith('user1', 'model1');
        expect(result).toBe(true);
    });

    it('removeFavorite should return false on error', async () => {
        mockRepo.removeFavorite.mockRejectedValue(new Error('Fail'));
        const result = await service.removeFavorite('user1', 'model1');
        expect(result).toBe(false);
    });

    it('getFavorites should return array from repo', async () => {
        mockRepo.getFavorites.mockResolvedValue(['model1', 'model2']);
        const result = await service.getFavorites('user1');
        expect(mockRepo.getFavorites).toHaveBeenCalledWith('user1');
        expect(result).toEqual(['model1', 'model2']);
    });

    it('getFavorites should return empty array on error', async () => {
        mockRepo.getFavorites.mockRejectedValue(new Error('Fail'));
        const result = await service.getFavorites('user1');
        expect(result).toEqual([]);
    });
});
