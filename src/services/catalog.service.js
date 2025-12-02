// src/services/catalog.service.js
// ÚLTIMA MODIFICACION: 02/12/2025
import { db } from '../firebase/config';
import { 
  collection, getDocs, doc, getDoc, query, where,
  // ✅ NUEVOS IMPORTS PARA BUSCADOR Y PAGINACIÓN
  orderBy, limit, startAfter, and 
} from 'firebase/firestore';

/**
 * ==========================================
 * SERVICIO DE CATÁLOGO (OPTIMIZADO V3 - Pagina por Demanda)
 * La función obtenerDatosUnificados ya NO debe usarse para el catálogo principal
 * por problemas de escalabilidad (carga toda la DB en memoria).
 * ==========================================
 */

const FALLBACK_IMG = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png";

let cacheModelos = null;
let cacheDesarrollos = null;

// --- HELPERS ---
const VALID_PAGE_SIZE = 12; // Cantidad de propiedades a cargar por scroll/página

const validarImagen = (url) => {
  if (!url) return FALLBACK_IMG;
  if (typeof url !== 'string') return FALLBACK_IMG;
  // Filtramos la URL de placeholder que causaba lentitud
  if (url.includes('via.placeholder.com')) return FALLBACK_IMG;
  return url;
};

const mapModelo = (docSnapshot) => {
  const data = docSnapshot.data();

  return {
    ...data,
    id: docSnapshot.id,
    nombre_modelo: data.nombreModelo || data.nombre_modelo || 'Modelo',
    nombreDesarrollo: data.nombreDesarrollo || '',
    constructora: data.constructora || '',
    recamaras: data.recamaras ?? 0,
    banos: data.banos ?? 0,
    m2: data.m2 ?? 0,
    precioNumerico: data.precioNumerico ?? 0,
    imagen: validarImagen(data.media?.cover), 
    imagenes: Array.isArray(data.media?.gallery) 
      ? data.media.gallery.map(validarImagen).filter(img => img !== FALLBACK_IMG) 
      : [], 
    video: data.media?.video || null,
    brochure: data.media?.brochure || null,
    amenidadesDesarrollo: Array.isArray(data.amenidades) ? data.amenidades : [],
    tipoVivienda: data.tipoVivienda || 'Propiedad',
    esPreventa: data.esPreventa === true,
    keywords: data.keywords || [],
    zona: data.ubicacion?.zona || '',
    ciudad: data.ubicacion?.ciudad || '',
    colonia: data.ubicacion?.colonia || '',
    latitud: data.ubicacion?.latitud || 0,
    longitud: data.ubicacion?.longitud || 0
  };
};

const mapDesarrollo = (docSnapshot) => {
  const data = docSnapshot.data();
  
  return {
    ...data,
    id: docSnapshot.id,
    media: data.media || {},
    portada: validarImagen(data.media?.cover),
    keywords: data.keywords || [],
    amenidades: Array.isArray(data.amenidades) ? data.amenidades : [], 
    ubicacion: data.ubicacion || {},
  }
}

// --- FUNCIONES CLAVE DE LA FASE 3 ---

/**
 * Consulta la colección 'modelos' aplicando filtros avanzados y paginación.
 * * @param {Object} filtros - Objeto con los filtros de la UI (Catalogo.jsx)
 * @param {Object} [lastVisible] - Último documento de la página anterior (para paginación)
 * @returns {Promise<{modelos: Array, lastVisible: Object, hasMore: Boolean}>}
 */
export const queryCatalog = async (filtros, lastVisible = null) => {
    // 1. INICIO DE LA QUERY BASE (Ordenamiento fijo para paginación)
    let q = query(
        collection(db, "modelos"),
        orderBy("precioNumerico", "asc"), // Ordenar por precio es un buen default para el catálogo
        limit(VALID_PAGE_SIZE)
    );
    
    // Almacenamos las cláusulas WHERE en un array para simplificar la lógica.
    const queryConstraints = [];

    // 2. FILTRO DE BÚSQUEDA POR KEYWORDS (El más rápido)
    // El frontend ya nos envía los searchTerms normalizados
    if (filtros.searchTerms && filtros.searchTerms.length > 0) {
        // Didáctica: array-contains-any es una consulta rápida que verifica 
        // si el array 'keywords' del documento contiene alguna de las palabras buscadas.
        queryConstraints.push(where("keywords", "array-contains-any", filtros.searchTerms));
    }
    
    // 3. FILTROS NUMÉRICOS Y DE ESTADO (Constraints simples)
    if (filtros.precioMax) {
        queryConstraints.push(where("precioNumerico", "<=", filtros.precioMax));
    }
    if (filtros.habitaciones > 0) {
        queryConstraints.push(where("recamaras", ">=", filtros.habitaciones));
    }
    if (filtros.status === 'inmediata') {
        queryConstraints.push(where("esPreventa", "==", false));
    }
    if (filtros.status === 'preventa') {
        queryConstraints.push(where("esPreventa", "==", true));
    }
    
    // 4. PAGINACIÓN (Scroll Infinito)
    if (lastVisible) {
        // startAfter indica dónde continuar la lectura a partir del último elemento visible.
        q = query(q, startAfter(lastVisible));
    }

    // 5. CONSTRUCCIÓN FINAL DE LA QUERY
    // Si hay constraints, usamos 'and' para combinarlas (si tu versión de Firebase lo soporta)
    if (queryConstraints.length > 0) {
        // Nota: Si 'and' no funciona en tu entorno, debes pedirle al usuario que cree índices compuestos manualmente.
        q = query(collection(db, "modelos"), and(...queryConstraints), orderBy("precioNumerico", "asc"), limit(VALID_PAGE_SIZE));
    }

    // 6. EJECUCIÓN
    try {
        const snap = await getDocs(q);
        
        const modelos = snap.docs.map(mapModelo);
        
        // El último documento leído es el cursor para la siguiente página
        const nextLastVisible = snap.docs[snap.docs.length - 1] || null;

        // Si obtuvimos menos resultados que el límite, no hay más páginas.
        const hasMore = snap.docs.length === VALID_PAGE_SIZE; 

        return { modelos, lastVisible: nextLastVisible, hasMore };
        
    } catch (error) {
        console.error("Error al ejecutar queryCatalog:", error);
        // Si hay un error, lo más probable es que falte un índice.
        // El error de Firebase sugerirá el índice a crear.
        return { modelos: [], lastVisible: null, hasMore: false };
    }
};

// --- FUNCIONES LEGACY (Se mantienen para otros Contextos/Servicios) ---

export const obtenerDatosUnificados = async () => {
  // Nota: Esta función ya no debe usarse para cargar el catálogo principal.
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
    cacheDesarrollos = snap.docs.map(mapDesarrollo);
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

    return { ...mapDesarrollo(docSnap), modelos };
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
          zona: dataReal.ubicacion?.zona || dataReal.ubicacion?.ciudad,
          imagen: dataReal.portada || FALLBACK_IMG 
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