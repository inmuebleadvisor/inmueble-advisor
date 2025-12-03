// src/services/catalog.service.js
// ÚLTIMA MODIFICACION: 02/12/2025
import { db } from '../firebase/config';
import { 
  collection, getDocs, doc, getDoc, query, where 
} from 'firebase/firestore';

const FALLBACK_IMG = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png";
const UNRELIABLE_PLACEHOLDER = "via.placeholder.com"; 

let cacheModelos = null;
let cacheDesarrollos = null;

// --- HELPERS ---

// Convierte coordenadas a número de forma segura (Didáctico: Manejo de tipos mixtos)
const parseCoord = (val) => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Procesa imágenes para obtener estructura limpia { imagen, imagenes }
const procesarImagenes = (data) => {
  let listaImagenes = [];
  let portada = FALLBACK_IMG;

  // 1. Prioridad: Nuevo Schema (media: { cover, gallery })
  if (data.media) {
    if (data.media.cover) {
        portada = data.media.cover;
        listaImagenes.push(portada);
    }
    if (Array.isArray(data.media.gallery)) {
        listaImagenes = [...listaImagenes, ...data.media.gallery];
    }
  } 
  // 2. Fallback: Schema Viejo (multimedia)
  else if (data.multimedia) {
    if (data.multimedia.portada) portada = data.multimedia.portada;
    if (Array.isArray(data.multimedia.galeria)) listaImagenes = data.multimedia.galeria;
  } 
  // 3. Fallback Final: Campo raíz
  else if (data.imagen) {
      portada = data.imagen;
      listaImagenes.push(data.imagen);
  }

  // Limpieza de URLs
  listaImagenes = listaImagenes.filter(url => 
    url && typeof url === 'string' && url.length > 10 && !url.includes(UNRELIABLE_PLACEHOLDER)
  );
  listaImagenes = [...new Set(listaImagenes)]; // Unique

  if(listaImagenes.length === 0) listaImagenes.push(FALLBACK_IMG);

  return { imagen: portada, imagenes: listaImagenes };
};

// --- MAPPERS (Transformación de Datos) ---

const mapModelo = (docSnapshot) => {
  const data = docSnapshot.data();
  const imgs = procesarImagenes(data);

  // Extracción segura del precio
  let precioFinal = 0;
  if (data.precios && typeof data.precios.base === 'number') {
      precioFinal = data.precios.base;
  } else if (data.precioNumerico) {
      precioFinal = Number(data.precioNumerico);
  }

  return {
    ...data, // Mantenemos toda la data original por seguridad
    id: docSnapshot.id,
    
    // 1. Identificación Normalizada
    // Buscamos cualquier variante del ID del padre para evitar la "Llave Rota"
    idDesarrollo: data.idDesarrollo || data.id_desarrollo || data.desarrollo_id || '',
    nombre_modelo: data.nombreModelo || data.nombre_modelo || 'Modelo',
    nombreDesarrollo: data.nombreDesarrollo || '',
    constructora: data.constructora || '',

    // 2. Precios
    precioNumerico: precioFinal,
    precios: data.precios || {}, // Se conserva el objeto completo para mantenimientos, etc.

    // 3. Imágenes
    imagen: imgs.imagen,
    imagenes: imgs.imagenes,

    // 4. Datos Numéricos (Casting seguro)
    recamaras: Number(data.recamaras) || 0,
    banos: Number(data.banos) || 0,
    niveles: Number(data.niveles) || 0,
    cajones: Number(data.cajones) || 0,
    m2: Number(data.m2) || 0,
    terreno: Number(data.terreno) || 0,

    // 5. Ubicación APLANADA (Vital para filtros de CatalogContext)
    zona: data.ubicacion?.zona || '',
    ciudad: data.ubicacion?.ciudad || '',
    colonia: data.ubicacion?.colonia || '',
    latitud: parseCoord(data.ubicacion?.latitud),
    longitud: parseCoord(data.ubicacion?.longitud),
    ubicacion: data.ubicacion || {}, // Objeto completo también disponible

    // 6. Extras y Clasificación
    amenidades: Array.isArray(data.amenidades) ? data.amenidades : [],
    amenidadesDesarrollo: Array.isArray(data.amenidadesDesarrollo) ? data.amenidadesDesarrollo : [],
    keywords: Array.isArray(data.keywords) ? data.keywords : [], // Vital para búsqueda
    tipoVivienda: data.tipoVivienda || 'Propiedad',
    esPreventa: data.esPreventa === true,
    
    // Info Comercial (Modelo)
    infoComercial: data.infoComercial || {}
  };
};

