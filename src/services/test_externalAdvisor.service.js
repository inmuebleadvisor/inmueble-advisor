
import { ExternalAdvisorService } from './externalAdvisor.service';

// Mock dependencies
const mockExternalAdvisorRepo = {
    create: jest.fn(),
    getAll: jest.fn(),
};

const mockCatalogRepo = {
    getAllDesarrollos: jest.fn(),
    getAllDevelopers: jest.fn(),
};

describe('ExternalAdvisorService', () => {
    let service;

    beforeEach(() => {
        service = new ExternalAdvisorService(mockExternalAdvisorRepo, mockCatalogRepo);
        jest.clearAllMocks();
    });

    describe('registerAdvisor', () => {
        it('should throw error if missing fields', async () => {
            await expect(service.registerAdvisor({})).rejects.toThrow("Missing required fields");
        });

        it('should validate whatsapp is number only', async () => {
            const data = { idDesarrollador: 'dev1', nombre: 'Juan', whatsapp: '123abc' };
            await expect(service.registerAdvisor(data)).rejects.toThrow("WhatsApp must contain only numbers");
        });

        it('should create advisor with default values', async () => {
            const data = { idDesarrollador: 'dev1', nombre: 'Juan', whatsapp: '1234567890' };
            mockExternalAdvisorRepo.create.mockResolvedValue({ id: 'adv1', ...data });

            const result = await service.registerAdvisor(data);

            expect(mockExternalAdvisorRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                ...data,
                puesto: 'Asesor Comercial',
                activo: true,
                leadsAsignadosAcumulados: 0
            }));
            expect(result.id).toBe('adv1');
        });
    });

    describe('getDirectory', () => {
        it('should group advisors by developer', async () => {
            const developers = [
                { id: 'dev1', nombre: 'Impulsa' },
                { id: 'dev2', nombre: 'Proyecta' }
            ];
            const advisors = [
                { id: 'a1', idDesarrollador: 'dev1', nombre: 'Ana' },
                { id: 'a2', idDesarrollador: 'dev1', nombre: 'Beto' },
                { id: 'a3', idDesarrollador: 'dev2', nombre: 'Carla' }
            ];

            mockCatalogRepo.getAllDevelopers.mockResolvedValue(developers);
            mockExternalAdvisorRepo.getAll.mockResolvedValue(advisors);

            const result = await service.getDirectory();

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('dev1');
            expect(result[0].advisors).toHaveLength(2);
            expect(result[1].id).toBe('dev2');
            expect(result[1].advisors).toHaveLength(1);
        });
    });
});
