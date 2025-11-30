// src/services/leadAssignmentService.js
import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';

/**
 * SERVICIO DE GENERACIÓN DE LEADS (FRONTEND)
 * ------------------------------------------
 * Versión "Tonta" / Segura.
 * Responsabilidad: Solo crea la solicitud. La Cloud Function decide la asignación.
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
      
      status: 'pendiente_asignacion', // Estado temporal esperando al backend
      origen: 'web_automatico',
      
      fechaCreacion: serverTimestamp(),
      fechaUltimaInteraccion: serverTimestamp(),
      
      historial: [
        {
          accion: 'creacion_solicitud',
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