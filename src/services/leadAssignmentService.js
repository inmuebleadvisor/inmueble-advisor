// src/services/leadAssignmentService.js
import { db } from '../firebase/config';
import {
  collection,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

import { STATUS } from '../config/constants';

/**
 * SERVICIO DE GENERACIÓN DE LEADS (FRONTEND - OPTIMIZADO)
 * -------------------------------------------------------
 * Responsabilidad: Solo crea la solicitud mínima.
 * * ✅ CAMBIO FASE 2.1: 
 * Se eliminó el array 'historial' de este objeto.
 * Ahora la Cloud Function 'asignarLead' es la única responsable de crear
 * la primera entrada del historial para garantizar consistencia de Timestamps.
 */

export const generarLeadAutomatico = async (datosCliente, idDesarrollo, nombreDesarrollo, modeloInteres) => {
  try {


    const nuevoLead = {
      // Datos del Cliente
      clienteDatos: {
        nombre: datosCliente.nombre,
        email: datosCliente.email,
        telefono: datosCliente.telefono,
      },

      // Datos de Interés
      desarrolloId: String(idDesarrollo),
      nombreDesarrollo: nombreDesarrollo,
      modeloInteres: modeloInteres || "No especificado",

      // Estado Inicial
      status: STATUS.LEAD_PENDING_ASSIGNMENT,
      origen: 'web_automatico',

      // Fechas de Auditoría (Solo nivel raíz)
      fechaCreacion: serverTimestamp(),
      fechaUltimaInteraccion: serverTimestamp()

      // 🗑️ ELIMINADO: historial: [...] 
      // (Delegado al Backend para evitar errores de escritura y duplicidad)
    };

    // 2. Guardamos en Firestore
    const docRef = await addDoc(collection(db, "leads"), nuevoLead);



    return { success: true, leadId: docRef.id };

  } catch (error) {
    console.error("Error al enviar solicitud:", error);
    return { success: false, error: error.message };
  }
};