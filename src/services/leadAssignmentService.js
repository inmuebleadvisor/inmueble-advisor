// src/services/leadAssignmentService.js
import { db } from '../firebase/config';
import { STATUS } from '../config/constants';
import { findClientByContact, createClient, updateClientContact } from './client.service';
import { LeadRepository } from '../repositories/lead.repository';

// Instantiate Repository
const leadRepository = new LeadRepository(db);

/**
 * SERVICIO DE GENERACIÓN DE LEADS (FRONTEND - OPTIMIZADO)
 * -------------------------------------------------------
 * Responsabilidad: Solo crea la solicitud mínima.
 * * ✅ CAMBIO FASE 2.1: 
 * Se eliminó el array 'historial' de este objeto.
 * Ahora la Cloud Function 'asignarLead' es la única responsable de crear
 * la primera entrada del historial para garantizar consistencia de Timestamps.
 * * REFACTORIZADO: Ene 2026 - Uso de LeadRepository
 */

export const generarLeadAutomatico = async (datosCliente, idDesarrollo, nombreDesarrollo, modeloInteres, providedUid = null) => {
  try {
    // 1. GESTIÓN DE USUARIO (Link User-Lead)
    // Estrategia: "Trust Auth". Si el frontend manda UID, lo usamos.

    let clienteUid = providedUid;

    // Si NO viene UID (caso legacy o fallback), buscamos por teléfono/email
    if (!clienteUid) {
      const existingClient = await findClientByContact(datosCliente.email, datosCliente.telefono);
      if (existingClient) {
        clienteUid = existingClient.uid;
      } else {
        const newClient = await createClient(datosCliente);
        clienteUid = newClient.uid;
      }
    } else {
      // Si YA tenemos UID, solo actualizamos el teléfono si es necesario
      // (No esperamos a que termine para no bloquear)
      updateClientContact(clienteUid, { telefono: datosCliente.telefono });
    }

    const nuevoLead = {
      // VINCULACIÓN
      clienteUid: clienteUid, // ✅ LINK DERO (Foreign Key)

      // Datos del Cliente (Snapshot para lectura rápida sin joins)
      clienteDatos: {
        nombre: datosCliente.nombre,
        email: datosCliente.email,
        telefono: datosCliente.telefono,
      },

      // Datos de Interés
      desarrolloId: String(idDesarrollo),
      nombreDesarrollo: nombreDesarrollo,
      modeloInteres: modeloInteres || "No especificado",

      // Estado Inicial (Nuevo Modelo: Pendiente de contactar al Dev)
      status: STATUS.LEAD_PENDING_DEVELOPER_CONTACT,
      origen: 'web_automatico',

      // 🔒 BYPASS LEGACY CLOUD FUNCTION
      // Establecemos esto para que el trigger 'assignLead' en la nube (código viejo)
      // detecte que ya tiene asesor (aunque sea dummy) y aborte la ejecución,
      // evitando que sobrescriba el status a 'PENDING_ADMIN'.
      asesorUid: 'MANUAL_B2B_PROCESS'

      // Fechas de Auditoría son manejadas por el repositorio
    };

    // 2. Guardamos usando Repositorio
    const leadId = await leadRepository.createLead(nuevoLead);

    return { success: true, leadId: leadId };

  } catch (error) {
    console.error("Error al enviar solicitud:", error);
    return { success: false, error: error.message };
  }
};
