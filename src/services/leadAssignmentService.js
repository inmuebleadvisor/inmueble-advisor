// src/services/leadAssignmentService.js
import { db } from '../firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';

/**
 * MOTOR DE ASIGNACIÓN DE LEADS
 * ----------------------------
 * Recibe los datos de un interesado y decide a quién asignárselo
 * basándose en reglas de negocio (Inventario, Historial, Score).
 */

export const generarLeadAutomatico = async (datosCliente, idDesarrollo, nombreDesarrollo, modeloInteres) => {
  try {
    console.log(`🤖 Iniciando algoritmo de asignación para: ${nombreDesarrollo}`);

    // 1. OBTENER CANDIDATOS
    // Buscamos todos los asesores. 
    // NOTA: En un sistema masivo, esto se optimiza con "Array Contains" en Firestore,
    // pero para <1000 asesores, filtrar en memoria es más flexible y barato.
    const usersRef = collection(db, "users");
    const qAsesores = query(usersRef, where("role", "==", "asesor"));
    const snapshot = await getDocs(qAsesores);

    const candidatos = [];
    snapshot.forEach(doc => {
      const asesor = { uid: doc.id, ...doc.data() };
      
      // Filtro 1: ¿Tiene el desarrollo en su inventario y está ACTIVO?
      const tieneDesarrollo = asesor.inventario?.find(item => 
        item.idDesarrollo === idDesarrollo && item.status === 'activo'
      );

      if (tieneDesarrollo) {
        candidatos.push(asesor);
      }
    });

    if (candidatos.length === 0) {
      console.warn("⚠️ No hay asesores disponibles para este desarrollo.");
      // Aquí podrías asignar a un "Admin Default" para no perder el lead
      throw new Error("Sin cobertura de asesores en este desarrollo.");
    }

    // 2. REGLA DE LEALTAD (Prioridad Histórica)
    // Buscamos si este cliente ya tiene leads previos
    // (Usamos el email como identificador único del cliente por ahora)
    const qHistorial = query(
      collection(db, "leads"), 
      where("clienteDatos.email", "==", datosCliente.email)
    );
    const historialSnap = await getDocs(qHistorial);
    
    let asesorGanador = null;
    let motivoAsignacion = "";

    if (!historialSnap.empty) {
      // Tiene historial. Veamos si algún asesor previo está en la lista de candidatos.
      const asesoresPreviosIds = historialSnap.docs.map(d => d.data().asesorUid);
      
      // Buscamos coincidencia
      asesorGanador = candidatos.find(c => asesoresPreviosIds.includes(c.uid));
      
      if (asesorGanador) {
        motivoAsignacion = "Lealtad (Cliente Recurrente)";
      }
    }

    // 3. RANKING DE MÉRITO (Si no hubo lealtad)
    if (!asesorGanador) {
      // Ordenamos a los candidatos
      candidatos.sort((a, b) => {
        // A. Por Score Global (Mayor es mejor)
        const scoreA = a.scoreGlobal || 0;
        const scoreB = b.scoreGlobal || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;

        // B. Desempate: Tasa de Cierre (Mayor es mejor)
        const tasaA = a.metricas?.tasaCierre || 0;
        const tasaB = b.metricas?.tasaCierre || 0;
        if (tasaB !== tasaA) return tasaB - tasaA;

        // C. Desempate Final: Aleatorio (Sort randomizado)
        return 0.5 - Math.random();
      });

      // El ganador es el primero de la lista
      asesorGanador = candidatos[0];
      motivoAsignacion = "Mérito (Score más alto)";
    }

    console.log(`🏆 Asesor Ganador: ${asesorGanador.nombre} (${motivoAsignacion})`);

    // 4. CREAR EL LEAD EN BASE DE DATOS
    const nuevoLead = {
      asesorUid: asesorGanador.uid,
      asesorNombre: asesorGanador.nombre, // Para referencia rápida
      
      clienteDatos: {
        nombre: datosCliente.nombre,
        email: datosCliente.email,
        telefono: datosCliente.telefono,
      },
      
      desarrolloId: idDesarrollo,
      nombreDesarrollo: nombreDesarrollo,
      modeloInteres: modeloInteres || "No especificado",
      
      status: 'nuevo', // Estado inicial del embudo
      origen: 'web_automatico',
      motivoAsignacion: motivoAsignacion,
      
      fechaCreacion: serverTimestamp(),
      fechaUltimaInteraccion: serverTimestamp(),
      
      historial: [
        {
          accion: 'asignacion_automatica',
          fecha: new Date().toISOString(),
          detalle: `Asignado a ${asesorGanador.nombre} por ${motivoAsignacion}`
        }
      ]
    };

    const docRef = await addDoc(collection(db, "leads"), nuevoLead);
    return { success: true, leadId: docRef.id, asesor: asesorGanador };

  } catch (error) {
    console.error("Error en motor de asignación:", error);
    return { success: false, error: error.message };
  }
};