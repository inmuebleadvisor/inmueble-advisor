import { useState, useMemo } from 'react';
import { useFavorites } from '../context/FavoritesContext';
import { useCatalog } from '../context/CatalogContext';

/**
 * ViewModel for Favorites Screen
 * Handles logic for:
 * - Data hydration (merging IDs with full catalog data)
 * - Grouping by Development
 * - Comparison selection state
 * - Modal state management
 */
export function useFavoritesViewModel() {
    const { favoritosIds, toggleFavorite } = useFavorites();
    const { modelos, loadingCatalog, getDesarrolloById } = useCatalog();

    // --- State ---
    const [selectedIds, setSelectedIds] = useState([]);
    const [isComparing, setIsComparing] = useState(false);

    const [modalState, setModalState] = useState({
        isOpen: false,
        type: 'model', // 'model' | 'development'
        activeItem: null
    });

    // --- Logic ---

    // 1. Hydrate Data
    const favoritosHydrated = useMemo(() => {
        if (loadingCatalog) return [];
        return modelos.filter(m => favoritosIds.includes(m.id));
    }, [favoritosIds, modelos, loadingCatalog]);

    // 2. Helpers
    const getDesarrolloForModel = (modelo) => {
        const idDevRaw = modelo.idDesarrollo || modelo.id_desarrollo || modelo.desarrollo_id;
        if (!idDevRaw) return null;
        const dev = getDesarrolloById(String(idDevRaw).trim());
        // Avoid circular refs if ID matches itself (dirty data)
        if (dev && String(dev.id) === String(modelo.id)) return null;
        return dev;
    };

    const handleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(item => item !== id));
        } else {
            if (selectedIds.length >= 3) {
                // Return warning or handle UI side. Returning boolean to indicate success/failure?
                // For now, let's return false to indicate "blocked".
                return false;
            }
            setSelectedIds(prev => [...prev, id]);
        }
        return true;
    };

    const clearSelection = () => setSelectedIds([]);

    const toggleCompareMode = () => {
        // Only allow if enough items selected, though UI should block this too.
        if (isComparing) {
            setIsComparing(false);
        } else {
            if (selectedIds.length >= 2) setIsComparing(true);
        }
    };

    // 3. Grouping
    const groupedFavorites = useMemo(() => {
        const groups = {};
        favoritosHydrated.forEach(model => {
            const dev = getDesarrolloForModel(model);
            const devId = dev ? dev.id : 'unknown';
            const devName = dev ? dev.nombre : (model.nombreDesarrollo || 'Otros');

            if (!groups[devId]) {
                groups[devId] = {
                    id: devId,
                    name: devName,
                    desarrollo: dev,
                    items: []
                };
            }
            groups[devId].items.push(model);
        });
        return Object.values(groups);
    }, [favoritosHydrated, getDesarrolloById, modelos]); // Helper needs 'modelos' if it uses it closure-wise? No.

    // 4. Comparison Data
    const propiedadesAComparar = useMemo(() => {
        return favoritosHydrated.filter(p => selectedIds.includes(p.id));
    }, [favoritosHydrated, selectedIds]);


    // 5. Modal Handlers
    const openModelPopup = (item) => {
        setModalState({
            isOpen: true,
            type: 'model',
            activeItem: item
        });
    };

    const openDevelopmentPopup = (devIdOrObj) => {
        // Support passing ID or Object
        let dev = devIdOrObj;
        if (typeof devIdOrObj === 'string' || typeof devIdOrObj === 'number') {
            dev = getDesarrolloById(String(devIdOrObj));
        }

        if (dev) {
            setModalState({
                isOpen: true,
                type: 'development',
                activeItem: dev
            });
        }
    };

    const closeModal = () => {
        setModalState(prev => ({ ...prev, isOpen: false, activeItem: null }));
    };

    return {
        // Data
        isLoading: loadingCatalog,
        favoritesList: favoritosHydrated,
        groupedFavorites,
        comparisonList: propiedadesAComparar,

        // Selection State
        selectedIds,
        isComparing,

        // Modal State
        modalState,

        // Actions
        toggleFavorite,
        handleSelect,
        clearSelection,
        setIsComparing, // Direct setter useful for back button
        openModelPopup,
        openDevelopmentPopup,
        closeModal,

        // Helpers exposed if needed by UI
        getDesarrolloForModel,
        modelos // Exposure needed for finding siblings in modal logic
    };
}
