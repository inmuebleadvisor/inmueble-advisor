// functions/migrator.js
// ÚLTIMA MODIFICACION: 02/12/2025
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");

// ⚠️ ELIMINADO: const db = getFirestore(); 
// (Esto causaba el error al intentar conectarse antes de tiempo)

// --- HELPERS (Funciones Puras) ---

const generarKeywords = (textos) => {
  if (!Array.isArray(textos)) textos = [textos];
  const keywords = new Set(); 

  textos.forEach(texto => {
    if (!texto) return;
    const limpio = String(texto)
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .trim();
    
    if (limpio.length > 0) {
      keywords.add(limpio);
      const palabras = limpio.split(" ");
      if (palabras.length > 1) {
        palabras.forEach(p => keywords.add(p));
      }
    }
  });
  return Array.from(keywords);
};

const estandarizarMedia = (data) => {
  const galeriaSet = new Set();
  let cover = null;

  const fuentes = [
    data.imagen, 
    data.multimedia?.portada, 
    data.portadaDesarrollo,
    ...(Array.isArray(data.multimedia?.galeria) ? data.multimedia.galeria : []),
    ...(Array.isArray(data.imagenes) ? data.imagenes : []) 
  ];

  fuentes.forEach(url => {
    // Validamos que sea string, tenga longitud y NO sea el placeholder lento
    if (url && typeof url === 'string' && url.length > 5 && !url.includes('via.placeholder.com')) {
      if (!cover) cover = url; 
      galeriaSet.add(url);
    }
  });

  return {
    cover: cover || null, 
    gallery: Array.from(galeriaSet),
    video: data.multimedia?.video || null,
    brochure: data.multimedia?.brochure || null
  };
};

// --- FUNCIONES EXPORTADAS ---

// V1 Legacy (Opcional, la mantenemos para que no rompa imports)
exports.ejecutarMigracion = async () => {
    return { success: false, message: "Lógica V1 obsoleta." };
};

// FASE 1: Estandarización V2
exports.ejecutarEstandarizacion = async () => {
  console.log("🚀 Iniciando Migración FASE 1: Estandarización V2...");
  
  // ✅ SOLUCIÓN: Inicializamos DB aquí dentro, cuando la App ya existe.
  const db = getFirestore(); 
  const batch = db.batch();
  let opCount = 0;
  const MAX_BATCH_SIZE = 450; 

  // 1. MODELOS
  const modelosSnap = await db.collection('modelos').get();
  for (const doc of modelosSnap.docs) {
    if (opCount >= MAX_BATCH_SIZE) break;
    const data = doc.data();
    const updateData = {};

    if (!data.media) {
        updateData.media = estandarizarMedia(data);
    }

    const fuentesDeTexto = [
        data.nombreModelo || data.nombre_modelo,
        data.nombreDesarrollo,
        data.ubicacion?.zona || data.zona,
        data.ubicacion?.ciudad || data.ciudad,
        ...(data.amenidades || [])
    ];
    
    updateData.keywords = generarKeywords(fuentesDeTexto);
    updateData.updatedAt = FieldValue.serverTimestamp();

    if (Object.keys(updateData).length > 0) {
        batch.update(doc.ref, updateData);
        opCount++;
    }
  }

  // 2. DESARROLLOS
  const devSnap = await db.collection('desarrollos').get();
  for (const doc of devSnap.docs) {
    if (opCount >= MAX_BATCH_SIZE) break;
    const data = doc.data();
    const updateData = {};

    if (!data.media) {
        updateData.media = estandarizarMedia(data);
    }

    const fuentesDeTexto = [
        data.nombre,
        data.constructora,
        data.ubicacion?.zona,
        data.ubicacion?.ciudad,
        ...(data.amenidades || [])
    ];

    updateData.keywords = generarKeywords(fuentesDeTexto);
    updateData.updatedAt = FieldValue.serverTimestamp();

    if (Object.keys(updateData).length > 0) {
        batch.update(doc.ref, updateData);
        opCount++;
    }
  }

  if (opCount > 0) {
    await batch.commit();
    return { success: true, count: opCount, message: "Estandarización V2 completada." };
  } else {
    return { success: true, count: 0, message: "Sin cambios pendientes." };
  }
};

// FASE 2.3: Limpieza V3
exports.ejecutarLimpieza = async () => {
    console.log("🧹 Iniciando Limpieza FASE 2.3...");
    
    // ✅ SOLUCIÓN: Inicializamos DB aquí también
    const db = getFirestore();
    const batch = db.batch();
    let opCount = 0;
    const MAX_BATCH_SIZE = 450;
    
    const camposAborrar = ["imagen", "multimedia", "portadaDesarrollo", "imagenes"];

    const modelosSnap = await db.collection('modelos').get();
    for (const doc of modelosSnap.docs) {
      if (opCount >= MAX_BATCH_SIZE) break;
      const updateData = {};
      let tieneCambios = false;
      camposAborrar.forEach(campo => {
          if (doc.data()[campo] !== undefined) {
              updateData[campo] = FieldValue.delete();
              tieneCambios = true;
          }
      });
      if (tieneCambios) {
          batch.update(doc.ref, updateData);
          opCount++;
      }
    }

    const devSnap = await db.collection('desarrollos').get();
    for (const doc of devSnap.docs) {
      if (opCount >= MAX_BATCH_SIZE) break;
      const updateData = {};
      let tieneCambios = false;
      camposAborrar.forEach(campo => {
          if (doc.data()[campo] !== undefined) {
              updateData[campo] = FieldValue.delete();
              tieneCambios = true;
          }
      });
      if (tieneCambios) {
          batch.update(doc.ref, updateData);
          opCount++;
      }
    }

    if (opCount > 0) {
      await batch.commit();
      return { success: true, count: opCount, detalles: `Campos obsoletos eliminados en ${opCount} docs.` };
    } else {
      return { success: true, count: 0, detalles: "Base de datos ya limpia." };
    }
};