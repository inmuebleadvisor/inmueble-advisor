// src/services/catalog.service.js
import { db } from '../firebase/config';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  where 
} from 'firebase/firestore';

/**
 * ==========================================
 * SERVICIO DE CATÁLOGO (PÚBLICO)
 * ==========================================
 */

const FALLBACK_IMG = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png";

let cacheModelos = null;
let cacheDesarrollos = null;

// --- HELPERS DE NORMALIZACIÓN ---

const procesarImagenes = (data) => {
  let listaImagenes = [];
  
  // 1. Galería (Array)
  if (Array.isArray(data.multimedia?.galeria)) {
    listaImagenes.push(...data.multimedia.galeria);
  }
  
  // 2. Plantas (Strings individuales)
  if (data.multimedia?.planta_baja) listaImagenes.push(data.multimedia.planta_baja);
  if (data.multimedia?.planta_alta) listaImagenes.push(data.multimedia.planta_alta);
  
  // 3. Portadas (Desarrollo o Modelo)
  if (data.portadaDesarrollo) listaImagenes.push(data.portadaDesarrollo);
  if (data.imagen) listaImagenes.push(data.imagen); 

  // Limpieza de URLs vacías
  listaImagenes = listaImagenes.filter(url => url && typeof url === 'string' && url.length > 5);
  
  if (listaImagenes.length === 0) listaImagenes.push(FALLBACK_IMG);

  return { imagen: listaImagenes[0], imagenes: listaImagenes };
};

/**
 * MAPPER PRINCIPAL (DTO)
 * Transforma el JSON crudo de Firestore al formato plano que necesita React.
 * Basado en la estructura real:
 * - recamaras/banos -> data.caracteristicas
 * - m2 -> data.dimensiones.construccion
 */
const mapModelo = (docSnapshot) => {
  const data = docSnapshot.data();
  const imgs = procesarImagenes(data);

  return {
    ...data, // Conservamos todo por si acaso
    id: docSnapshot.id,
    
    // 1. Identificación
    nombre_modelo: data.nombre_modelo || 'Modelo',
    nombreDesarrollo: data.nombreDesarrollo || '',
    constructora: data.constructora || '',
    
    // 2. Características (Extracción profunda y conversión a Número)
    // El JSON muestra: "caracteristicas": { "recamaras": "2", "banos": "1" }
    recamaras: Number(data.caracteristicas?.recamaras || 0),
    banos: Number(data.caracteristicas?.banos || 0),
    niveles: Number(data.caracteristicas?.niveles || 0),
    cajones: Number(data.caracteristicas?.cajones || 0),

    // 3. Dimensiones
    // El JSON muestra: "dimensiones": { "construccion": "56" }
    m2: Number(data.dimensiones?.construccion || 0),
    terreno: Number(data.dimensiones?.terreno || 0),
    
    // 4. Precios
    precioNumerico: Number(data.precioNumerico || 0),
    
    // 5. Imágenes
    ...imgs,
    
    // 6. Ubicación y Extras
    amenidadesDesarrollo: Array.isArray(data.amenidadesDesarrollo) ? data.amenidadesDesarrollo : [],
    tipoVivienda: data.tipo_vivienda || 'Propiedad', // Nota: JSON tiene 'tipo_vivienda' snake_case
    esPreventa: data.esPreventa === true,
    
    // Aplanamos ubicación para facilitar uso (opcional)
    zona: data.ubicacion?.zona || '',
    ciudad: data.ubicacion?.ciudad || '',
    colonia: data.ubicacion?.colonia || ''
  };
};

// --- FUNCIONES EXPORTADAS ---

export const obtenerDatosUnificados = async () => {
  if (cacheModelos) return cacheModelos;
  try {
    const snap = await getDocs(collection(db, "modelos"));
    const modelos = snap.docs.map(mapModelo); // Usamos el mapper corregido
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
  // Nota: Las amenidades vienen en los modelos como 'amenidadesDesarrollo', 
  // o podemos sacarlas de la colección 'desarrollos'.
  // Para ser consistentes con la vista actual, usamos la colección de desarrollos.
  const desarrollos = await obtenerInventarioDesarrollos();
  const conteo = {};
  
  desarrollos.forEach(d => {
    // El JSON de Desarrollo muestra 'amenidades' como array directo
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
    const modelos = modelosSnap.docs.map(mapModelo); // Reutilizamos el mapper

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