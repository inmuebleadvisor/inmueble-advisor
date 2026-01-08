
import { LeadAssignmentService } from '../../../src/services/leadAssignmentService.js'; // corrected .js import if environment needs it, or assume extensions
import { STATUS } from '../../../src/config/constants';

const mockLeadRepo = {
    createLead: vi.fn()
};
const mockClientService = {
    findClientByContact: vi.fn(),
    createClient: vi.fn(),
    updateClientContact: vi.fn()
};

describe('LeadAssignmentService', () => {
    let service;

    const mockCatalogRepo = {
        getDesarrolloById: vi.fn(),
        getDesarrollosByCiudad: vi.fn(),
        getAllDesarrollos: vi.fn(),
        getDesarrolladorById: vi.fn(), // Added mock
        // Add other methods if needed
    };

    beforeEach(() => {
        service = new LeadAssignmentService(mockLeadRepo, mockClientService, mockCatalogRepo);
        vi.clearAllMocks();
    });

    it('generarLeadAutomatico should create lead with existing user', async () => {
        mockClientService.findClientByContact.mockResolvedValue({ uid: 'exist_uid' });
        mockLeadRepo.createLead.mockResolvedValue('new_lead_id');
        service.catalogRepository.getDesarrolloById.mockResolvedValue({ idDesarrollador: 'dev_id_1' });

        const result = await service.generarLeadAutomatico(
            { nombre: 'Test', email: 'e', telefono: 't' },
            'dev1', 'Desarrollo1', 'ModeloA'
        );

        expect(result.success).toBe(true);
        expect(mockLeadRepo.createLead).toHaveBeenCalledWith(expect.objectContaining({
            clienteUid: 'exist_uid',
            uid: 'exist_uid',
            status: STATUS.LEAD_PENDING_DEVELOPER_CONTACT
        }));
    });

    it('generarLeadAutomatico should create user if not exists', async () => {
        mockClientService.findClientByContact.mockResolvedValue(null);
        mockClientService.createClient.mockResolvedValue({ uid: 'new_uid' });
        mockLeadRepo.createLead.mockResolvedValue('new_lead_id_2');
        service.catalogRepository.getDesarrolloById.mockResolvedValue({ idDesarrollador: 'dev_id_1' });

        await service.generarLeadAutomatico(
            { nombre: 'Test', email: 'e', telefono: 't' },
            'dev1', 'Desarrollo1', 'ModeloA'
        );

        expect(mockClientService.createClient).toHaveBeenCalled();
        expect(mockLeadRepo.createLead).toHaveBeenCalledWith(expect.objectContaining({
            clienteUid: 'new_uid'
        }));
    });

    it('generarLeadAutomatico should fallback to constructora if idDesarrollador is missing', async () => {
        mockClientService.findClientByContact.mockResolvedValue({ uid: 'exist_uid' });
        mockLeadRepo.createLead.mockResolvedValue('new_lead_id_3');

        // Setup specific behavior for this test
        service.catalogRepository.getDesarrolloById.mockResolvedValue({ constructora: 'constructora_fallback' });

        const result = await service.generarLeadAutomatico(
            { nombre: 'Test', email: 'e', telefono: 't' },
            'dev_no_id', 'DesarrolloFallback', 'ModeloB',
            null, // providedUid
            null // idDesarrollador missing
        );

        expect(result.success).toBe(true);
        expect(mockLeadRepo.createLead).toHaveBeenCalledWith(expect.objectContaining({
            idDesarrollador: 'constructora_fallback'
        }));
    });
});
