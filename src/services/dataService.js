import modelosRaw from '../data/modelos.json';
import desarrollosRaw from '../data/desarrollos.json';

// --- HELPERS INTERNOS ---

const normalizar = (texto) => {
  if (!texto) return '';
  return String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

const esFechaFutura = (fechaStr) => {
  if (!fechaStr) return false;
  try {
    const partes = fechaStr.split('/');
    if (partes.length !== 3) return false;
    const fechaEntrega = new Date(partes[2], partes[1] - 1, partes[0]);
    const hoy = new Date();
    return fechaEntrega > hoy;
  } catch (e) { return false; }
};

const generarIdModelo = (idDesarrollo, nombreModelo, index) => {
  const nombreSlug = (nombreModelo || 'modelo').toLowerCase().replace(/\s+/g, '-');
  return `${idDesarrollo}-${nombreSlug}-${index}`;
};

const limpiarPrecio = (valor) => {
  if (!valor) return 0;
  return Number(String(valor).replace(/[^0-9.]/g, ""));
};

const FALLBACK_IMG = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png";

// --- LÓGICA PRINCIPAL ---

export const obtenerDatosUnificados = () => {
  // 1. Indexar Desarrollos
  const desarrolloMap = new Map();
  desarrollosRaw.forEach(d => {
    const idDev = String(d.id_desarrollo).trim();
    if (idDev) desarrolloMap.set(idDev, d);
  });

  // 2. Procesar Modelos
  return modelosRaw.map((modelo, index) => {
    const idDev = String(modelo.id_desarrollo).trim();
    const desarrolloInfo = desarrolloMap.get(idDev);

    // --- A. LÓGICA DE PRECIO ---
    let precioFinal = 0;
    if (modelo.precio?.actual && modelo.precio.actual !== "") {
      precioFinal = limpiarPrecio(modelo.precio.actual);
    } else if (modelo.precio?.inicial && modelo.precio.inicial !== "") {
      precioFinal = limpiarPrecio(modelo.precio.inicial);
    }

    // --- B. LÓGICA DE TIPO VIVIENDA ---
    const tipoViviendaRaw = modelo.tipo_vivienda || 'Casa';

    // --- C. LÓGICA DE STATUS ---
    const statusDesarrollo = desarrolloInfo?.status || ''; 
    const fechaEntrega = desarrolloInfo?.info_comercial?.fecha_entrega || ''; 
    const statusLower = normalizar(statusDesarrollo);
    const esPrevTexto = statusLower.includes('preventa') || 
                        statusLower.includes('pre-venta') || 
                        statusLower.includes('obra') || 
                        statusLower.includes('construccion');
    const esPreventa = esPrevTexto || esFechaFutura(fechaEntrega);

    // --- D. LÓGICA AVANZADA DE IMÁGENES (Galería + Portada + Plantas) ---
    // Objetivo: Construir un array robusto 'imagenes' para el carrusel
    let listaImagenes = [];

    // 1. Prioridad: Galería del Modelo (Renders)
    if (Array.isArray(modelo.multimedia?.galeria) && modelo.multimedia.galeria.length > 0) {
      listaImagenes.push(...modelo.multimedia.galeria);
    }

    // 2. Prioridad: Plantas del Modelo (Información técnica)
    if (modelo.multimedia?.planta_baja) {
      listaImagenes.push(modelo.multimedia.planta_baja);
    }
    if (modelo.multimedia?.planta_alta) {
      listaImagenes.push(modelo.multimedia.planta_alta);
    }

    // 3. Fallback: Si el modelo NO tiene ninguna imagen, usamos las del Desarrollo
    if (listaImagenes.length === 0 && desarrolloInfo) {
      // Portada del desarrollo
      if (desarrolloInfo.multimedia?.portada) {
        listaImagenes.push(desarrolloInfo.multimedia.portada);
      }
      // Galería del desarrollo
      if (Array.isArray(desarrolloInfo.multimedia?.galeria)) {
        listaImagenes.push(...desarrolloInfo.multimedia.galeria);
      }
    }

    // 4. Limpieza final: Eliminar strings vacíos o nulos
    listaImagenes = listaImagenes.filter(url => url && url.length > 5);

    // 5. Fallback final: Icono de la marca
    if (listaImagenes.length === 0) {
      listaImagenes.push(FALLBACK_IMG);
    }

    // La imagen principal será la primera de la lista calculada
    const imagenPrincipal = listaImagenes[0];

    return {
      ...modelo,
      id: generarIdModelo(idDev, modelo.nombre_modelo, index),
      _key: index,
      precioNumerico: precioFinal,
      imagen: imagenPrincipal, // Para compatibilidad (miniatura principal)
      imagenes: listaImagenes, // Para el carrusel (lista completa)
      esPreventa: esPreventa,
      tipoVivienda: tipoViviendaRaw,
      nombreDesarrollo: desarrolloInfo?.nombre || '',
      constructora: desarrolloInfo?.constructora || '',
      zona: desarrolloInfo?.zona || '',
      colonia: desarrolloInfo?.ubicacion?.colonia || '',
      ciudad: desarrolloInfo?.ubicacion?.ciudad || '',
      estado: desarrolloInfo?.ubicacion?.estado || '',
      amenidadesDesarrollo: desarrolloInfo?.amenidades || [],
      recamaras: Number(modelo.caracteristicas?.recamaras || 0),
      banos: Number(modelo.caracteristicas?.banos || 0),
      m2: Number(modelo.dimensiones?.construccion || 0),
    };
  });
};

export const obtenerTopAmenidades = () => {
  const conteo = {};
  desarrollosRaw.forEach(d => {
    if (Array.isArray(d.amenidades)) {
      d.amenidades.forEach(am => {
        const key = am.trim();
        conteo[key] = (conteo[key] || 0) + 1;
      });
    }
  });
  return Object.keys(conteo).sort((a, b) => conteo[b] - conteo[a]).slice(0, 5);
};

export const obtenerInformacionDesarrollo = (idDesarrollo) => {
  const idStr = String(idDesarrollo).trim();
  const desarrollo = desarrollosRaw.find(d => String(d.id_desarrollo).trim() === idStr);
  
  if (!desarrollo) return null;

  const todosLosModelos = obtenerDatosUnificados();
  const modelosDelDesarrollo = todosLosModelos.filter(m => 
    String(m.id_desarrollo).trim() === idStr
  );

  return {
    ...desarrollo,
    modelos: modelosDelDesarrollo
  };
};