// src/services/dataService.js
import { db } from '../firebase/config';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  serverTimestamp, 
  orderBy 
} from 'firebase/firestore';

// --- CACHÉ EN MEMORIA ---
let cacheModelos = null;
let cacheDesarrollos = null;

const FALLBACK_IMG = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png";

// --- HELPERS INTERNOS ---
const procesarImagenes = (data) => {
  let listaImagenes = [];
  if (Array.isArray(data.multimedia?.galeria) && data.multimedia.galeria.length > 0) {
    listaImagenes.push(...data.multimedia.galeria);
  }
  if (data.multimedia?.planta_baja) listaImagenes.push(data.multimedia.planta_baja);
  if (data.portadaDesarrollo) listaImagenes.push(data.portadaDesarrollo);
  
  listaImagenes = listaImagenes.filter(url => url && url.length > 5);
  if (listaImagenes.length === 0) listaImagenes.push(FALLBACK_IMG);

  return { imagen: listaImagenes[0], imagenes: listaImagenes };
};

// ==========================================
// 1. GESTIÓN DE CATÁLOGO (PÚBLICO)
// ==========================================

export const obtenerDatosUnificados = async () => {
  if (cacheModelos) return cacheModelos;
  try {
    const snap = await getDocs(collection(db, "modelos"));
    const modelos = snap.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      ...procesarImagenes(doc.data())
    }));
    cacheModelos = modelos;
    return modelos;
  } catch (error) {
    console.error("Error cargando modelos:", error);
    return [];
  }
};

export const obtenerInventarioDesarrollos = async () => {
  if (cacheDesarrollos) return cacheDesarrollos;
  try {
    const snap = await getDocs(collection(db, "desarrollos"));
    cacheDesarrollos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return cacheDesarrollos;
  } catch (error) {
    console.error("Error cargando desarrollos:", error);
    return [];
  }
};

export const obtenerTopAmenidades = async () => {
  const desarrollos = await obtenerInventarioDesarrollos();
  const conteo = {};
  desarrollos.forEach(d => {
    if (Array.isArray(d.amenidades)) {
      d.amenidades.forEach(am => {
        if(am) conteo[am.trim()] = (conteo[am.trim()] || 0) + 1;
      });
    }
  });
  return Object.keys(conteo).sort((a, b) => conteo[b] - conteo[a]).slice(0, 5);
};

export const obtenerInformacionDesarrollo = async (id) => {
  try {
    const docRef = doc(db, "desarrollos", String(id).trim());
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    const q = query(collection(db, "modelos"), where("id_desarrollo", "==", id));
    const modelosSnap = await getDocs(q);
    const modelos = modelosSnap.docs.map(d => ({ id: d.id, ...d.data(), ...procesarImagenes(d.data()) }));

    return { ...docSnap.data(), id: docSnap.id, modelos };
  } catch (error) {
    console.error("Error detalle desarrollo:", error);
    return null;
  }
};

// ==========================================
// 2. GESTIÓN DE INVENTARIO ASESOR
// ==========================================

export const hidratarInventarioAsesor = async (listaInventarioUsuario) => {
  if (!listaInventarioUsuario || listaInventarioUsuario.length === 0) return [];
  const catalogo = await obtenerInventarioDesarrollos();

  return listaInventarioUsuario.map(itemUsuario => {
    if (itemUsuario.tipo === 'db') {
      const dataReal = catalogo.find(d => d.id === itemUsuario.idDesarrollo);
      if (dataReal) {
        return {
          ...itemUsuario, 
          nombre: dataReal.nombre,
          constructora: dataReal.constructora,
          zona: dataReal.zona || dataReal.ubicacion?.ciudad,
          imagen: dataReal.multimedia?.portada || FALLBACK_IMG
        };
      }
    }
    return {
      ...itemUsuario,
      nombre: itemUsuario.nombreManual || 'Desarrollo Desconocido',
      constructora: itemUsuario.constructoraManual || 'N/A',
      zona: 'Manual',
      imagen: FALLBACK_IMG
    };
  });
};

// ==========================================
// 3. GESTIÓN DE LEADS (CRM)
// ==========================================

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

export const actualizarEstadoLead = async (leadId, nuevoEstado, datosExtra = {}) => {
  try {
    const leadRef = doc(db, "leads", leadId);
    const updateData = {
      status: nuevoEstado,
      fechaUltimaInteraccion: serverTimestamp()
    };

    if (nuevoEstado === 'vendido') {
      updateData.cierre = {
        montoFinal: datosExtra.monto,
        modeloFinal: datosExtra.modelo,
        fechaCierre: new Date().toISOString()
      };
    }
    if (nuevoEstado === 'perdido') {
      updateData.motivoPerdida = datosExtra.motivo;
    }

    await updateDoc(leadRef, updateData);
    return true;
  } catch (error) {
    console.error("Error actualizando lead:", error);
    throw error;
  }
};

// ==========================================
// 4. ANALÍTICAS Y SCORE (LÓGICA MEJORADA)
// ==========================================

/**
 * Calcula métricas crudas para visualización
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
    // Si tasa es 10% -> 30 ptos. Si es 5% -> 15 ptos.
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

    console.log(`✅ Score Actualizado: ${scoreFinal} (R:${ptsResenas.toFixed(1)} + A:${ptsActualizacion} + C:${ptsCierre.toFixed(1)} + AD:${ptsAdmin})`);
    return scoreFinal;

  } catch (error) {
    console.error("Error actualizando score:", error);
    return null;
  }
};