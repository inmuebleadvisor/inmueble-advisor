// functions/migrator.js
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");

const db = getFirestore();

// --- HELPERS ---
const parseNumber = (val) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const clean = String(val).replace(/[^0-9.-]+/g, ""); 
  return Number(clean) || 0;
};

// Convierte "14/03/2024" -> Firestore Timestamp
const parseFecha = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return null;
  const parts = dateString.split('/');
  if (parts.length === 3) {
    // Mes en JS es 0-indexado (0=Enero)
    return Timestamp.fromDate(new Date(parts[2], parts[1] - 1, parts[0]));
  }
  return null;
};

// Convierte "Gym, Alberca, Jardín" -> ["Gym", "Alberca", "Jardín"]
const parseStringArray = (str) => {
  if (!str) return [];
  if (Array.isArray(str)) return str;
  return str.split(',').map(s => s.trim()).filter(s => s.length > 0);
};

exports.ejecutarMigracion = async () => {
  console.log("🔥 Iniciando OPTIMIZACIÓN FINAL (Sin pérdida de datos)...");
  const batch = db.batch();
  let opCount = 0;
  const MAX_BATCH_SIZE = 400; // Margen de seguridad

  // ==================================================================
  // 1. MODELOS: Aplanado y Arrays
  // ==================================================================
  const modelosSnap = await db.collection('modelos').get();
  modelosSnap.forEach(doc => {
    const data = doc.data();
    const updateData = {};

    // A. Rescate de Datos Anidados
    if (data.caracteristicas) {
        updateData.recamaras = parseNumber(data.caracteristicas.recamaras);
        updateData.banos = parseNumber(data.caracteristicas.banos);
        updateData.niveles = parseNumber(data.caracteristicas.niveles);
        updateData.cajones = parseNumber(data.caracteristicas.cajones);
        updateData.caracteristicas = FieldValue.delete(); // Ya seguro borrar
    }
    
    if (data.dimensiones) {
        updateData.m2 = parseNumber(data.dimensiones.construccion);
        updateData.terreno = parseNumber(data.dimensiones.terreno);
        updateData.dimensiones = FieldValue.delete();
    }

    // B. Amenidades: String -> Array (¡Mejora clave!)
    // Si existe 'extras.amenidades_modelo', lo convertimos a array en la raíz
    if (data.extras?.amenidades_modelo) {
        updateData.amenidades = parseStringArray(data.extras.amenidades_modelo);
    }
    // Rescatamos bodega si existe
    if (data.extras?.distr_bodega) {
        updateData.bodega = data.extras.distr_bodega;
    }
    // Borramos extras solo si ya movimos todo
    if (data.extras) updateData.extras = FieldValue.delete();

    // C. Precios y Limpieza
    updateData.precioNumerico = parseNumber(data.precioNumerico || data.precio?.actual);
    if (data.precio) updateData.precio = FieldValue.delete();

    batch.update(doc.ref, updateData);
    opCount++;
  });

  // ==================================================================
  // 2. USERS: Inventario Boolean
  // ==================================================================
  const usersSnap = await db.collection('users').get();
  usersSnap.forEach(doc => {
    const data = doc.data();
    
    if (Array.isArray(data.inventario)) {
        // Transformamos el array de inventario
        const inventarioOptimizado = data.inventario.map(item => {
            // Creamos un nuevo objeto item
            const newItem = { ...item };
            
            // Lógica: status 'activo' -> activo: true
            // Cualquier otro status -> activo: false
            const isActivo = (item.status === 'activo' || item.status === true);
            
            newItem.activo = isActivo; 
            delete newItem.status; // Eliminamos la variable 'string' antigua
            
            return newItem;
        });

        batch.update(doc.ref, { inventario: inventarioOptimizado });
        opCount++;
    }
  });

  // ==================================================================
  // 3. DESARROLLOS: Fechas y Números
  // ==================================================================
  const devSnap = await db.collection('desarrollos').get();
  devSnap.forEach(doc => {
    const data = doc.data();
    const info = data.info_comercial || {};
    const updateData = {};

    // Convertir fechas string a Timestamp real
    // Solo si es string, para no romper si corres el script 2 veces
    if (typeof info.fecha_entrega === 'string') {
        updateData["info_comercial.fecha_entrega"] = parseFecha(info.fecha_entrega);
    }

    // Convertir números en info comercial
    updateData["info_comercial.inventario"] = parseNumber(info.inventario);
    updateData["info_comercial.unidades_proyectadas"] = parseNumber(info.unidades_proyectadas);
    updateData["info_comercial.unidades_vendidas"] = parseNumber(info.unidades_vendidas);

    // Limpieza de precios (ya tenemos precioDesde)
    if (data.precios) updateData.precios = FieldValue.delete();

    batch.update(doc.ref, updateData);
    opCount++;
  });

  // Ejecución
  if (opCount > 0) {
    await batch.commit();
    console.log(`✅ Optimización finalizada. ${opCount} documentos mejorados.`);
    return { success: true, count: opCount };
  } else {
    return { success: true, count: 0, message: "Base de datos ya optimizada." };
  }
};