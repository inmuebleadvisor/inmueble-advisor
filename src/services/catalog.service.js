// src/services/catalog.service.js
// ÚLTIMA MODIFICACION: 02/12/2025
import { db } from '../firebase/config';
import {
  collection, getDocs, doc, getDoc, query, where
} from 'firebase/firestore';
import { normalizar } from '../utils/formatters';
import { IMAGES, STATUS } from '../config/constants';

const FALLBACK_IMG = IMAGES.FALLBACK_PROPERTY;
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
  let portada = null;

  // 1. Prioridad: Nuevo Schema (media: { cover, gallery, plantasArquitectonicas })
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
    if (data.multimedia.portada) {
      portada = data.multimedia.portada;
      if (!listaImagenes.includes(portada)) listaImagenes.push(portada);
    }
    if (Array.isArray(data.multimedia.galeria)) {
      listaImagenes = [...listaImagenes, ...data.multimedia.galeria];
    }
  }
  // 3. Fallback Final: Campo raíz
  else if (data.imagen) {
    portada = data.imagen;
    listaImagenes.push(data.imagen);
  }

  // 4. Lógica de Fallback de Plantas (SOLO si la lista está vacía hasta ahora)
  // Requisito: "si no hay imagen principal y tampoco hay galeria, tomaras la galeria de plantas"
  if (listaImagenes.length === 0 && data.media && Array.isArray(data.media.plantasArquitectonicas) && data.media.plantasArquitectonicas.length > 0) {
    listaImagenes = [...data.media.plantasArquitectonicas];
    // Si no había portada, usamos la primera planta como portada
    if (!portada) portada = listaImagenes[0];
  }

  // Limpieza de URLs
  listaImagenes = listaImagenes.filter(url =>
    url && typeof url === 'string' && url.length > 10 && !url.includes(UNRELIABLE_PLACEHOLDER) && !url.includes('static.wixstatic.com')
  );
  listaImagenes = [...new Set(listaImagenes)]; // Unique

  // 5. Placeholder Oficial (Si todo falló)
  if (listaImagenes.length === 0) {
    listaImagenes.push(FALLBACK_IMG);
    if (!portada) portada = FALLBACK_IMG;
  }

  // Aseguramos que 'portada' siempre tenga valor (si la lista tiene algo)
  if (!portada && listaImagenes.length > 0) {
    portada = listaImagenes[0];
  }

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
    tipoVivienda: data.tipoVivienda || 'Propiedad',
    esPreventa: (data.esPreventa === true || data.esPreventa === 'true' || data.esPreventa === 1),

    // Info Comercial (Modelo)
    infoComercial: data.infoComercial || {},

    // 7. Visibilidad
    activo: data.activo !== false // Default to true if undefined
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
    longitud: parseCoord(data.ubicacion?.longitud),

    // Visibilidad
    activo: data.activo !== false // Default to true if undefined
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
        if (am) {
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

/**
 * Filter the catalog based on the provided filters.
 * @param {Array} dataMaestra - List of models.
 * @param {Array} desarrollos - List of developments.
 * @param {Object} filters - Filter criteria.
 * @param {string} searchTerm - Search term.
 * @returns {Array} - Filtered list of models.
 */
export const filterCatalog = (dataMaestra, desarrollos, filters, searchTerm) => {
  if (!dataMaestra) return [];

  // Create a map of developments for faster lookup if needed, 
  // but array find is okay for small datasets. 
  // Keeping logic similar to original for now but isolated.

  const term = normalizar(searchTerm);

  return dataMaestra.filter(item => {
    // JOIN: Buscamos el desarrollo padre para datos faltantes
    const desarrollo = desarrollos.find(d => String(d.id) === String(item.idDesarrollo));

    // --- 0. VISIBILIDAD (NUEVO) ---
    // Si el modelos está inactivo explícitamente, fuera.
    if (item.activo === false) return false;
    // Si el desarrollo padre está inactivo explícitamente, fuera.
    if (desarrollo && desarrollo.activo === false) return false;

    // --- 1. PRECIO ---
    const precio = Number(item.precioNumerico) || 0;

    // Lógica "Show No Price":
    // Si filters.showNoPrice es FALSE (default), ocultamos los de precio 0.
    // Si es TRUE, los permitimos (saltando el chequeo de Minimo).
    if (!filters.showNoPrice && precio <= 0) return false;

    // Filtros normales de rango (solo si tiene precio, o si decidimos cómo filtrar los sin precio en rango)
    // Usualmente los sin precio (0) no entran en rango numérico normal salvo que sea explícito.
    // Si tiene precio > 0, aplicamos rango:
    if (precio > 0) {
      if (precio > filters.precioMax) return false;
      if (filters.precioMin && precio < filters.precioMin) return false;
    }
    // Si precio es 0 y showNoPrice es true, PASA (no return false por rango).


    // --- 2. HABITACIONES ---
    const recamaras = Number(item.recamaras) || 0;
    if (filters.habitaciones > 0 && recamaras < filters.habitaciones) return false;

    // --- 3. STATUS (ETAPA) ---
    let esPreventa = false;

    // Lógica de Prioridad:
    if (desarrollo) {
      // Normalizamos el status para comparación segura
      const statusDesarrollo = String(desarrollo.status || '').toUpperCase().trim();

      // Check explícito contra valores de BD y variaciones comunes
      if (
        statusDesarrollo === 'PRE-VENTA' ||
        statusDesarrollo === 'PREVENTA' ||
        statusDesarrollo === STATUS.DEV_PREALE ||
        statusDesarrollo.includes('PRE-VENTA') ||
        statusDesarrollo.includes('PREVENTA')
      ) {
        esPreventa = true;
      }
    }

    // Si no se detectó por desarrollo, miramos el flag del modelo
    if (!esPreventa && item.esPreventa) {
      esPreventa = true;
    }

    if (filters.status === 'inmediata' && esPreventa) return false;
    if (filters.status === 'preventa' && !esPreventa) return false;

    // --- 4. TIPO ---
    if (filters.tipo !== 'all') {
      const tipoItem = normalizar(item.tipoVivienda);
      const tipoFiltro = normalizar(filters.tipo);

      // Lógica inclusiva: si el tipo de vivienda del item contiene la palabra del filtro, pasa.
      // Ej: "Casa de lujo" pasa con filtro "casa".
      if (!tipoItem.includes(tipoFiltro)) {
        // Excepciones o alias específicos si fueran necesarios:
        // Si buscamos 'departamento', aceptamos 'loft' si queremos agruparlos (opcional, por ahora estricto pero flexible en string)
        if (tipoFiltro === 'departamento' && (tipoItem.includes('loft') || tipoItem.includes('studio'))) {
          // Pasa (Opcional: Descomentar si se desea esta agrupación, por ahora el usuario pidió filtro explícito de Loft también)
          // return true; 
          return false;
        }
        return false;
      }
    }

    // --- 5. AMENIDAD ---
    if (filters.amenidad) {
      const amenidadBuscada = normalizar(filters.amenidad);

      const amDesarrollo = Array.isArray(desarrollo?.amenidades) ? desarrollo.amenidades : [];
      const amModelo = Array.isArray(item.amenidades) ? item.amenidades : [];
      const amModeloDesarrollo = Array.isArray(item.amenidadesDesarrollo) ? item.amenidadesDesarrollo : [];

      const todasAmenidades = [...new Set([...amDesarrollo, ...amModelo, ...amModeloDesarrollo])];

      const tieneAmenidad = todasAmenidades.some(a => normalizar(a).includes(amenidadBuscada));
      if (!tieneAmenidad) return false;
    }

    // --- 6. BÚSQUEDA TEXTO ---
    if (term) {
      const keywordsModelo = Array.isArray(item.keywords) ? item.keywords : [];
      const keywordsDesarrollo = desarrollo && Array.isArray(desarrollo.keywords) ? desarrollo.keywords : [];
      const allKeywords = [...keywordsModelo, ...keywordsDesarrollo];

      if (allKeywords.length > 0) {
        const match = allKeywords.some(k => normalizar(k).includes(term));
        if (!match) {
          const amenidadesTexto = [...(Array.isArray(item.amenidadesDesarrollo) ? item.amenidadesDesarrollo : []), ...(desarrollo?.amenidades || [])].join(' ');
          const searchTarget = `
                   ${normalizar(item.nombre)} ${normalizar(item.nombre_modelo)} ${normalizar(item.nombreDesarrollo)}
                   ${normalizar(item.constructora)} ${normalizar(item.tipoVivienda)}
                   ${normalizar(item.colonia)} ${normalizar(item.ciudad)}
                   ${normalizar(item.zona)} ${normalizar(amenidadesTexto)}
                   ${normalizar(desarrollo?.nombre || '')}
                 `;
          if (!searchTarget.includes(term)) return false;
        }
      } else {
        const amenidadesTexto = [...(Array.isArray(item.amenidadesDesarrollo) ? item.amenidadesDesarrollo : []), ...(desarrollo?.amenidades || [])].join(' ');
        const searchTarget = `
              ${normalizar(item.nombre)} ${normalizar(item.nombre_modelo)} ${normalizar(item.nombreDesarrollo)}
              ${normalizar(item.constructora)} ${normalizar(item.tipoVivienda)}
              ${normalizar(item.colonia)} ${normalizar(item.ciudad)}
              ${normalizar(item.zona)} ${normalizar(amenidadesTexto)}
              ${normalizar(desarrollo?.nombre || '')}
            `;
        if (!searchTarget.includes(term)) return false;
      }
    }
    return true;
  });
};