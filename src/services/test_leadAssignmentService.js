
import { LeadAssignmentService } from './leadAssignmentService.js'; // corrected .js import if environment needs it, or assume extensions
import { STATUS } from '../config/constants';

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

    beforeEach(() => {
        service = new LeadAssignmentService(mockLeadRepo, mockClientService);
        vi.clearAllMocks();
    });

    it('generarLeadAutomatico should create lead with existing user', async () => {
        mockClientService.findClientByContact.mockResolvedValue({ uid: 'exist_uid' });
        mockLeadRepo.createLead.mockResolvedValue('new_lead_id');

        const result = await service.generarLeadAutomatico(
            { nombre: 'Test', email: 'e', telefono: 't' },
            'dev1', 'Desarrollo1', 'ModeloA'
        );

        expect(result.success).toBe(true);
        expect(mockLeadRepo.createLead).toHaveBeenCalledWith(expect.objectContaining({
            clienteUid: 'exist_uid',
            status: STATUS.LEAD_PENDING_DEVELOPER_CONTACT
        }));
    });

    it('generarLeadAutomatico should create user if not exists', async () => {
        mockClientService.findClientByContact.mockResolvedValue(null);
        mockClientService.createClient.mockResolvedValue({ uid: 'new_uid' });
        mockLeadRepo.createLead.mockResolvedValue('new_lead_id_2');

        await service.generarLeadAutomatico(
            { nombre: 'Test', email: 'e', telefono: 't' },
            'dev1', 'Desarrollo1', 'ModeloA'
        );

        expect(mockClientService.createClient).toHaveBeenCalled();
        expect(mockLeadRepo.createLead).toHaveBeenCalledWith(expect.objectContaining({
            clienteUid: 'new_uid'
        }));
    });
});
