// src/services/analytics.service.js
import { db } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

/**
 * ==========================================
 * SERVICIO DE ANALÍTICAS & SCORE
 * Responsabilidad: Cálculos matemáticos y gamificación.
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
  
  const embudo = { nuevos: 0, contactados: 0, visitas: 0, cierres: 0 };

  leads.forEach(lead => {
    const s = lead.status;
    if (s === 'vendido') {
      ganados++;
      totalVendido += (lead.cierre?.montoFinal || 0);
    } else if (s === 'perdido') {
      perdidos++;
    } else {
      activos++;
    }

    // Conteo por etapas para gráficas
    if (s === 'nuevo') embudo.nuevos++;
    else if (s === 'contactado') embudo.contactados++;
    else if (['visita_agendada', 'visita_confirmada', 'visito'].includes(s)) embudo.visitas++;
    else if (['apartado', 'vendido', 'escriturado'].includes(s)) embudo.cierres++;
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
 * 🔥 ALGORITMO DEL SCORE CARD 🔥
 * Calcula y GUARDA el score en el perfil del usuario.
 * * TODO: Mover esta función a Cloud Functions en Fase 2 por seguridad.
 */
export const actualizarScoreAsesor = async (uid, metricasActuales, perfilUsuario) => {
  try {
    // 1. OBTENER VARIABLES
    
    // A. Reseñas (30%): Base 5 estrellas.
    const promedioResenas = perfilUsuario.metricas?.promedioResenas || 0; 
    const ptsResenas = (promedioResenas / 5) * 30;

    // B. Actualización (20%): Regla de 30 días.
    const ultimaActualizacion = perfilUsuario.metricas?.ultimaActualizacionInventario;
    let ptsActualizacion = 0;
    if (ultimaActualizacion) {
      const dias = (new Date() - new Date(ultimaActualizacion)) / (1000 * 60 * 60 * 24);
      if (dias <= 30) ptsActualizacion = 20; // Cumple la regla
    }

    // C. Cierres (30%): Regla de mercado. 
    // Asumimos que 10% de cierre es EXCELENTE (Meta máxima).
    const tasaReal = metricasActuales.tasaCierre || 0;
    const factorCierre = Math.min(tasaReal, 10) / 10; // Tope en 10%
    const ptsCierre = factorCierre * 30;

    // D. Admin (20%): Manual
    const cumplimientoAdmin = perfilUsuario.metricas?.cumplimientoAdmin || 80; // Default 80/100
    const ptsAdmin = (cumplimientoAdmin / 100) * 20;

    // 2. SUMA FINAL
    const scoreFinal = Math.round(ptsResenas + ptsActualizacion + ptsCierre + ptsAdmin);

    // 3. GUARDAR EN BD
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      scoreGlobal: scoreFinal,
      "metricas.tasaCierre": tasaReal,
      "metricas.totalLeadsAsignados": metricasActuales.totalLeads
    });

    console.log(`✅ Score Actualizado: ${scoreFinal}`);
    return scoreFinal;

  } catch (error) {
    console.error("Error actualizando score:", error);
    return null;
  }
};