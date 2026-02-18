import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useService } from './useService';
import { UI_OPCIONES } from '../config/constants';
import { CatalogService } from '../services/catalog.service';
import { useDebounce } from './useDebounce'; // [NEW]

export const useCatalogFilter = (dataMaestra, desarrollos, loading) => {
    const { userProfile } = useUser();
    const { meta: metaService } = useService();
    const location = useLocation();

    const [searchTerm, setSearchTerm] = useState('');

    // [NEW] Use Debounce Hook for tracking logic
    // We want to track AFTER the user stops typing, so we debounce the inputs
    const debouncedSearchTerm = useDebounce(searchTerm, 1500);

    // 1. Inicialización de Filtros
    const getInitialFilters = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const profile = userProfile?.perfilFinanciero;

        const defaultMinPrice = 0;
        const defaultMaxPrice = UI_OPCIONES.FILTRO_PRECIO_MAX;
        const defaultRooms = 0;
        const defaultStatus = 'all';

        const safeNum = (val, max = Infinity) => {
            const num = Number(val);
            if (isNaN(num) || num < 0) return defaultRooms;
            return Math.min(num, max);
        }

        // PRIORITY 1: Navigation State (From Home Widget or other internal links)
        const state = location.state;
        const stateMinPrice = state?.minPrice ?? state?.precioMin;
        const stateMaxPrice = state?.maxPrice ?? state?.precioMax;
        const stateRooms = state?.rooms ?? state?.habitaciones;
        const stateStatus = state?.status;

        // PRIORITY 2: URL Params (Override everything if present AND no state)
        // If state exists, it takes precedence because it's an explicit "new" action
        const hasUrlParams = params.has('minPrice') || params.has('maxPrice') || params.has('rooms') || params.has('status');

        // PRIORITY 3: Local Storage (If no URL params and no state)
        if (!state && !hasUrlParams) {
            try {
                const saved = localStorage.getItem('catalog_filters_v1');
                if (saved) {
                    return JSON.parse(saved);
                }
            } catch (e) {
                console.error("Error loading filters from local storage:", e);
            }
        }

        // PRIORITY 4: User Profile (First time fallback)
        // ... (Logic continues below using the calculated defaults)

        // Presupuesto
        const urlMinPrice = params.get('minPrice');
        const urlMaxPrice = params.get('maxPrice');
        const profileMaxPrice = profile?.presupuestoCalculado;

        const initialMinPrice = stateMinPrice !== undefined
            ? safeNum(stateMinPrice)
            : (urlMinPrice ? safeNum(urlMinPrice) : defaultMinPrice);

        const initialMaxPrice = stateMaxPrice !== undefined
            ? safeNum(stateMaxPrice, defaultMaxPrice)
            : (urlMaxPrice ? safeNum(urlMaxPrice, defaultMaxPrice)
                : (profileMaxPrice ? safeNum(profileMaxPrice, defaultMaxPrice) : defaultMaxPrice));

        // Recámaras
        const urlRooms = params.get('rooms');
        const profileRooms = profile?.recamarasDeseadas;
        const initialRooms = stateRooms !== undefined
            ? safeNum(stateRooms)
            : (urlRooms ? safeNum(urlRooms)
                : (profileRooms !== undefined && profileRooms !== null ? safeNum(profileRooms) : defaultRooms));

        // Status
        const urlStatus = params.get('status');
        const profileStatus = profile?.interesInmediato === true ? 'inmediata' : (profile?.interesInmediato === false ? 'preventa' : defaultStatus);

        const initialStatus = stateStatus && ['inmediata', 'preventa', 'all'].includes(stateStatus)
            ? stateStatus
            : (urlStatus && ['inmediata', 'preventa'].includes(urlStatus) ? urlStatus : profileStatus);

        return {
            precioMin: initialMinPrice,
            precioMax: initialMaxPrice,
            habitaciones: initialRooms,
            status: initialStatus,
            amenidad: '',
            tipo: 'all',
            showNoPrice: false // Default: Don't show items without price
        };
    }, [userProfile, location.search]);

    const [filtros, setFiltros] = useState(getInitialFilters);

    // Debounce filters too for tracking? 
    // Usually filters are "instant" clicks, but if we want to bundle tracking events to avoid spam on sliders:
    const debouncedFiltros = useDebounce(filtros, 1500);

    // 2. Persistence: Save to Local Storage whenever filters change
    useEffect(() => {
        localStorage.setItem('catalog_filters_v1', JSON.stringify(filtros));
    }, [filtros]);

    // Detector de Filtros Activos 
    const hayFiltrosActivos = useMemo(() => {
        const isMinPriceFiltered = filtros.precioMin > 0;
        const isMaxPriceFiltered = filtros.precioMax < UI_OPCIONES.FILTRO_PRECIO_MAX;
        const userBudget = userProfile?.perfilFinanciero?.presupuestoCalculado;

        const isCustomPriceFilter = (isMinPriceFiltered || isMaxPriceFiltered) && (
            !userBudget ||
            filtros.precioMax !== Math.min(Number(userBudget), UI_OPCIONES.FILTRO_PRECIO_MAX)
        );

        return (
            searchTerm !== '' || isCustomPriceFilter || filtros.habitaciones > 0 ||
            filtros.status !== 'all' || filtros.amenidad !== '' || filtros.tipo !== 'all' ||
            filtros.showNoPrice === true
        );
    }, [filtros, searchTerm, userProfile]);

    // ⭐ Tracking: Meta Search Event (Refactored with useDebounce)
    useEffect(() => {
        // We use the DEBOUNCED values to trigger the event
        if (loading || !hayFiltrosActivos) return;

        const queryParts = [];
        if (debouncedSearchTerm) queryParts.push(debouncedSearchTerm);
        if (debouncedFiltros.amenidad) queryParts.push(debouncedFiltros.amenidad);
        if (debouncedFiltros.tipo !== 'all') queryParts.push(debouncedFiltros.tipo);

        const searchQuery = queryParts.join(' ') || 'catalog_filters';

        metaService.trackSearch(searchQuery, {
            content_category: 'Inventory',
            filters: {
                min_price: debouncedFiltros.precioMin,
                max_price: debouncedFiltros.precioMax,
                rooms: debouncedFiltros.habitaciones,
                status: debouncedFiltros.status,
                type: debouncedFiltros.tipo
            }
        });

        // Removed explicit cleanup because useDebounce handles the timer
    }, [debouncedSearchTerm, debouncedFiltros, hayFiltrosActivos, loading, metaService]);

    // 3. Motor de Filtrado (Delegado al servicio)
    const modelosFiltrados = useMemo(() => {
        if (loading) return [];
        return CatalogService.filterCatalog(dataMaestra, desarrollos, filtros, searchTerm);
    }, [dataMaestra, desarrollos, filtros, searchTerm, loading]);

    // 4. "No Results" Suggestions Logic
    // If no results, find closest by price.
    const suggestions = useMemo(() => {
        if (loading) return [];
        // Only calculate if main results are empty and we have data
        if (modelosFiltrados.length === 0 && dataMaestra && dataMaestra.length > 0) {
            // Only suggest if filtering is active (to avoid suggesting on initial load if empty for other reasons)
            if (hayFiltrosActivos) {
                return CatalogService.findClosestByPrice(dataMaestra, filtros);
            }
        }
        return [];
    }, [modelosFiltrados.length, dataMaestra, filtros, hayFiltrosActivos, loading]);

    const limpiarTodo = () => {
        setSearchTerm('');
        const emptyFilters = {
            precioMin: 0,
            precioMax: UI_OPCIONES.FILTRO_PRECIO_MAX,
            habitaciones: 0, status: 'all', amenidad: '', tipo: 'all',
            showNoPrice: false
        };
        setFiltros(emptyFilters);
    };

    return {
        filtros,
        setFiltros,
        searchTerm,
        setSearchTerm,
        hayFiltrosActivos,
        modelosFiltrados,
        suggestions,
        limpiarTodo
    };
};
