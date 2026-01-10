
import { STATUS } from '../config/constants';

/**
 * SERVICIO DE GENERACIÓN DE LEADS (FRONTEND - OPTIMIZADO)
 */
/**
 * Service for Lead Generation and Orchestration.
 * Orchestrates Client creation, Commission calculation, and Lead persistence.
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

  /**
   * Orchestrates the creation of a new Lead.
   * 1. Finds or Creates Client User.
   * 2. Resolves Development and Developer data.
   * 3. Calculates Commission.
   * 4. Persists Lead.
   * @param {Object} datosCliente 
   * @param {string} idDesarrollo 
   * @param {string} nombreDesarrollo 
   * @param {string} modeloInteres 
   * @param {string|null} providedUid 
   * @param {string|null} idDesarrollador 
   * @param {number} precioReferencia 
   * @param {Object} contextData 
   * @returns {Promise<{success: boolean, leadId?: string, error?: string}>}
   */
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

      // 2. lookup idDesarrollador if missing AND fetch commission data
      let finalIdDesarrollador = idDesarrollador;
      let desarrolloData = null;
      let desarrolladorData = null;
      let comisionFinal = 0;

      // Ensure we have development data
      if (idDesarrollo) {
        try {
          desarrolloData = await this.catalogRepository.getDesarrolloById(idDesarrollo);
          if (desarrolloData) {
            if (!finalIdDesarrollador) {
              finalIdDesarrollador = desarrolloData.idDesarrollador || desarrolloData.constructora;
            }
          }
        } catch (e) {
          console.warn("Could not fetch development data:", e);
        }
      }

      // Ensure we have developer data
      if (finalIdDesarrollador) {
        try {
          desarrolladorData = await this.catalogRepository.getDesarrolladorById(finalIdDesarrollador);
        } catch (e) {
          console.warn("Could not fetch developer data:", e);
        }
      }

      if (!idDesarrollo || !finalIdDesarrollador) {
        throw new Error("Missing required fields: idDesarrollo and idDesarrollador are mandatory.");
      }

      // 3. CALCULAR COMISIÓN
      // Priority: Development Override > Developer Base > 0
      if (desarrolloData?.comisiones?.overridePct) {
        comisionFinal = Number(desarrolloData.comisiones.overridePct);
      } else if (desarrolladorData?.comisiones?.porcentajeBase) {
        comisionFinal = Number(desarrolladorData.comisiones.porcentajeBase);
      }

      const nuevoLead = {
        uid: clienteUid, // ✅ Fix: Repository expects 'uid'
        clienteUid: clienteUid, // Keeping for backward compatibility/service clarity
        clienteDatos: {
          nombre: datosCliente.nombre,
          email: datosCliente.email,
          telefono: datosCliente.telefono,
        },
        // ✅ TRACKING INJECTION
        metaEventId: contextData.metaEventId,
        fbp: contextData.fbp || null,
        fbc: contextData.fbc || null,
        clientUserAgent: contextData.clientUserAgent || null,
        clientIp: contextData.clientIp || null,

        idDesarrollo: String(idDesarrollo), // Ensure mapped to correct field
        idModelo: contextData.idModelo || null, // ✅ Mapped from context
        idDesarrollador: String(finalIdDesarrollador),
        nombreDesarrollo: nombreDesarrollo,
        modeloInteres: modeloInteres || "No especificado",
        precioReferencia: Number(precioReferencia) || 0,
        comisionPorcentaje: comisionFinal, // ✅ Calculated Commission
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

  /**
   * Checks if the user already has an active appointment for this development.
   * @param {string} uid 
   * @param {string} idDesarrollo 
   */
  async checkActiveAppointment(uid, idDesarrollo) {
    if (!uid || !idDesarrollo) {
      console.warn("⚠️ [Service] checkActiveAppointment missing params:", { uid, idDesarrollo });
      return { hasAppointment: false };
    }

    try {
      console.log("🔍 [Service] Calling repo.findActiveAppointment...");
      const appointment = await this.leadRepository.findActiveAppointment(uid, idDesarrollo);
      return {
        hasAppointment: !!appointment,
        appointment
      };
    } catch (error) {
      console.error("Error checking active appointment:", error);
      return { hasAppointment: false, error };
    }
  }

  /**
   * Reschedules an existing appointment.
   * @param {string} leadId 
   * @param {Object} newCita { dia: Date, hora: string }
   * @param {Object} contextData { metaEventId, fbp, fbc, userAgent, clientIp }
   */
  async rescheduleAppointment(leadId, newCita, contextData = {}) {
    try {
      const updates = {
        citainicial: newCita
      };

      // ✅ Update Tracking Data on Reschedule
      if (contextData.metaEventId) updates.metaEventId = contextData.metaEventId;
      if (contextData.fbp) updates.fbp = contextData.fbp;
      if (contextData.fbc) updates.fbc = contextData.fbc;
      if (contextData.clientUserAgent) updates.clientUserAgent = contextData.clientUserAgent;
      if (contextData.urlOrigen) updates.urlOrigen = contextData.urlOrigen; // Ensure URL is fresh

      await this.leadRepository.updateLead(leadId, updates);

      // Add history event
      await this.leadRepository.updateStatus(leadId, STATUS.LEAD_PENDING_DEVELOPER_CONTACT, {
        note: `Cita reprogramada a ${newCita.hora} del ${newCita.dia.toLocaleDateString()}`,
        changedBy: "USER"
      });

      return { success: true };
    } catch (error) {
      console.error("Error rescheduling:", error);
      return { success: false, error: error.message };
    }
  }
}
