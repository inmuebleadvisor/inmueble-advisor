import { ExternalAdvisorService } from './externalAdvisor.service';

const mockRepository = {
    findByPhone: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    getAll: vi.fn(),
    addLeadToHistory: vi.fn()
};

describe('ExternalAdvisorService', () => {
    let service;

    beforeEach(() => {
        service = new ExternalAdvisorService(mockRepository);
        vi.clearAllMocks();
    });

    it('findByPhone should call repo', async () => {
        await service.findByPhone('555');
        expect(mockRepository.findByPhone).toHaveBeenCalledWith('555');
    });

    it('createOrUpdate should update existing advisor', async () => {
        mockRepository.findByPhone.mockResolvedValue({ id: '1', nombre: 'Old' });

        await service.createOrUpdate({ nombre: 'New', telefono: '555' });

        expect(mockRepository.update).toHaveBeenCalledWith('1', expect.objectContaining({ nombre: 'New' }));
    });

    it('createOrUpdate should create new advisor if not found', async () => {
        mockRepository.findByPhone.mockResolvedValue(null);
        mockRepository.create.mockResolvedValue({ id: '2', nombre: 'New' });

        const result = await service.createOrUpdate({ nombre: 'New', telefono: '555' });

        expect(mockRepository.create).toHaveBeenCalled();
        expect(result).toEqual({ id: '2', nombre: 'New' });
    });
});
