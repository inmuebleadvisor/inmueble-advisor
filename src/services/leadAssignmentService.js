
import { STATUS } from '../config/constants';

/**
 * SERVICIO DE GENERACIÓN DE LEADS (FRONTEND - OPTIMIZADO)
 */
export class LeadAssignmentService {
  /**
   * @param {import('../repositories/lead.repository').LeadRepository} leadRepository 
   * @param {import('./client.service').ClientService} clientService 
   */
  constructor(leadRepository, clientService) {
    this.leadRepository = leadRepository;
    this.clientService = clientService;
  }

  async generarLeadAutomatico(datosCliente, idDesarrollo, nombreDesarrollo, modeloInteres, providedUid = null) {
    try {
      // 1. GESTIÓN DE USUARIO (Link User-Lead)
      let clienteUid = providedUid;

      if (!clienteUid) {
        // Delegamos búsqueda/creación a ClientService
        const client = await this.clientService.findClientByContact(datosCliente.email, datosCliente.telefono);
        if (client) {
          clienteUid = client.uid;
        } else {
          const newClient = await this.clientService.createClient(datosCliente);
          clienteUid = newClient.uid;
        }
      } else {
        // Actualizamos teléfono si aplica (sin await para no bloquear)
        this.clientService.updateClientContact(clienteUid, { telefono: datosCliente.telefono });
      }

      const nuevoLead = {
        clienteUid: clienteUid,
        clienteDatos: {
          nombre: datosCliente.nombre,
          email: datosCliente.email,
          telefono: datosCliente.telefono,
        },
        desarrolloId: String(idDesarrollo),
        nombreDesarrollo: nombreDesarrollo,
        modeloInteres: modeloInteres || "No especificado",
        status: STATUS.LEAD_PENDING_DEVELOPER_CONTACT,
        origen: 'web_automatico',
        asesorUid: 'MANUAL_B2B_PROCESS'
      };

      // 2. Guardamos usando Repositorio
      const leadId = await this.leadRepository.createLead(nuevoLead);

      return { success: true, leadId: leadId };

    } catch (error) {
      console.error("Error al enviar solicitud:", error);
      return { success: false, error: error.message };
    }
  }
}
