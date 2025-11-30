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
  try {
    const q = query(
      collection(db, "leads"), 
      where("asesorUid", "==", asesorUid),
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
 * Maneja lógica condicional para cierres (ventas) o pérdidas.
 * * @param {string} leadId - ID del documento lead
 * @param {string} nuevoEstado - Nuevo status
 * @param {Object} datosExtra - Datos opcionales (monto venta, motivo perdida, notas)
 */
export const actualizarEstadoLead = async (leadId, nuevoEstado, datosExtra = {}) => {
  try {
    const leadRef = doc(db, "leads", leadId);
    const updateData = {
      status: nuevoEstado,
      fechaUltimaInteraccion: serverTimestamp()
    };

    // Si es una venta cerrada, guardamos los datos financieros
    if (nuevoEstado === 'vendido') {
      updateData.cierre = {
        montoFinal: datosExtra.monto,
        modeloFinal: datosExtra.modelo,
        fechaCierre: new Date().toISOString()
      };
    }
    
    // Si se pierde el lead, guardamos la razón para analítica futura
    if (nuevoEstado === 'perdido') {
      updateData.motivoPerdida = datosExtra.motivo;
    }

    // Aquí podríamos agregar lógica para guardar 'notas' en una subcolección de bitácora
    // si fuera necesario en el futuro.

    await updateDoc(leadRef, updateData);
    return true;
  } catch (error) {
    console.error("Error actualizando lead:", error);
    throw error;
  }
};