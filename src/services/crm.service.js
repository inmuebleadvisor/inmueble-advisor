import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, orderBy, limit, serverTimestamp, arrayUnion } from 'firebase/firestore';
// ✅ IMPORTANTE: Importamos las constantes para la estandarización
import { STATUS } from '../config/constants';
import { createOrUpdateExternalAdvisor, addLeadToAdvisorHistory } from './externalAdvisor.service';

/**
 * ==========================================
 * SERVICIO CRM (LEADS)
 * Responsabilidad: Gestión del embudo de ventas y estados de leads.
 * 
 * MODIFICADO: Dic 2025 - Soporte para Asesores Externos (Develop-Centric)
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
  }
};

/**
 * 🟢 NUEVO (Dic 2025): Registra que ya se avisó al Developer sobre el Lead
 * @param {string} leadId 
 */
export const marcarComoReportado = async (leadId) => {
  try {
    const leadRef = doc(db, "leads", leadId);
    await updateDoc(leadRef, {
      status: STATUS.LEAD_REPORTED,
      "seguimientoB2B.status": 'REPORTED', // Nuevo campo estructurado
      fechaReporte: serverTimestamp(),
      ultimaActualizacion: serverTimestamp()
    });
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

    // 2. Recuperar datos del lead para el historial (Snapshot rápido o pasarlos como param)
    // Para eficiencia, asumiremos que el frontend o el contexto ya tiene algo, 
    // pero si no, tendríamos que leer el lead. 
    // MEJORA: Hacemos un getDoc del lead o confiamos en que 'asignarAsesorExterno' 
    // suele llamarse desde contexto donde tenemos info.
    // Por seguridad, leemos el lead para tener el nombre del cliente exacto.
    const leadRef = doc(db, "leads", leadId);

    // Actualizamos el Lead
    await updateDoc(leadRef, {
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
    });
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
    const leadRef = doc(db, "leads", leadId);

    const nuevoHito = {
      hito: hitoName,
      fecha: new Date(), // Usamos Date para que sea legible en array
      usuarioResponsable: usuarioId || 'system'
    };

    await updateDoc(leadRef, {
      "seguimientoB2B.hitosAlcanzados": arrayUnion(nuevoHito),
      fechaUltimaInteraccion: serverTimestamp()
    });

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