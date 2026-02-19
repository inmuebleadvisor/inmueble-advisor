import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useService } from './useService';
import { UI_OPCIONES } from '../config/constants';
import { CatalogService } from '../services/catalog.service';
import { useDebounce } from './useDebounce';

/**
 * Hook Filter Logic for Catalog
 * @responsibility: Resolve initial filter state based on priority (State > URL > Profile > Default)
 */
export const useCatalogFilter = (dataMaestra, desarrollos, loading) => {
    const { userProfile } = useUser();
    const { meta: metaService } = useService();
    const location = useLocation();

    // 1. Search Term Initialization
    const [searchTerm, setSearchTerm] = useState(location.state?.searchQuery || '');

    // [Refactoring Strategy]
    // Helper to resolve filter values with strict priority
    const resolveFilterValue = (stateVal, urlVal, profileVal, defaultVal, isFreshSearch, transform = Number) => {
        // Priority 1: Navigation State (Explicit User Action from UI)
        if (stateVal !== undefined && stateVal !== null) {
            return transform(stateVal);
        }

        // Priority 2: URL Parameters (Deep Linking)
        if (urlVal !== undefined && urlVal !== null) {
            return transform(urlVal);
        }

        // Priority 3: User Profile (Persisted Preferences)
        // SKIPPED if this is a "Fresh Search" (User typed into search bar from Home)
        if (profileVal !== undefined && profileVal !== null && !isFreshSearch) {
            return transform(profileVal);
        }

        // Priority 4: Default
        return defaultVal;
    };

    // 2. Filter Initialization
    const getInitialFilters = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const state = location.state || {};
        const profile = userProfile?.perfilFinanciero || {};

        // "Fresh Search" Detection: If coming from Home Search, ignore profile budgets.
        const isFreshSearch = !!state.searchQuery;

        const defaultMaxPrice = UI_OPCIONES.FILTRO_PRECIO_MAX;
        const safeNum = (val) => {
            const num = Number(val);
            return (isNaN(num) || num < 0) ? 0 : num;
        };
        const safeMax = (val) => {
            const num = Number(val);
            return (isNaN(num) || num < 0) ? defaultMaxPrice : Math.min(num, defaultMaxPrice);
        }

        return {
            precioMin: resolveFilterValue(
                state.minPrice ?? state.precioMin,
                params.get('minPrice'),
                null, // No profile min price
                0,
                isFreshSearch,
                safeNum
            ),
            precioMax: resolveFilterValue(
                state.maxPrice ?? state.precioMax,
                params.get('maxPrice'),
                profile.presupuestoCalculado,
                defaultMaxPrice,
                isFreshSearch,
                safeMax
            ),
            habitaciones: resolveFilterValue(
                state.rooms ?? state.habitaciones,
                params.get('rooms'),
                profile.recamarasDeseadas,
                0,
                isFreshSearch,
                safeNum
            ),
            status: (() => {
                // Status logic is slightly more complex due to string mapping
                const sState = state.status;
                const sUrl = params.get('status');
                const sProfile = profile.interesInmediato === true ? 'inmediata' : (profile.interesInmediato === false ? 'preventa' : undefined);

                const isValid = (s) => ['inmediata', 'preventa', 'all'].includes(s);

                if (sState && isValid(sState)) return sState;
                if (sUrl && isValid(sUrl)) return sUrl;
                if (sProfile && !isFreshSearch) return sProfile;
                return 'all';
            })(),
            amenidad: '',
            tipo: 'all',
            showNoPrice: false
        };
    }, [userProfile, location.search, location.state]);

    const [filtros, setFiltros] = useState(getInitialFilters);
    const debouncedFiltros = useDebounce(filtros, 1500);
    const debouncedSearchTerm = useDebounce(searchTerm, 1500);

    // 3. Persistence
    useEffect(() => {
        localStorage.setItem('catalog_filters_v1', JSON.stringify(filtros));
    }, [filtros]);

    // 4. Active Filter Detection
    const hayFiltrosActivos = useMemo(() => {
        const isMinPriceFiltered = filtros.precioMin > 0;
        const isMaxPriceFiltered = filtros.precioMax < UI_OPCIONES.FILTRO_PRECIO_MAX;
        const userBudget = userProfile?.perfilFinanciero?.presupuestoCalculado;

        // Custom check: Is the price filter DIFFERENT from the user's budget?
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

    // 5. Tracking
    useEffect(() => {
        if (loading || !hayFiltrosActivos) return;

        const queryParts = [];
        if (debouncedSearchTerm) queryParts.push(debouncedSearchTerm);
        if (debouncedFiltros.amenidad) queryParts.push(debouncedFiltros.amenidad);
        if (debouncedFiltros.tipo !== 'all') queryParts.push(debouncedFiltros.tipo);

        const eventQuery = queryParts.join(' ') || 'catalog_filters';

        metaService.trackSearch(eventQuery, {
            content_category: 'Inventory',
            filters: {
                min_price: debouncedFiltros.precioMin,
                max_price: debouncedFiltros.precioMax,
                rooms: debouncedFiltros.habitaciones,
                status: debouncedFiltros.status,
                type: debouncedFiltros.tipo
            }
        });
    }, [debouncedSearchTerm, debouncedFiltros, hayFiltrosActivos, loading, metaService]);

    // 6. Filtering Engine
    const modelosFiltrados = useMemo(() => {
        if (loading) return [];
        return CatalogService.filterCatalog(dataMaestra, desarrollos, filtros, searchTerm);
    }, [dataMaestra, desarrollos, filtros, searchTerm, loading]);

    // 7. Suggestions Logic
    const suggestions = useMemo(() => {
        if (loading) return [];
        if (modelosFiltrados.length === 0 && dataMaestra && dataMaestra.length > 0) {
            if (hayFiltrosActivos) {
                return CatalogService.findClosestByPrice(dataMaestra, filtros);
            }
        }
        return [];
    }, [modelosFiltrados.length, dataMaestra, filtros, hayFiltrosActivos, loading]);

    const limpiarTodo = () => {
        setSearchTerm('');
        setFiltros({
            precioMin: 0,
            precioMax: UI_OPCIONES.FILTRO_PRECIO_MAX,
            habitaciones: 0,
            status: 'all',
            amenidad: '',
            tipo: 'all',
            showNoPrice: false
        });
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
