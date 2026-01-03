
import { serverTimestamp } from 'firebase/firestore'; // Keep for constructing payload, repo handles write.
import { STATUS } from '../config/constants';

/**
 * SERVICIO CRM (LEADS)
 * Responsabilidad: Gestión del embudo de ventas y estados de leads.
 */
export class CrmService {
  /**
   * @param {import('../repositories/lead.repository').LeadRepository} leadRepository 
   * @param {import('./externalAdvisor.service').ExternalAdvisorService} externalAdvisorService 
   */
  constructor(leadRepository, externalAdvisorService) {
    this.leadRepository = leadRepository;
    this.externalAdvisorService = externalAdvisorService;
  }

  /**
   * Obtiene los leads asignados a un asesor específico.
   * @param {string} asesorUid - ID del asesor logueado
   */
  async obtenerLeadsAsignados(asesorUid) {
    try {
      return await this.leadRepository.getLeadsByAdvisor(asesorUid);
    } catch (error) {
      console.error("Error obteniendo leads:", error);
      return [];
    }
  }

  /**
   * Actualiza el estado de un lead en el embudo (ej. de 'nuevo' a 'contactado').
   */
  async actualizarEstadoLead(leadId, nuevoEstado, datosExtra = {}) {
    try {
      const updateData = {
        status: nuevoEstado,
        fechaUltimaInteraccion: serverTimestamp()
      };

      // Si es una venta cerrada (Usamos la constante)
      if (nuevoEstado === STATUS.LEAD_WON) {
        updateData.cierre = {
          montoFinal: datosExtra.monto,
          modeloFinal: datosExtra.modelo,
          fechaCierre: serverTimestamp()
        };
      }

      // Si se pierde el lead (Usamos la constante)
      if (nuevoEstado === STATUS.LEAD_LOST) {
        updateData.motivoPerdida = datosExtra.motivo;
      }

      await this.leadRepository.updateLead(leadId, updateData);
      return true;
    } catch (error) {
      console.error("Error actualizando lead:", error);
      throw error; // Propagate error for UI feedback
    }
  }

  /**
   * Registra que ya se avisó al Developer sobre el Lead
   */
  async marcarComoReportado(leadId) {
    try {
      const updateData = {
        status: STATUS.LEAD_REPORTED,
        "seguimientoB2B.status": 'REPORTED',
        fechaReporte: serverTimestamp(),
        ultimaActualizacion: serverTimestamp()
      };
      await this.leadRepository.updateLead(leadId, updateData);
      return true;
    } catch (error) {
      console.error("Error marcando reportado:", error);
      throw error;
    }
  }

  /**
   * Asigna un asesor EXTERNO (del developer)
   */
  async asignarAsesorExterno(leadId, advisor) {
    try {
      // Validamos que venga la info mínima
      if (!advisor || !advisor.nombre) {
        throw new Error("Datos de asesor inválidos");
      }

      // Actualizamos el Lead
      const updateData = {
        status: STATUS.LEAD_ASSIGNED_EXTERNAL,
        externalAdvisor: {
          id: advisor.id || null, // Guardamos ID si existe
          nombre: advisor.nombre,
          telefono: advisor.whatsapp || advisor.telefono || '', // Normalizamos a whatsapp/telefono
          email: advisor.email || '',
          fechaAsignacion: new Date()
        },
        seguimientoB2B: {
          status: 'ASSIGNED',
          vendedorExternoId: advisor.id || null,
          hitosAlcanzados: []
        },
        idAsesorAsignadoExterno: advisor.id || null, // Field indexado si es necesario
        fechaUltimaInteraccion: serverTimestamp()
      };

      await this.leadRepository.updateLead(leadId, updateData);
      return true;
    } catch (error) {
      console.error("Error asignando externo:", error);
      throw error;
    }
  }

  /**
   * Registra un hito B2B (Apartado, Promesa, Escritura).
   */
  async registrarHito(leadId, hitoName, usuarioId) {
    try {
      const nuevoHito = {
        hito: hitoName,
        fecha: new Date(),
        usuarioResponsable: usuarioId || 'system'
      };

      await this.leadRepository.addB2BMilestone(leadId, nuevoHito);
      return true;
    } catch (error) {
      console.error("Error registrando hito:", error);
      throw error;
    }
  }

  /**
   * Calcula la comisión estimada.
   * Static because it's pure logic, no dependencies.
   */
  calcularComisionEstimada(precioBase, commissionPolicy) {
    if (!precioBase || !commissionPolicy?.porcentaje) return 0;
    const porcentaje = Number(commissionPolicy.porcentaje);
    return (precioBase * porcentaje) / 100;
  }
}
