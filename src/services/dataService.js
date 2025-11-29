// src/services/dataService.js
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';

// --- CACHÉ EN MEMORIA ---
// Guardamos los datos aquí para no volver a pedirlos a Firebase si el usuario navega entre pantallas.
// Esto ahorra dinero y hace la app instantánea.
let cacheModelos = null;
let cacheDesarrollos = null;

// --- CONSTANTES ---
const FALLBACK_IMG = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png";

// --- HELPERS INTERNOS ---

// Reconstruimos la lógica de imágenes para asegurar que siempre haya fotos válidas
const procesarImagenes = (data) => {
  let listaImagenes = [];

  // 1. Galería del Modelo
  if (Array.isArray(data.multimedia?.galeria) && data.multimedia.galeria.length > 0) {
    listaImagenes.push(...data.multimedia.galeria);
  }

  // 2. Plantas
  if (data.multimedia?.planta_baja) listaImagenes.push(data.multimedia.planta_baja);
  if (data.multimedia?.planta_alta) listaImagenes.push(data.multimedia.planta_alta);

  // 3. Fallback: Si no hay fotos, intentar usar portada del desarrollo (si se migró denormalizada)
  if (listaImagenes.length === 0 && data.portadaDesarrollo) {
    listaImagenes.push(data.portadaDesarrollo);
  }

  // 4. Limpieza
  listaImagenes = listaImagenes.filter(url => url && typeof url === 'string' && url.length > 5);

  // 5. Fallback Final
  if (listaImagenes.length === 0) listaImagenes.push(FALLBACK_IMG);

  return {
    imagen: listaImagenes[0], // Miniatura principal
    imagenes: listaImagenes   // Carrusel completo
  };
};

// --- FUNCIONES PÚBLICAS (AHORA ASÍNCRONAS) ---

/**
 * Obtiene todos los modelos (casas) de la base de datos.
 * Usa caché para optimizar.
 */
export const obtenerDatosUnificados = async () => {
  // 1. Si ya tenemos datos en memoria, los devolvemos al instante.
  if (cacheModelos) return cacheModelos;

  try {
    // 2. Si no, consultamos Firestore
    const querySnapshot = await getDocs(collection(db, "modelos"));
    
    // 3. Procesamos los resultados
    const modelos = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const imgs = procesarImagenes(data);

      return {
        ...data,
        id: doc.id, // Usamos el ID del documento
        ...imgs     // Sobrescribimos las imágenes procesadas
      };
    });

    // 4. Guardamos en caché y retornamos
    cacheModelos = modelos;
    return modelos;
  } catch (error) {
    console.error("Error obteniendo modelos de Firebase:", error);
    return [];
  }
};

/**
 * Calcula las amenidades más comunes basándose en los desarrollos.
 */
export const obtenerTopAmenidades = async () => {
  // Verificamos caché de desarrollos
  if (!cacheDesarrollos) {
    try {
      const querySnapshot = await getDocs(collection(db, "desarrollos"));
      cacheDesarrollos = querySnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error("Error obteniendo desarrollos:", error);
      return [];
    }
  }

  // Lógica de conteo (igual que antes, pero con datos reales)
  const conteo = {};
  cacheDesarrollos.forEach(d => {
    if (Array.isArray(d.amenidades)) {
      d.amenidades.forEach(am => {
        const key = am.trim();
        conteo[key] = (conteo[key] || 0) + 1;
      });
    }
  });
  
  return Object.keys(conteo).sort((a, b) => conteo[b] - conteo[a]).slice(0, 5);
};

/**
 * Obtiene el detalle de un desarrollo y sus modelos asociados.
 * Hace una consulta fresca para asegurar datos actualizados en la vista de detalle.
 */
export const obtenerInformacionDesarrollo = async (idDesarrollo) => {
  try {
    const idStr = String(idDesarrollo).trim();
    
    // A. Obtener datos del Desarrollo
    const docRef = doc(db, "desarrollos", idStr);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;
    const desarrolloData = docSnap.data();

    // B. Obtener sus Modelos (Query filtrado)
    // Buscamos en la colección 'modelos' donde 'id_desarrollo' coincida
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
      modelos: modelos
    };

  } catch (error) {
    console.error("Error cargando desarrollo:", error);
    return null;
  }
};