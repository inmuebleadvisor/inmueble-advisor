
const STATUS = { DEV_PREALE: 'PRE-ALE' };
const normalizar = (str) => str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

// Mock Context Data
const dataDesarrollos = [
    {
        id: "4719",
        nombre: "Desarrollo Correcto",
        ubicacion: {
            latitud: 21.810341,
            longitud: -102.271835
        },
        amenidades: ["Alberca"],
        status: "Entrega Inmediata",
        precioDesde: 2000000
    },
    {
        id: "BadDev",
        nombre: "Desarrollo Sin Ubicacion",
        ubicacion: {}, // Missing lat/lng
        status: "Entrega Inmediata"
    },
    {
        id: "OldDev",
        latitud: 21.0, // Old structure check
        longitud: -102.0,
        ubicacion: {
            latitud: 21.99,
            longitud: -102.99
        },
        status: "Preventa"
    }
];

const dataMaestra = []; // Models - keeping empty for this test as we focus on coordinates
const filtros = { precioMax: 5000000, habitaciones: 0, status: 'all', amenidad: '' };
const loading = false;

// The Logic from Mapa.jsx (Modified for standalone run)
function getMarcadoresVisibles() {
    if (loading) return [];
    if (!dataDesarrollos || dataDesarrollos.length === 0) return [];

    return dataDesarrollos.map(dev => {
        // ✅ FIX: Validamos ubicación anidada correctamente según Schema V3
        if (!dev.ubicacion?.latitud || !dev.ubicacion?.longitud) {
            console.log(`[LOG] Dropping ${dev.id} due to missing coordinates`);
            return null;
        }

        // --- FILTROS GLOBALES (Aplicados a Nivel Desarrollo) ---

        // 1. Status/Etapa vs Schema V3 "status" (string)
        const statusDev = String(dev.status || '').toUpperCase();
        let esPreventa = statusDev.includes('PRE') || statusDev === STATUS?.DEV_PREALE;

        if (filtros.status === 'inmediata' && esPreventa) return null;
        if (filtros.status === 'preventa' && !esPreventa) return null;

        // 2. Amenidades
        if (filtros.amenidad) {
            const amHeaders = Array.isArray(dev.amenidades) ? dev.amenidades : [];
            if (amHeaders.length === 0) return null;
            if (!amHeaders.some(a => normalizar(a).includes(normalizar(filtros.amenidad)))) return null;
        }

        // --- FILTROS DE HIJOS (Precio, Recámaras) ---
        // Buscamos los modelos para validar PRECIO y RECAMARAS, y calcular rango
        const modelosHijos = dataMaestra.filter(m => String(m.idDesarrollo) === String(dev.id));

        const modelosQueCumplen = modelosHijos.filter(m => {
            if (Number(m.precioNumerico) > filtros.precioMax) return false;
            if (filtros.habitaciones > 0 && Number(m.recamaras) < filtros.habitaciones) return false;
            return true;
        });

        // Si se aplicaron filtros de rango y ningun hijo cumple, ocultamos el pin
        const hayFiltrosRango = filtros.precioMax < 5000000 || filtros.habitaciones > 0;
        if (hayFiltrosRango && modelosQueCumplen.length === 0) return null;

        // Generación de Etiqueta de Precio
        let etiqueta = "$ Consultar";
        if (modelosHijos.length > 0) {
            const precios = modelosHijos.map(m => Number(m.precioNumerico));
            const min = Math.min(...precios);
            const max = Math.max(...precios);

            const formatCompact = (val) => {
                if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
                if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
                return `$${val}`;
            };

            etiqueta = formatCompact(min);
            if (min !== max) etiqueta = `${formatCompact(min)} - ${formatCompact(max)}`;
        } else if (dev.precioDesde) {
            etiqueta = `$${(dev.precioDesde / 1000000).toFixed(1)}M`;
        }

        return {
            id: dev.id,
            nombre: dev.nombre,
            zona: dev.zona,
            // ✅ FIX: Usamos la estructura anidada correcta
            ubicacion: { latitud: dev.ubicacion.latitud, longitud: dev.ubicacion.longitud },
            portada: dev.imagen,
            etiquetaPrecio: etiqueta
        };
    }).filter(Boolean);
}

console.log("Running Logic Verification...");
const results = getMarcadoresVisibles();
console.log(`Results: ${results.length}`);
results.forEach(r => {
    console.log(` - ID: ${r.id}, Lat: ${r.ubicacion.latitud}, Lng: ${r.ubicacion.longitud}`);
});

if (results.length === 2 && results.find(r => r.id === 'OldDev').ubicacion.latitud === 21.99) {
    console.log("SUCCESS: Logic handles nested coordinates correctly and ignores incorrect root/missing coords.");
} else {
    console.log("FAILURE: Unexpected results.");
}
