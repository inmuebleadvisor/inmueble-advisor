// src/services/analytics.service.js
// Ya no necesitamos importar Firestore ni updateDoc, ya que el cálculo 
// y guardado del score se hace en Cloud Functions (backend) por seguridad.

import { STATUS } from '../config/constants'; // 🔥 FIX: Importación de constantes

/**
 * ==========================================
 * SERVICIO DE ANALÍTICAS & SCORE
 * Responsabilidad: Cálculos matemáticos (solo front-end/puros).
 * ==========================================
 */

/**
 * Calcula métricas crudas para visualización en el dashboard.
 * Función pura (no llama a la BD, solo procesa datos).
 * @param {Array} leads - Lista de leads del asesor
 */
export const calcularEstadisticasAsesor = (leads) => {
  let totalVendido = 0;
  let ganados = 0;
  let perdidos = 0;
  let activos = 0;
  
  // PORQUÉ: El embudo se mapea con los strings antiguos porque es una función 
  // que lee leads ya guardados, cuya estructura de STATUS está en transición.
  const embudo = { nuevos: 0, contactados: 0, visitas: 0, cierres: 0 };

  leads.forEach(lead => {
    const s = lead.status;
    
    // La Cloud Function ya cambió los leads nuevos a las constantes, 
    // pero mantenemos la lógica de status temporal aquí por si hay leads antiguos.
    // 🔥 FIX: Priorizamos la constante (ej. STATUS.LEAD_WON es 'WON')
    if (s === STATUS.LEAD_WON || s === 'vendido') {
      ganados++;
      totalVendido += (lead.cierre?.montoFinal || 0);
    } else if (s === STATUS.LEAD_LOST || s === 'perdido') {
      perdidos++;
    } else {
      activos++;
    }

    // Conteo por etapas para gráficas
    // 🔥 FIX: Uso de constantes universales para el mapeo del embudo
    if (s === STATUS.LEAD_NEW || s === 'nuevo') embudo.nuevos++;
    else if (s === STATUS.LEAD_CONTACTED || s === 'contactado') embudo.contactados++;
    else if ([STATUS.LEAD_VISIT_SCHEDULED, STATUS.LEAD_VISIT_CONFIRMED, STATUS.LEAD_VISITED, 'visita_agendada', 'visita_confirmada', 'visito'].includes(s)) embudo.visitas++;
    else if ([STATUS.LEAD_RESERVED, STATUS.LEAD_WON, STATUS.LEAD_CLOSED, 'apartado', 'vendido', 'escriturado'].includes(s)) embudo.cierres++;
  });

  const leadsFinalizados = ganados + perdidos;
  const tasaCierre = leadsFinalizados > 0 
    ? ((ganados / leadsFinalizados) * 100).toFixed(1) 
    : 0;

  return {
    totalLeads: leads.length,
    totalVendido,
    ganados,
    leadsFinalizados,
    tasaCierre: Number(tasaCierre),
    activos,
    embudo
  };
};

/**
 * Función actualizarScoreAsesor ELIMINADA.
 * PORQUÉ: Esta lógica fue migrada a la Cloud Function 'functions/index.js' 
 * para garantizar seguridad y que solo el backend pueda modificar el Score 
 * Global (meritocracia). Mantenerla en el frontend es redundante y riesgoso.
 */