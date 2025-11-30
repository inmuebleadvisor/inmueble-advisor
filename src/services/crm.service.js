// src/services/crm.service.js
import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  getDocs 
} from 'firebase/firestore';

// ✅ IMPORTANTE: Importamos las constantes para la estandarización
import { STATUS } from '../config/constants';

/**
 * ==========================================
 * SERVICIO CRM (LEADS)
 * Responsabilidad: Gestión del embudo de ventas y estados de leads.
 * ==========================================
 */

/**
 * Obtiene los leads asignados a un asesor específico.
 * @param {string} asesorUid - ID del asesor logueado
 */
export const obtenerLeadsAsignados = async (asesorUid) => {
  // PORQUÉ: Siempre es buena práctica usar try/catch en operaciones asíncronas
  // de BD para manejar fallos de conexión o permisos.
  try {
    const q = query(
      collection(db, "leads"), 
      where("asesorUid", "==", asesorUid),
      // Mantenemos el ordenamiento para el dashboard.
      orderBy("fechaUltimaInteraccion", "desc") 
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
  // PORQUÉ: Estandarizamos para que todos los estados pasen por aquí.
  try {
    const leadRef = doc(db, "leads", leadId);
    const updateData = {
      status: nuevoEstado,
      // Usamos el timestamp del servidor para la hora de la interacción.
      fechaUltimaInteraccion: serverTimestamp() 
    };

    // Si es una venta cerrada (Usamos la constante)
    if (nuevoEstado === STATUS.LEAD_WON) {
      updateData.cierre = {
        montoFinal: datosExtra.monto,
        modeloFinal: datosExtra.modelo,
        fechaCierre: serverTimestamp() // También usamos server timestamp aquí
      };
    }
    
    // Si se pierde el lead (Usamos la constante)
    if (nuevoEstado === STATUS.LEAD_LOST) {
      updateData.motivoPerdida = datosExtra.motivo;
    }

    // Nota: Aquí se podría agregar al historial (opcional, Fase 3)
    
    await updateDoc(leadRef, updateData);
    return true;
  } catch (error) {
    console.error("Error actualizando lead:", error);
    throw error;
  }
};