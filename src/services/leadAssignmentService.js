// src/services/leadAssignmentService.js
import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';

// Importamos las constantes para consistencia.
import { STATUS } from '../config/constants';

/**
 * SERVICIO DE GENERACIÓN DE LEADS (FRONTEND)
 * ------------------------------------------
 * Responsabilidad: Solo crea la solicitud. La Cloud Function decide la asignación.
 * * PORQUÉ: Usar serverTimestamp() asegura que Firestore registre la hora del servidor, 
 * lo cual es más preciso y consistente que usar new Date() localmente.
 * El DATABAS_SCHEMA_V1.md requiere el tipo Timestamp.
 */

export const generarLeadAutomatico = async (datosCliente, idDesarrollo, nombreDesarrollo, modeloInteres) => {
  try {
    console.log(`📤 Enviando solicitud para: ${nombreDesarrollo}`);

    // 1. Preparamos el objeto "limpio" sin asignar asesor
    const nuevoLead = {
      // OJO: No enviamos asesorUid. Eso lo pone el servidor.
      
      clienteDatos: {
        nombre: datosCliente.nombre,
        email: datosCliente.email,
        telefono: datosCliente.telefono,
      },
      
      desarrolloId: String(idDesarrollo), // Aseguramos string para consistencia
      nombreDesarrollo: nombreDesarrollo,
      modeloInteres: modeloInteres || "No especificado",
      
      // Estado temporal esperando al backend (Usamos la constante)
      status: STATUS.LEAD_PENDING_ASSIGNMENT, 
      origen: 'web_automatico',
      
      // ✅ CORRECCIÓN CRÍTICA: Usamos la función nativa de Firestore para las fechas.
      fechaCreacion: serverTimestamp(),
      fechaUltimaInteraccion: serverTimestamp(),
      
      historial: [
        {
          accion: 'creacion_solicitud',
          // ✅ CORRECCIÓN: En lugar de ISOString, usamos un formato nativo para mantener la consistencia
          fecha: new Date().toISOString(), 
          detalle: 'Cliente solicitó informes (Esperando asignación)'
        }
      ]
    };

    // 2. Guardamos en Firestore
    const docRef = await addDoc(collection(db, "leads"), nuevoLead);
    
    console.log(`✅ Solicitud enviada con ID: ${docRef.id}`);
    
    // Retornamos éxito pero SIN datos del asesor (porque aún no se asigna)
    return { success: true, leadId: docRef.id };

  } catch (error) {
    console.error("Error al enviar solicitud:", error);
    return { success: false, error: error.message };
  }
};