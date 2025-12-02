// src/services/catalog.service.js
// ÚLTIMA MODIFICACION: 02/12/2025
import { db } from '../firebase/config';
import { 
  collection, getDocs, doc, getDoc, query, where 
} from 'firebase/firestore';

const FALLBACK_IMG = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png";

// ⭐ Identificador del host que está fallando por DNS/Placeholder
const UNRELIABLE_PLACEHOLDER = "via.placeholder.com"; 

let cacheModelos = null;
let cacheDesarrollos = null;

// --- HELPERS ---
// Función didáctica: Convierte coordenadas string a number de forma segura.
const parseCoord = (val) => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val);
  return 0;
};

// Función didáctica: Normaliza la estructura de imágenes y limpia URLs no deseadas.
const procesarImagenes = (data) => {
  let listaImagenes = [];
  
  // Lógica para extraer imágenes de la estructura 'media' (la actual)
  if (data.media) {
      if (Array.isArray(data.media.gallery)) {
          listaImagenes.push(...data.media.gallery);
      }
      if (data.media.cover) {
          // La portada va primero en la galería si existe
          if (!listaImagenes.includes(data.media.cover)) {
              listaImagenes.unshift(data.media.cover);
          }
      }
  } 
  // Fallback para la estructura antigua o campos raíz
  else if (data.multimedia) {
      if (Array.isArray(data.multimedia.galeria)) listaImagenes.push(...data.multimedia.galeria);
      if (data.multimedia.portada) listaImagenes.unshift(data.multimedia.portada);
  } else {
      if (data.imagen) listaImagenes.push(data.imagen);
  }
  
  // ⭐ FIX CRÍTICO: Filtramos URLs no válidas y el host que está fallando.
  listaImagenes = listaImagenes.filter(url => 
    url && 
    typeof url === 'string' && 
    url.length > 5 && 
    !url.includes(UNRELIABLE_PLACEHOLDER) // Excluimos el placeholder problemático
  );
  
  // Si no queda ninguna imagen válida, usamos el fallback interno
  if (listaImagenes.length === 0) listaImagenes.push(FALLBACK_IMG);

  return { 
      imagen: listaImagenes[0], 
      imagenes: listaImagenes 
  };
};

/**
 * MAPPER (DTO) - ROBUSTO
 * Adapta la estructura real de Firestore a la estructura que necesita la UI.
 */
const mapModelo = (docSnapshot) => {
  const data = docSnapshot.data();
  const imgs = procesarImagenes(data);

  return {
    ...data, // Conservamos data cruda por seguridad
    id: docSnapshot.id,
    
    // 1. Identificación Normalizada
    nombre_modelo: data.nombreModelo || data.nombre_modelo || 'Modelo',
    nombreDesarrollo: data.nombreDesarrollo || '',
    constructora: data.constructora || '',
    
    // 2. Características (Tipos limpios)
    recamaras: Number(data.recamaras) || 0,
    banos: Number(data.banos) || 0,
    niveles: Number(data.niveles) || 0,
    cajones: Number(data.cajones) || 0,
    m2: Number(data.m2) || 0,
    terreno: Number(data.terreno) || 0,
    
    // 3. Precios
    precioNumerico: Number(data.precioNumerico) || 0,
    
    // 4. Imágenes (Limpias y procesadas)
    ...imgs,
    
    // 5. Ubicación y Extras
    amenidadesDesarrollo: Array.isArray(data.amenidadesDesarrollo) ? data.amenidadesDesarrollo : [],
    // Exponemos keywords para la búsqueda optimizada en Catalogo.jsx
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
    
    tipoVivienda: data.tipoVivienda || 'Propiedad',
    esPreventa: data.esPreventa === true, // Asegura booleano
    
    // Aplanamos ubicación
    zona: data.ubicacion?.zona || '',
    ciudad: data.ubicacion?.ciudad || '',
    colonia: data.ubicacion?.colonia || '',
    
    // Coordenadas (Parseo forzoso a Number por inconsistencia en DB)
    latitud: parseCoord(data.ubicacion?.latitud),
    longitud: parseCoord(data.ubicacion?.longitud)
  };
};

// --- FUNCIONES EXPORTADAS (Usan el mapeo actualizado) ---

export const obtenerDatosUnificados = async () => {
  if (cacheModelos) return cacheModelos;
  try {
    // PORQUÉ: Usar mapModelo aquí garantiza que todos los modelos tengan datos limpios y URL de imágenes válidas.
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

    const dataDev = docSnap.data();
    const imgsDev = procesarImagenes(dataDev); 

    // Aquí usamos la estructura de Desarrollo (media en DB)
    return { 
        ...dataDev, 
        id: docSnap.id, 
        modelos,
        // Usamos la imagen principal limpia como portada
        multimedia: { 
            portada: imgsDev.imagen,
            galeria: imgsDev.imagenes,
            video: dataDev.media?.video || dataDev.multimedia?.video,
            brochure: dataDev.media?.brochure || dataDev.multimedia?.brochure
        }
    };
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
        const imgs = procesarImagenes(dataReal);
        return {
          ...itemUsuario, 
          nombre: dataReal.nombre,
          constructora: dataReal.constructora,
          zona: dataReal.zona || dataReal.ubicacion?.ciudad,
          imagen: imgs.imagen
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