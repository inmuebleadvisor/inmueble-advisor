import { db } from '../firebase/config';
import { serverTimestamp } from 'firebase/firestore'; // Keep only what's needed for data construction if necessary, or move to Repo?
// Repo handles serverTimestamp usually, but `actualizarEstadoLead` constructs the object heavily.
// To fully decouple, the Repo should accept specific typed updates or we pass raw objects.
// Let's pass raw objects and let Repo handle the writing. However serverTimestamp needs to be passed or generated.
// I will keep serverTimestamp usage here if I push it as data, OR I create precise methods in Repo.
// For now, to match the pattern, I'll pass data objects.
// Wait, my LeadRepository definition uses serverTimestamp inside createLead, 
// but for updates I said "trust service".
// Let's keep serverTimestamp import for constructing the update payload.

import { STATUS } from '../config/constants';
import { createOrUpdateExternalAdvisor } from './externalAdvisor.service';
import { LeadRepository } from '../repositories/lead.repository';

// Singleton or instantiation
const leadRepository = new LeadRepository(db);

/**
 * ==========================================
 * SERVICIO CRM (LEADS)
 * Responsabilidad: Gestión del embudo de ventas y estados de leads.
 * 
 * MODIFICADO: Dic 2025 - Soporte para Asesores Externos (Develop-Centric)
 * REFACTORIZADO: Ene 2026 - Uso de LeadRepository
 * ==========================================
 */

/**
 * Obtiene los leads asignados a un asesor específico.
 * @param {string} asesorUid - ID del asesor logueado
 */
export const obtenerLeadsAsignados = async (asesorUid) => {
  try {
    return await leadRepository.getLeadsByAdvisor(asesorUid);
  } catch (error) {
    console.error("Error obteniendo leads:", error);
    return [];
  }
};

/**
 * Actualiza el estado de un lead en el embudo (ej. de 'nuevo' a 'contactado').
 * @param {string} leadId - ID del documento lead
 * @param {string} nuevoEstado - Nuevo status (Debe ser un valor de STATUS.LEAD_...)
 * @param {Object} datosExtra - Datos opcionales (monto venta, motivo perdida, notas)
 */
export const actualizarEstadoLead = async (leadId, nuevoEstado, datosExtra = {}) => {
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

    await leadRepository.updateLead(leadId, updateData);
    return true;
  } catch (error) {
    console.error("Error actualizando lead:", error);
  }
};

/**
 * 🟢 NUEVO (Dic 2025): Registra que ya se avisó al Developer sobre el Lead
 * @param {string} leadId 
 */
export const marcarComoReportado = async (leadId) => {
  try {
    const updateData = {
      status: STATUS.LEAD_REPORTED,
      "seguimientoB2B.status": 'REPORTED',
      fechaReporte: serverTimestamp(),
      ultimaActualizacion: serverTimestamp()
    };
    await leadRepository.updateLead(leadId, updateData);
    return true;
  } catch (error) {
    console.error("Error marcando reportado:", error);
    throw error;
  }
};

/**
 * 🟢 NUEVO (Dic 2025): Asigna un asesor EXTERNO (del developer)
 * @param {string} leadId 
 * @param {Object} datosAsesorExterno - { nombre, telefono (opcional) }
 */
export const asignarAsesorExterno = async (leadId, datosAsesorExterno) => {
  try {
    // 1. Garantizar que el asesor exista en la colección de externos
    const advisor = await createOrUpdateExternalAdvisor(datosAsesorExterno);

    // Actualizamos el Lead
    const updateData = {
      status: STATUS.LEAD_ASSIGNED_EXTERNAL,
      externalAdvisor: {
        nombre: advisor.nombre,
        telefono: advisor.telefono || '',
        fechaAsignacion: new Date()
      },
      seguimientoB2B: {
        status: 'ASSIGNED',
        vendedorExternoId: advisor.id,
        hitosAlcanzados: [] // Inicializar array de hitos
      },
      fechaUltimaInteraccion: serverTimestamp()
    };

    await leadRepository.updateLead(leadId, updateData);
    return true;
  } catch (error) {
    console.error("Error asignando extrno:", error);
    throw error;
  }
};

/**
 * Registra un hito B2B (Apartado, Promesa, Escritura).
 * Genera Audit Trail.
 */
export const registrarHito = async (leadId, hitoName, usuarioId) => {
  try {
    const nuevoHito = {
      hito: hitoName,
      fecha: new Date(),
      usuarioResponsable: usuarioId || 'system'
    };

    // Use specialized method in repo for array operations to keep clean
    await leadRepository.addB2BMilestone(leadId, nuevoHito);

    return true;
  } catch (error) {
    console.error("Error registrando hito:", error);
    throw error;
  }
};

/**
 * Calcula la comisión estimada basada en el precio base y la política del desarrollo.
 * @param {number} precioBase - Precio del modelo seleccionado.
 * @param {Object} commissionPolicy - Objeto { porcentaje: 3.5, ... } del desarrollo.
 * @returns {number} Monto estimado.
 */
export const calcularComisionEstimada = (precioBase, commissionPolicy) => {
  if (!precioBase || !commissionPolicy?.porcentaje) return 0;
  const porcentaje = Number(commissionPolicy.porcentaje);
  return (precioBase * porcentaje) / 100;
};
