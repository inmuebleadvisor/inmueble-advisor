import {
  collection, getDocs, doc, getDoc, query, where
} from 'firebase/firestore';
import { normalizar } from '../utils/formatters';
import { IMAGES, STATUS } from '../config/constants';

const FALLBACK_IMG = IMAGES.FALLBACK_PROPERTY;
const UNRELIABLE_PLACEHOLDER = "via.placeholder.com";

// --- HELPERS (Pure functions) ---

const parseCoord = (val) => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const procesarImagenes = (data) => {
  let listaImagenes = [];
  let portada = null;

  if (data.media) {
    if (data.media.cover) {
      portada = data.media.cover;
      listaImagenes.push(portada);
    }
    if (Array.isArray(data.media.gallery)) {
      listaImagenes = [...listaImagenes, ...data.media.gallery];
    }
  }
  else if (data.multimedia) {
    if (data.multimedia.portada) {
      portada = data.multimedia.portada;
      if (!listaImagenes.includes(portada)) listaImagenes.push(portada);
    }
    if (Array.isArray(data.multimedia.galeria)) {
      listaImagenes = [...listaImagenes, ...data.multimedia.galeria];
    }
  }
  else if (data.imagen) {
    portada = data.imagen;
    listaImagenes.push(data.imagen);
  }

  if (listaImagenes.length === 0 && data.media && Array.isArray(data.media.plantasArquitectonicas) && data.media.plantasArquitectonicas.length > 0) {
    listaImagenes = [...data.media.plantasArquitectonicas];
    if (!portada) portada = listaImagenes[0];
  }

  listaImagenes = listaImagenes.filter(url =>
    url && typeof url === 'string' && url.length > 10 && !url.includes(UNRELIABLE_PLACEHOLDER) && !url.includes('static.wixstatic.com')
  );
  listaImagenes = [...new Set(listaImagenes)];

  if (listaImagenes.length === 0) {
    listaImagenes.push(FALLBACK_IMG);
    if (!portada) portada = FALLBACK_IMG;
  }

  if (!portada && listaImagenes.length > 0) {
    portada = listaImagenes[0];
  }

  return { imagen: portada, imagenes: listaImagenes };
};

const mapModelo = (docSnapshot) => {
  const data = docSnapshot.data();
  const imgs = procesarImagenes(data);

  let precioFinal = 0;
  if (data.precios && typeof data.precios.base === 'number') {
    precioFinal = data.precios.base;
  } else if (data.precioNumerico) {
    precioFinal = Number(data.precioNumerico);
  }

  return {
    ...data,
    id: docSnapshot.id,
    idDesarrollo: data.idDesarrollo || data.id_desarrollo || data.desarrollo_id || '',
    nombre_modelo: data.nombreModelo || data.nombre_modelo || 'Modelo',
    nombreDesarrollo: data.nombreDesarrollo || '',
    constructora: data.constructora || '',
    precioNumerico: precioFinal,
    precios: data.precios || {},
    imagen: imgs.imagen,
    imagenes: imgs.imagenes,
    recamaras: Number(data.recamaras) || 0,
    banos: Number(data.banos) || 0,
    niveles: Number(data.niveles) || 0,
    cajones: Number(data.cajones) || 0,
    m2: Number(data.m2) || 0,
    terreno: Number(data.terreno) || 0,
    zona: data.ubicacion?.zona || '',
    ciudad: data.ubicacion?.ciudad || '',
    colonia: data.ubicacion?.colonia || '',
    latitud: parseCoord(data.ubicacion?.latitud),
    longitud: parseCoord(data.ubicacion?.longitud),
    ubicacion: data.ubicacion || {},
    amenidades: Array.isArray(data.amenidades) ? data.amenidades : [],
    amenidadesDesarrollo: Array.isArray(data.amenidadesDesarrollo) ? data.amenidadesDesarrollo : [],
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
    tipoVivienda: data.tipoVivienda || 'Propiedad',
    esPreventa: (data.esPreventa === true || data.esPreventa === 'true' || data.esPreventa === 1),
    infoComercial: data.infoComercial || {},
    activo: data.activo !== undefined ? data.activo !== false : (data.ActivoModelo !== false),
    plantas: (data.media && Array.isArray(data.media.plantasArquitectonicas)) ? data.media.plantasArquitectonicas : []
  };
};

