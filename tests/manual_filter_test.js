
const STATUS = {
    DEV_IMMEDIATE: 'IMMEDIATE',
    DEV_PREALE: 'PREALE',
};

// Mock normalizar function
const normalizar = (str) => {
    if (!str) return '';
    return String(str)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
};

// COPIED LOGIC TO TEST
function filterCatalog(dataMaestra, desarrollos, filters, searchTerm) {
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

        let hasPreventa = false;
        let hasInmediata = false;

        // Helper to process status value(s)
        const processStatus = (val) => {
            if (!val) return;
            const values = Array.isArray(val) ? val : [val];
            values.forEach(v => {
                if (!v) return;
                const s = String(v).toUpperCase().trim();

                // Check Preventa
                if (
                    s === 'PRE-VENTA' ||
                    s === 'PREVENTA' ||
                    s === STATUS.DEV_PREALE ||
                    s.includes('PRE-VENTA')
                ) {
                    hasPreventa = true;
                }

                // Check Inmediata
                if (
                    s === 'ENTREGA INMEDIATA' ||
                    s === 'INMEDIATA' ||
                    s === STATUS.DEV_IMMEDIATE ||
                    s.includes('ENTREGA INMEDIATA')
                ) {
                    hasInmediata = true;
                }
            });
        };

        // 1. Check Desarrollo Status
        if (desarrollo && desarrollo.status) {
            processStatus(desarrollo.status);
        }

        // 2. Check Item (Model) Status
        if (item.status) {
            processStatus(item.status);
        }

        // Legacy field check (just in case)
        if (item.esPreventa) hasPreventa = true;

        if (filters.status === 'inmediata' && !hasInmediata) return false;
        if (filters.status === 'preventa' && !hasPreventa) return false;

        // Skipping other filters for this test as we focus on status
        return true;
    });
}

// TEST CASES
const textEnc = new TextEncoder();
const log = (msg) => console.log(msg);

const runTest = () => {
    const desarrollos = [
        { id: 'd1', status: 'Pre-Venta' }, // Legacy String
        { id: 'd2', status: ['Pre-Venta', 'Entrega Inmediata'] }, // Mixed Array
        { id: 'd3', status: 'Sin definir' }, // Invalid
        { id: 'd4', status: [] }, // Empty Array
        { id: 'd5', status: 'Entrega Inmediata' }, // Legacy String Inmediata
        { id: 'd6', status: ['PREVENTA'] }, // Array Single
        { id: 'd7', status: ['IMMEDIATE'] }, // Array Code
    ];

    const items = [
        { id: 'i1', idDesarrollo: 'd1', precioNumerico: 100 },
        { id: 'i2', idDesarrollo: 'd2', precioNumerico: 100 },
        { id: 'i3', idDesarrollo: 'd3', precioNumerico: 100 },
        { id: 'i4', idDesarrollo: 'd4', precioNumerico: 100 },
        { id: 'i5', idDesarrollo: 'd5', precioNumerico: 100 },
        { id: 'i6', idDesarrollo: 'd6', precioNumerico: 100 },
        { id: 'i7', idDesarrollo: 'd7', precioNumerico: 100 },
    ];

    const baseFilters = { precioMax: 1000000, precioMin: 0, habitaciones: 0, showNoPrice: true, status: 'all', tipo: 'all' };

    // TEST 1: Filter Preventa
    const resPreventa = filterCatalog(items, desarrollos, { ...baseFilters, status: 'preventa' }, '');
    const idsPreventa = resPreventa.map(i => i.id);
    log(`Preventa Ids: ${idsPreventa.join(',')}`);
    // Expect: i1 (d1 Pre-Venta), i2 (d2 Mixed), i6 (d6 PREVENTA). 
    // i7 is IMMEDIATE, i5 is Inmediata, i3 is Sin definir, i4 is Empty.
    // Expected: i1, i2, i6.

    if (idsPreventa.includes('i1') && idsPreventa.includes('i2') && idsPreventa.includes('i6') && idsPreventa.length === 3) {
        log("✅ Test 1 (Preventa) Passed");
    } else {
        log("❌ Test 1 (Preventa) Failed");
    }

    // TEST 2: Filter Inmediata
    const resInmediata = filterCatalog(items, desarrollos, { ...baseFilters, status: 'inmediata' }, '');
    const idsInmediata = resInmediata.map(i => i.id);
    log(`Inmediata Ids: ${idsInmediata.join(',')}`);
    // Expect: i2 (d2 Mixed), i5 (d5 Inmediata), i7 (d7 IMMEDIATE).
    // Expected: i2, i5, i7.

    if (idsInmediata.includes('i2') && idsInmediata.includes('i5') && idsInmediata.includes('i7') && idsInmediata.length === 3) {
        log("✅ Test 2 (Inmediata) Passed");
    } else {
        log("❌ Test 2 (Inmediata) Failed");
    }

    // TEST 3: Invalid/Blank
    // i3 (Sin definir), i4 (Empty) should never appear in filtered lists above.
    if (!idsPreventa.includes('i3') && !idsPreventa.includes('i4') && !idsInmediata.includes('i3') && !idsInmediata.includes('i4')) {
        log("✅ Test 3 (Exclusions) Passed");
    } else {
        log("❌ Test 3 (Exclusions) Failed");
    }

    // TEST 4: Duplicates/Mixed check
    // i2 should be in both
    if (idsPreventa.includes('i2') && idsInmediata.includes('i2')) {
        log("✅ Test 4 (Mixed Status) Passed");
    } else {
        log("❌ Test 4 (Mixed Status) Failed");
    }

};

runTest();
