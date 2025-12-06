// src/hooks/useCatalogFilter.js
import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { UI_OPCIONES } from '../config/constants';
import { filterCatalog } from '../services/catalog.service';

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
            tipo: 'all'
        };
    }, [userProfile, location.search]);

    const [filtros, setFiltros] = useState(getInitialFilters);

    useEffect(() => {
        if (JSON.stringify(filtros) !== JSON.stringify(getInitialFilters)) {
            setFiltros(getInitialFilters);
        }
    }, [getInitialFilters]);

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
            filtros.status !== 'all' || filtros.amenidad !== '' || filtros.tipo !== 'all'
        );
    }, [filtros, searchTerm, userProfile]);

    // 3. Motor de Filtrado (Delegado al servicio)
    const modelosFiltrados = useMemo(() => {
        if (loading) return [];
        return filterCatalog(dataMaestra, desarrollos, filtros, searchTerm);
    }, [dataMaestra, desarrollos, filtros, searchTerm, loading]);

    const limpiarTodo = () => {
        setSearchTerm('');
        setFiltros({
            precioMin: 0,
            precioMax: UI_OPCIONES.FILTRO_PRECIO_MAX,
            habitaciones: 0, status: 'all', amenidad: '', tipo: 'all'
        });
    };

    return {
        filtros,
        setFiltros,
        searchTerm,
        setSearchTerm,
        hayFiltrosActivos,
        modelosFiltrados,
        limpiarTodo
    };
};
