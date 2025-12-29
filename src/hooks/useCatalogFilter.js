// src/hooks/useCatalogFilter.js
import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { UI_OPCIONES } from '../config/constants';
import { CatalogService } from '../services/catalog.service';

export const useCatalogFilter = (dataMaestra, desarrollos, loading) => {
    const { userProfile } = useUser();
    const location = useLocation();

    const [searchTerm, setSearchTerm] = useState('');

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

        // PRIORITY 1: URL Params (Override everything if present)
        const hasUrlParams = params.has('minPrice') || params.has('maxPrice') || params.has('rooms') || params.has('status');

        // PRIORITY 2: Local Storage (If no URL params)
        if (!hasUrlParams) {
            try {
                const saved = localStorage.getItem('catalog_filters_v1');
                if (saved) {
                    return JSON.parse(saved);
                }
            } catch (e) {
                console.error("Error loading filters from local storage:", e);
            }
        }

        // PRIORITY 3: User Profile (First time fallback)
        // ... (Logic continues below using the calculated defaults)

        // Presupuesto
        const urlMinPrice = params.get('minPrice');
        const urlMaxPrice = params.get('maxPrice');
        const profileMaxPrice = profile?.presupuestoCalculado;

        const initialMinPrice = urlMinPrice ? safeNum(urlMinPrice) : defaultMinPrice;
        const initialMaxPrice = urlMaxPrice
            ? safeNum(urlMaxPrice, defaultMaxPrice)
            : (profileMaxPrice ? safeNum(profileMaxPrice, defaultMaxPrice) : defaultMaxPrice);

        // Recámaras
        const urlRooms = params.get('rooms');
        const profileRooms = profile?.recamarasDeseadas;
        const initialRooms = urlRooms
            ? safeNum(urlRooms)
            : (profileRooms !== undefined && profileRooms !== null ? safeNum(profileRooms) : defaultRooms);

        // Status
        const urlStatus = params.get('status');
        const profileStatus = profile?.interesInmediato === true ? 'inmediata' : (profile?.interesInmediato === false ? 'preventa' : defaultStatus);

        const initialStatus = urlStatus && ['inmediata', 'preventa'].includes(urlStatus)
            ? urlStatus
            : profileStatus;

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
        // Also clear local storage effectively by saving the empty state (handled by useEffect)
        // or we could explicitly remove it if we want 'reset' to mean 'go back to profile on next load'
        // But user request says "si no tenemos nada en local entonces presentar los filtros en blanco",
        // forcing empty state here seems correct.
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
