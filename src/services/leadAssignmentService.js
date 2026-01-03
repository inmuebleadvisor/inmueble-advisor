
import { STATUS } from '../config/constants';

/**
 * SERVICIO DE GENERACIÓN DE LEADS (FRONTEND - OPTIMIZADO)
 */
export class LeadAssignmentService {
  /**
   * @param {import('../repositories/lead.repository').LeadRepository} leadRepository 
   * @param {import('./client.service').ClientService} clientService 
   * @param {import('../repositories/catalog.repository').CatalogRepository} catalogRepository
   */
  constructor(leadRepository, clientService, catalogRepository) {
    this.leadRepository = leadRepository;
    this.clientService = clientService;
    this.catalogRepository = catalogRepository;
  }

  async generarLeadAutomatico(datosCliente, idDesarrollo, nombreDesarrollo, modeloInteres, providedUid = null, idDesarrollador = null, precioReferencia = 0, contextData = {}) {
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

      // 2. lookup idDesarrollador if missing
      let finalIdDesarrollador = idDesarrollador;
      if (idDesarrollo && !finalIdDesarrollador) {
        try {
          const devCheck = await this.catalogRepository.getDesarrolloById(idDesarrollo);
          if (devCheck) {
            finalIdDesarrollador = devCheck.idDesarrollador || devCheck.constructora;
          }
        } catch (e) {
          console.warn("Could not fetch development for ID lookup:", e);
        }
      }

      if (!idDesarrollo || !finalIdDesarrollador) {
        throw new Error("Missing required fields: idDesarrollo and idDesarrollador are mandatory.");
      }

      const nuevoLead = {
        uid: clienteUid, // ✅ Fix: Repository expects 'uid'
        clienteUid: clienteUid, // Keeping for backward compatibility/service clarity
        clienteDatos: {
          nombre: datosCliente.nombre,
          email: datosCliente.email,
          telefono: datosCliente.telefono,
        },
        idDesarrollo: String(idDesarrollo), // Ensure mapped to correct field
        idDesarrollador: String(finalIdDesarrollador),
        nombreDesarrollo: nombreDesarrollo,
        modeloInteres: modeloInteres || "No especificado",
        precioReferencia: Number(precioReferencia) || 0,
        status: STATUS.LEAD_PENDING_DEVELOPER_CONTACT,
        origen: contextData.origen || 'web_automatico',
        urlOrigen: contextData.urlOrigen || null,
        snapshot: contextData.snapshot || {}, // ✅ Persist Snapshot
        asesorUid: 'MANUAL_B2B_PROCESS',
        citainicial: contextData.citainicial || null // ✅ Appointment scheduling
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
