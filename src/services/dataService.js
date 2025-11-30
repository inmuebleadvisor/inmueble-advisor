// src/services/dataService.js
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';

// --- CACHÉ EN MEMORIA ---
// Guardamos los datos aquí para no volver a pedirlos a Firebase si el usuario navega entre pantallas.
let cacheModelos = null;
let cacheDesarrollos = null; // ✅ Nuevo caché para inventario y amenidades

// --- CONSTANTES ---
const FALLBACK_IMG = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png";

// --- HELPERS INTERNOS ---

// Lógica de seguridad para imágenes: Si faltan, usa fallback.
const procesarImagenes = (data) => {
  let listaImagenes = [];

  // 1. Galería del Modelo
  if (Array.isArray(data.multimedia?.galeria) && data.multimedia.galeria.length > 0) {
    listaImagenes.push(...data.multimedia.galeria);
  }

  // 2. Plantas
  if (data.multimedia?.planta_baja) listaImagenes.push(data.multimedia.planta_baja);
  if (data.multimedia?.planta_alta) listaImagenes.push(data.multimedia.planta_alta);

  // 3. Fallback: Si no hay fotos, intentar usar portada del desarrollo
  if (listaImagenes.length === 0 && data.portadaDesarrollo) {
    listaImagenes.push(data.portadaDesarrollo);
  }

  // 4. Limpieza de URLs vacías
  listaImagenes = listaImagenes.filter(url => url && typeof url === 'string' && url.length > 5);

  // 5. Fallback Final
  if (listaImagenes.length === 0) listaImagenes.push(FALLBACK_IMG);

  return {
    imagen: listaImagenes[0], // Miniatura principal
    imagenes: listaImagenes   // Carrusel completo
  };
};

// --- FUNCIONES PÚBLICAS (ASÍNCRONAS) ---

/**
 * 1. CATÁLOGO Y PERFIL: Obtiene todos los modelos (casas).
 * Usa caché para velocidad instantánea al volver atrás.
 */
export const obtenerDatosUnificados = async () => {
  if (cacheModelos) return cacheModelos;

  try {
    const querySnapshot = await getDocs(collection(db, "modelos"));
    
    const modelos = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const imgs = procesarImagenes(data);

      return {
        ...data,
        id: doc.id,
        ...imgs // Sobrescribimos con las imágenes procesadas
      };
    });

    cacheModelos = modelos;
    return modelos;
  } catch (error) {
    console.error("Error obteniendo modelos:", error);
    return [];
  }
};

/**
 * 2. ONBOARDING ASESOR: Obtiene lista ligera de desarrollos.
 * Optimizado para el buscador del wizard (Solo ID, Nombre, Constructora).
 */
export const obtenerInventarioDesarrollos = async () => {
  // Si ya tenemos caché (quizás cargado por 'obtenerTopAmenidades'), lo reusamos
  if (cacheDesarrollos) {
    return mapearDesarrollosSimples(cacheDesarrollos);
  }

  try {
    const snap = await getDocs(collection(db, "desarrollos"));
    // Guardamos la data completa en caché
    cacheDesarrollos = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return mapearDesarrollosSimples(cacheDesarrollos);
  } catch (error) {
    console.error("Error cargando inventario:", error);
    return [];
  }
};

// Helper privado para limpiar la data que va al componente de Onboarding
const mapearDesarrollosSimples = (lista) => {
  return lista.map(d => ({
    id: d.id,
    nombre: d.nombre,
    constructora: d.constructora || 'Constructora General',
    ciudad: d.ubicacion?.ciudad || 'General'
  }));
};

/**
 * 3. FILTROS CATÁLOGO: Calcula amenidades más comunes.
 */
export const obtenerTopAmenidades = async () => {
  // Reutilizamos el mismo caché de desarrollos si existe
  if (!cacheDesarrollos) {
    try {
      const snap = await getDocs(collection(db, "desarrollos"));
      cacheDesarrollos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error obteniendo desarrollos para amenidades:", error);
      return [];
    }
  }

  const conteo = {};
  cacheDesarrollos.forEach(d => {
    if (Array.isArray(d.amenidades)) {
      d.amenidades.forEach(am => {
        if (am) {
          const key = am.trim();
          conteo[key] = (conteo[key] || 0) + 1;
        }
      });
    }
  });
  
  // Retornamos el Top 5 más repetido
  return Object.keys(conteo).sort((a, b) => conteo[b] - conteo[a]).slice(0, 5);
};

/**
 * 4. DETALLE: Obtiene un desarrollo específico y sus modelos.
 * Siempre hace fetch fresco para asegurar precios actualizados.
 */
export const obtenerInformacionDesarrollo = async (idDesarrollo) => {
  try {
    const idStr = String(idDesarrollo).trim();
    
    // A. Datos del Desarrollo
    const docRef = doc(db, "desarrollos", idStr);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;
    const desarrolloData = docSnap.data();

    // B. Sus Modelos
    const q = query(collection(db, "modelos"), where("id_desarrollo", "==", idStr));
    const modelosSnap = await getDocs(q);
    
    const modelos = modelosSnap.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        ...procesarImagenes(data)
      };
    });

    return {
      ...desarrolloData,
      id: docSnap.id,
      modelos: modelos
    };

  } catch (error) {
    console.error("Error cargando detalle desarrollo:", error);
    return null;
  }
};