const mapDesarrollo = (docSnapshot) => {
  const data = docSnapshot.data();
  const imgs = procesarImagenes(data);

  return {
    ...data,
    id: docSnapshot.id,
    nombre: data.nombre || 'Desarrollo',
    info_comercial: data.infoComercial || data.info_comercial || {},
    amenidades: Array.isArray(data.amenidades) ? data.amenidades : [],
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
    precioDesde: (data.precios && data.precios.desde) ? data.precios.desde : (data.precioDesde || 0),
    precios: data.precios || {},
    imagen: imgs.imagen,
    multimedia: {
      portada: imgs.imagen,
      galeria: imgs.imagenes,
      video: data.media?.video || data.multimedia?.video || null,
      brochure: data.media?.brochure || data.multimedia?.brochure || null
    },
    ubicacion: data.ubicacion || {},
    zona: data.ubicacion?.zona || '',
    latitud: parseCoord(data.ubicacion?.latitud),
    longitud: parseCoord(data.ubicacion?.longitud),
    activo: data.activo !== false
  };
};

const FIRESTORE_BATCH_LIMIT = 30;

// --- CLASS SERVICE ---

export class CatalogService {
  constructor(db) {
    this.db = db;
    this.cacheModelos = null;
    this.lastCityCached = null;
    this.cacheDesarrollos = null;
  }

  async obtenerDatosUnificados(ciudadFilter = null) {
    if (this.cacheModelos && this.lastCityCached === ciudadFilter) return this.cacheModelos;

    try {
      let modelos = [];

      if (ciudadFilter) {
        let devIds = [];
        if (this.cacheDesarrollos) {
          devIds = this.cacheDesarrollos
            .filter(d => d.ubicacion?.ciudad === ciudadFilter)
            .map(d => d.id);
        } else {
          const qDevs = query(collection(this.db, "desarrollos"), where("ubicacion.ciudad", "==", ciudadFilter));
          const snapDevs = await getDocs(qDevs);
          devIds = snapDevs.docs.map(d => d.id);
        }

        if (devIds.length === 0) {
          console.warn(`⚠️ No se encontraron desarrollos en ${ciudadFilter}`);
          return [];
        }

        const chunks = [];
        for (let i = 0; i < devIds.length; i += FIRESTORE_BATCH_LIMIT) {
          chunks.push(devIds.slice(i, i + FIRESTORE_BATCH_LIMIT));
        }

        const promises = chunks.map(async (chunkIds) => {
          const qModelos = query(collection(this.db, "modelos"), where("idDesarrollo", "in", chunkIds));
          const snap = await getDocs(qModelos);
          return snap.docs.map(mapModelo);
        });

        const results = await Promise.all(promises);
        modelos = results.flat();

      } else {
        const snap = await getDocs(collection(this.db, "modelos"));
        modelos = snap.docs.map(mapModelo);
      }

      this.cacheModelos = modelos;
      this.lastCityCached = ciudadFilter;

      return modelos;
    } catch (error) {
      console.error("Error obteniendo modelos:", error);
      return [];
    }
  }

  async obtenerCiudadesDisponibles() {
    const desarrollos = await this.obtenerInventarioDesarrollos();
    const ciudades = new Set();
    desarrollos.forEach(d => {
      const city = d.ubicacion?.ciudad;
      if (city) {
        ciudades.add(city.trim());
      }
    });
    return Array.from(ciudades).sort();
  }

  async obtenerInventarioDesarrollos() {
    if (this.cacheDesarrollos) return this.cacheDesarrollos;
    try {
      const snap = await getDocs(collection(this.db, "desarrollos"));
      const desarrollos = snap.docs.map(mapDesarrollo);
      this.cacheDesarrollos = desarrollos;
      return desarrollos;
    } catch (error) {
      console.error("Error obteniendo desarrollos:", error);
      return [];
    }
  }

  async obtenerTopAmenidades() {
    const desarrollos = await this.obtenerInventarioDesarrollos();
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
  }

  async obtenerInformacionDesarrollo(id) {
    try {
      const docRef = doc(this.db, "desarrollos", String(id).trim());
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;

      const desarrolloData = mapDesarrollo(docSnap);

      const q = query(collection(this.db, "modelos"), where("idDesarrollo", "==", id));
      const modelosSnap = await getDocs(q);

      let modelosRaw = modelosSnap.docs;
      // Fallback for snake_case
      if (modelosRaw.length === 0) {
        const q2 = query(collection(this.db, "modelos"), where("id_desarrollo", "==", id));
        const modelosSnap2 = await getDocs(q2);
        modelosRaw = modelosSnap2.docs;
      }

      const modelos = modelosRaw.map(mapModelo);

      return { ...desarrolloData, modelos };
    } catch (error) {
      console.error("Error en detalle desarrollo:", error);
      return null;
    }
  }

