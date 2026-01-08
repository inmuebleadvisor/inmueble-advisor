import { ClientService } from '../../../src/services/client.service';

const mockRepo = {
    findUserByEmail: vi.fn(),
    findUserByPhone: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn()
};

describe('ClientService', () => {
    let service;

    beforeEach(() => {
        service = new ClientService(mockRepo);
        vi.clearAllMocks();
    });

    it('findClientByContact should find by email first', async () => {
        mockRepo.findUserByEmail.mockResolvedValue({ uid: '1' });
        const result = await service.findClientByContact('test@test.com', '555');
        expect(result).toEqual({ uid: '1' });
        expect(mockRepo.findUserByPhone).not.toHaveBeenCalled();
    });

    it('findClientByContact should find by phone if email fails', async () => {
        mockRepo.findUserByEmail.mockResolvedValue(null);
        mockRepo.findUserByPhone.mockResolvedValue({ uid: '2' });
        const result = await service.findClientByContact('test@test.com', '555');
        expect(result).toEqual({ uid: '2' });
    });

    it('createClient should delegate to repo', async () => {
        mockRepo.createUser.mockResolvedValue({ uid: '3' });
        const result = await service.createClient({ nombre: 'Test' });
        expect(mockRepo.createUser).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Test', role: 'cliente' }));
        expect(result).toEqual({ uid: '3' });
    });
});
