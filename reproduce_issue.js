
const desarrollos = [
    {
        id: "4719",
        nombre: "Desarrollo de Prueba",
        ubicacion: {
            latitud: 21.810341,
            longitud: -102.271835,
            calle: "Jose Cirilo",
            ciudad: "Aguascalientes"
        },
        // Simulating missing root coordinates which the code currently expects
    },
    {
        id: "OldDev",
        nombre: "Desarrollo Antiguo",
        // Simulating what might be happening if some have root coords
        latitud: 0,
        longitud: 0,
        ubicacion: {
            latitud: 21.810341,
            longitud: -102.271835
        }
    }
];

// Logic from Mapa.jsx
function mapLogic(dataDesarrollos) {
    const filtros = { status: 'all', precioMax: 99999999, habitaciones: 0, amenidad: '' };

    // Mimic the map function
    const results = dataDesarrollos.map(dev => {
        // The problematic line:
        if (!dev.latitud || !dev.longitud) {
            console.log(`[Item ${dev.id}] Failed root coordinate check`);
            return null;
        }

        console.log(`[Item ${dev.id}] Passed root coordinate check with lat: ${dev.latitud}, lng: ${dev.longitud}`);

        return {
            id: dev.id,
            nombre: dev.nombre,
            ubicacion: { latitud: dev.latitud, longitud: dev.longitud },
        };
    }).filter(Boolean);

    return results;
}

// Logic with Fix
function mapLogicFixed(dataDesarrollos) {
    const results = dataDesarrollos.map(dev => {
        // Fix: check ubicacion first, fallback to root if needed (or just ubicacion based on schema)
        const lat = dev.ubicacion?.latitud;
        const lng = dev.ubicacion?.longitud;

        if (!lat || !lng) {
            console.log(`[Fixed][Item ${dev.id}] Failed nested coordinate check`);
            return null;
        }

        console.log(`[Fixed][Item ${dev.id}] Passed nested coordinate check with lat: ${lat}, lng: ${lng}`);

        return {
            id: dev.id,
            nombre: dev.nombre,
            ubicacion: { latitud: lat, longitud: lng },
        };
    }).filter(Boolean);
    return results;
}

console.log("--- Running Original Logic ---");
const originalResults = mapLogic(desarrollos);
console.log("Original Results Count:", originalResults.length);

console.log("\n--- Running Fixed Logic ---");
const fixedResults = mapLogicFixed(desarrollos);
console.log("Fixed Results Count:", fixedResults.length);
console.log("Fixed Result 0 Coords:", fixedResults[0]?.ubicacion);
