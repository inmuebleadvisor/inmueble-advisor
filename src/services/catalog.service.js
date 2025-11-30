// src/services/catalog.service.js
import { db } from '../firebase/config';
import { 
  collection, getDocs, doc, getDoc, query, where 
} from 'firebase/firestore';

/**
 * ==========================================
 * SERVICIO DE CATÁLOGO (OPTIMIZADO)
 * Lectura directa de datos limpios (Numbers y Enums)
 * ==========================================
 */

const FALLBACK_IMG = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png";

let cacheModelos = null;
let cacheDesarrollos = null;

// --- HELPERS ---
const procesarImagenes = (data) => {
  let listaImagenes = [];
  if (Array.isArray(data.multimedia?.galeria)) listaImagenes.push(...data.multimedia.galeria);
  if (data.multimedia?.planta_baja) listaImagenes.push(data.multimedia.planta_baja);
  if (data.portadaDesarrollo) listaImagenes.push(data.portadaDesarrollo);
  if (data.imagen) listaImagenes.push(data.imagen); 
  
  listaImagenes = listaImagenes.filter(url => url && typeof url === 'string' && url.length > 5);
  if (listaImagenes.length === 0) listaImagenes.push(FALLBACK_IMG);

  return { imagen: listaImagenes[0], imagenes: listaImagenes };
};

/**
 * MAPPER (DTO) - VERSIÓN LIMPIA
 * Ya no parseamos strings. Leemos los números directos de la migración.
 */
const mapModelo = (docSnapshot) => {
  const data = docSnapshot.data();
  const imgs = procesarImagenes(data);

  return {
    ...data, // Conservamos data cruda por seguridad
    id: docSnapshot.id,
    
    // 1. Identificación
    nombre_modelo: data.nombreModelo || data.nombre_modelo || 'Modelo',
    nombreDesarrollo: data.nombreDesarrollo || '',
    constructora: data.constructora || '',
    
    // 2. Características (LECTURA DIRECTA OPTIMIZADA)
    // Usamos el operador ?? para aceptar 0 como valor válido
    recamaras: data.recamaras ?? 0,
    banos: data.banos ?? 0,
    niveles: data.niveles ?? 0,
    cajones: data.cajones ?? 0,
    m2: data.m2 ?? 0,
    terreno: data.terreno ?? 0,
    
    // 3. Precios
    precioNumerico: data.precioNumerico ?? 0,
    
    // 4. Imágenes
    ...imgs,
    
    // 5. Ubicación y Extras
    amenidadesDesarrollo: Array.isArray(data.amenidadesDesarrollo) ? data.amenidadesDesarrollo : [],
    tipoVivienda: data.tipoVivienda || 'Propiedad',
    esPreventa: data.esPreventa === true,
    
    // Aplanamos ubicación
    zona: data.ubicacion?.zona || '',
    ciudad: data.ubicacion?.ciudad || '',
    colonia: data.ubicacion?.colonia || '',
    
    // Coordenadas (Ya son números)
    latitud: data.ubicacion?.latitud || 0,
    longitud: data.ubicacion?.longitud || 0
  };
};

// --- FUNCIONES EXPORTADAS ---

export const obtenerDatosUnificados = async () => {
  if (cacheModelos) return cacheModelos;
  try {
    const snap = await getDocs(collection(db, "modelos"));
    const modelos = snap.docs.map(mapModelo);
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
    // Mapeamos status a español para visualización rápida si es necesario, 
    // pero idealmente usaremos las constantes.
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
    const modelos = modelosSnap.docs.map(mapModelo); 

    return { ...docSnap.data(), id: docSnap.id, modelos };
  } catch (error) {
    console.error("Error detalle desarrollo:", error);
    return null;
  }
};

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