
import { CrmService } from './crm.service';
import { STATUS } from '../config/constants';

// Mocks
const mockLeadRepo = {
    getLeadsByAdvisor: vi.fn(),
    updateLead: vi.fn(),
    addB2BMilestone: vi.fn()
};
const mockExternalAdvisorService = {
    createOrUpdate: vi.fn()
};

vi.mock('firebase/firestore', () => ({
    serverTimestamp: () => 'TIMESTAMP'
}));

// Mock Constants if needed, or import real ones if they are simple objects.
// Since we import generic 'STATUS', it should be fine. 

describe('CrmService', () => {
    let service;

    beforeEach(() => {
        service = new CrmService(mockLeadRepo, mockExternalAdvisorService);
        vi.clearAllMocks();
    });

    it('obtenerLeadsAsignados calls repo', async () => {
        await service.obtenerLeadsAsignados('uid');
        expect(mockLeadRepo.getLeadsByAdvisor).toHaveBeenCalledWith('uid');
    });

    it('actualizarEstadoLead updates status', async () => {
        await service.actualizarEstadoLead('lead1', 'NUEVO_ESTADO');
        expect(mockLeadRepo.updateLead).toHaveBeenCalledWith('lead1', expect.objectContaining({
            status: 'NUEVO_ESTADO',
            fechaUltimaInteraccion: 'TIMESTAMP'
        }));
    });

    it('actualizarEstadoLead adds closure data if won', async () => {
        await service.actualizarEstadoLead('lead1', STATUS.LEAD_WON, { monto: 100, modelo: 'A' });
        expect(mockLeadRepo.updateLead).toHaveBeenCalledWith('lead1', expect.objectContaining({
            status: STATUS.LEAD_WON,
            cierre: expect.objectContaining({
                montoFinal: 100
            })
        }));
    });

    it('asignarAsesorExterno orchestrates advisor creation and lead update', async () => {
        mockExternalAdvisorService.createOrUpdate.mockResolvedValue({ id: 'adv1', nombre: 'Pepe' });

        await service.asignarAsesorExterno('lead1', { nombre: 'Pepe' });

        expect(mockExternalAdvisorService.createOrUpdate).toHaveBeenCalled();
        expect(mockLeadRepo.updateLead).toHaveBeenCalledWith('lead1', expect.objectContaining({
            status: STATUS.LEAD_ASSIGNED_EXTERNAL,
            externalAdvisor: expect.objectContaining({ nombre: 'Pepe' })
        }));
    });

    it('calcularComisionEstimada works correctly', () => {
        const result = service.calcularComisionEstimada(100000, { porcentaje: 2 });
        expect(result).toBe(2000);
    });
});