const mapDesarrollo = (docSnapshot) => {
    const data = docSnapshot.data();
    const imgs = procesarImagenes(data);

    return {
        ...data,
        id: docSnapshot.id,
        nombre: data.nombre || 'Desarrollo',
        
        // Datos específicos de Desarrollo
        info_comercial: data.info_comercial || {}, // snake_case según PDF
        amenidades: Array.isArray(data.amenidades) ? data.amenidades : [],
        keywords: Array.isArray(data.keywords) ? data.keywords : [],

        // Imágenes
        imagen: imgs.imagen,
        multimedia: { 
            portada: imgs.imagen,
            galeria: imgs.imagenes,
            video: data.media?.video || data.multimedia?.video || null,
            brochure: data.media?.brochure || data.multimedia?.brochure || null
        },

        // Ubicación
        ubicacion: data.ubicacion || {},
        zona: data.ubicacion?.zona || '', // Aplanado para hidratar inventario asesor
        latitud: parseCoord(data.ubicacion?.latitud),
        longitud: parseCoord(data.ubicacion?.longitud)
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
    console.error("Error obteniendo modelos:", error);
    return [];
  }
};

export const obtenerInventarioDesarrollos = async () => {
  if (cacheDesarrollos) return cacheDesarrollos;
  try {
    const snap = await getDocs(collection(db, "desarrollos"));
    const desarrollos = snap.docs.map(mapDesarrollo);
    cacheDesarrollos = desarrollos;
    return desarrollos;
  } catch (error) {
    console.error("Error obteniendo desarrollos:", error);
    return [];
  }
};

export const obtenerTopAmenidades = async () => {
  const desarrollos = await obtenerInventarioDesarrollos();
  const conteo = {};
  desarrollos.forEach(d => {
    if (Array.isArray(d.amenidades)) {
      d.amenidades.forEach(am => {
        if(am) {
            const cleanAm = am.trim();
            conteo[cleanAm] = (conteo[cleanAm] || 0) + 1;
        }
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
    
    const desarrolloData = mapDesarrollo(docSnap);

    // Búsqueda de modelos hijos usando el ID normalizado (o intentando variantes)
    // Nota: Firestore requiere coincidencia exacta en el campo de la DB.
    // Asumimos 'idDesarrollo' como estándar, pero agregamos fallback en memoria si es necesario.
    const q = query(collection(db, "modelos"), where("idDesarrollo", "==", id));
    // Si tu DB vieja usa 'id_desarrollo', cambia la línea anterior. 
    // Si tienes mezcla, es mejor traer todo y filtrar en cliente (si son pocos) o usar 'OR' (avanzado).
    
    const modelosSnap = await getDocs(q);
    
    // Si la query directa falla por mezcla de campos (camelCase vs snake_case),
    // una estrategia de seguridad es traer por 'id_desarrollo' también si la primera trajo 0.
    let modelosRaw = modelosSnap.docs;
    if (modelosRaw.length === 0) {
        const q2 = query(collection(db, "modelos"), where("id_desarrollo", "==", id));
        const modelosSnap2 = await getDocs(q2);
        modelosRaw = modelosSnap2.docs;
    }

    const modelos = modelosRaw.map(mapModelo); 

    return { ...desarrolloData, modelos };
  } catch (error) {
    console.error("Error en detalle desarrollo:", error);
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
          // Usamos 'zona' que nos aseguramos de aplanar en mapDesarrollo
          zona: dataReal.zona || dataReal.ubicacion?.ciudad || 'Zona N/A',
          imagen: dataReal.imagen
        };
      }
    }
    return {
      ...itemUsuario,
      nombre: itemUsuario.nombreManual || 'Desarrollo Desconocido',
      constructora: 'Manual',
      zona: 'N/A',
      imagen: FALLBACK_IMG
    };
  });
};