  async hidratarInventarioAsesor(listaInventarioUsuario) {
    if (!listaInventarioUsuario || listaInventarioUsuario.length === 0) return [];
    const catalogo = await this.obtenerInventarioDesarrollos();

    return listaInventarioUsuario.map(itemUsuario => {
      if (itemUsuario.tipo === 'db') {
        const dataReal = catalogo.find(d => d.id === itemUsuario.idDesarrollo);
        if (dataReal) {
          return {
            ...itemUsuario,
            nombre: dataReal.nombre,
            constructora: dataReal.constructora,
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
  }

  // Static Pure Logic Methods
  static filterCatalog(dataMaestra, desarrollos, filters, searchTerm) {
    if (!dataMaestra) return [];
    const term = normalizar(searchTerm);

    return dataMaestra.filter(item => {
      const desarrollo = desarrollos.find(d => String(d.id) === String(item.idDesarrollo));
      if (item.activo === false) return false;
      if (desarrollo && desarrollo.activo === false) return false;

      const precio = Number(item.precioNumerico) || 0;
      if (!filters.showNoPrice && precio <= 0) return false;
      if (precio > 0) {
        if (precio > filters.precioMax) return false;
        if (filters.precioMin && precio < filters.precioMin) return false;
      }

      const recamaras = Number(item.recamaras) || 0;
      if (filters.habitaciones > 0 && recamaras < filters.habitaciones) return false;

      let esPreventa = false;
      if (desarrollo) {
        const statusDesarrollo = String(desarrollo.status || '').toUpperCase().trim();
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
      if (!esPreventa && item.esPreventa) esPreventa = true;

      if (filters.status === 'inmediata' && esPreventa) return false;
      if (filters.status === 'preventa' && !esPreventa) return false;

      if (filters.tipo !== 'all') {
        const tipoItem = normalizar(item.tipoVivienda);
        const tipoFiltro = normalizar(filters.tipo);
        if (!tipoItem.includes(tipoFiltro)) {
          if (tipoFiltro === 'departamento' && (tipoItem.includes('loft') || tipoItem.includes('studio'))) return false;
          return false;
        }
      }

      if (filters.amenidad) {
        const amenidadBuscada = normalizar(filters.amenidad);
        const amDesarrollo = Array.isArray(desarrollo?.amenidades) ? desarrollo.amenidades : [];
        const amModelo = Array.isArray(item.amenidades) ? item.amenidades : [];
        const amModeloDesarrollo = Array.isArray(item.amenidadesDesarrollo) ? item.amenidadesDesarrollo : [];
        const todasAmenidades = [...new Set([...amDesarrollo, ...amModelo, ...amModeloDesarrollo])];
        const tieneAmenidad = todasAmenidades.some(a => normalizar(a).includes(amenidadBuscada));
        if (!tieneAmenidad) return false;
      }

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
  }

  static findClosestByPrice(allModels, filters, limit = 3) {
    if (!allModels || allModels.length === 0) return [];
    let targetPrice = 0;
    if (filters.precioMax < 20000000 && filters.precioMax > 0) {
      if (filters.precioMin > 0) {
        targetPrice = (filters.precioMin + filters.precioMax) / 2;
      } else {
        targetPrice = filters.precioMax;
      }
    }

    const candidates = allModels.filter(m => {
      if (!m.activo) return false;
      const p = m.precioNumerico || 0;
      return p > 0;
    });

    if (candidates.length === 0) return [];

    const IS_DEFAULT_MAX = filters.precioMax >= 15000000;
    if (targetPrice === 0 || (filters.precioMin === 0 && IS_DEFAULT_MAX)) {
      return candidates.sort((a, b) => (a.precioNumerico || 0) - (b.precioNumerico || 0)).slice(0, limit);
    }

    return candidates.sort((a, b) => {
      const distA = Math.abs((a.precioNumerico || 0) - targetPrice);
      const distB = Math.abs((b.precioNumerico || 0) - targetPrice);
      return distA - distB;
    }).slice(0, limit);
  }
}

// --- BACKWARD COMPATIBILITY EXPORTS (Optional/Deprecated) ---
// For now, we allow importing the static functions directly if needed,
// OR we guide consumers to use CatalogService.filterCatalog.
// To avoid "export const" conflicts with class, we attach 'em to class logic or export them as consts if they are outside.
// I kept them INSIDE as static methods. I will NOT export them separately to enforce class usage,
// UNLESS I want to make the refactor strictly 'service' and leave utilities adjacent.
// Plan said: "filterCatalog is logic. I'll make them static methods".
// So I am sticking to static methods.
