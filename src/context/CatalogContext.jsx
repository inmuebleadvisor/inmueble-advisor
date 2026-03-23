// src/context/CatalogContext.jsx
// ÚLTIMA MODIFICACION: 02/12/2025

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useService } from '../hooks/useService'; // ✅ DI Hook
import { useUser } from './UserContext'; // Importamos UserContext
import { CatalogService } from '../services/catalog.service';


const CatalogContext = createContext();

export const useCatalog = () => {
  return useContext(CatalogContext);
};

export const CatalogProvider = ({ children }) => {
  const { selectedCity } = useUser(); // Obtenemos la ciudad seleccionada
  const { catalog: catalogService, config: configService } = useService(); // ✅ SERVICE INJECTION
  const [modelos, setModelos] = useState([]);
  const [desarrollos, setDesarrollos] = useState([]);
  const [amenidades, setAmenidades] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  useEffect(() => {
    const loadCatalogData = async () => {
      // Si no hay ciudad seleccionada, tal vez deberíamos esperar o cargar vacío?
      // Por compatibilidad, si es null cargamos todo (o nada, según decisión UX).
      // El plan dice: "Query only matching docs".
      // Si selectedCity es null, el servicio carga todo (global).

      setLoadingCatalog(true);
      try {
        let modelosResult = [];
        let desarrollosResult = [];
        let amenidadesResult = [];
        let sectoresResult = [];
        let settingsResult = {};

        // 1. Carga Inteligente: Si no hay ciudad filtro, NO cargamos modelos masivos.
        // Esto mantiene la carga inicial ligera hasta que el usuario elija en el modal.
        if (!selectedCity) {
          // console.log("⏳ Esperando selección de ciudad (Carga de modelos pausada)...");
          // Aún cargamos configuración y desarrollos (ligero) para el sistema
          const [desarrollosData, amenidadesData, settings, sectoresData] = await Promise.all([
            catalogService.obtenerInventarioDesarrollos(),
            catalogService.obtenerTopAmenidades(),
            configService.getPlatformSettings(),
            catalogService.obtenerSectoresDisponibles()
          ]);
          desarrollosResult = desarrollosData;
          amenidadesResult = amenidadesData;
          sectoresResult = sectoresData;
          settingsResult = settings;
        } else {
          // console.log("🔄 Iniciando carga de catálogo filtrado (Ciudad: " + selectedCity + ")...");
          const [modelosData, desarrollosData, amenidadesData, settings, sectoresData] = await Promise.all([
            catalogService.obtenerDatosUnificados(selectedCity),
            catalogService.obtenerInventarioDesarrollos(),
            catalogService.obtenerTopAmenidades(),
            configService.getPlatformSettings(),
            catalogService.obtenerSectoresDisponibles()
          ]);
          modelosResult = modelosData;
          desarrollosResult = desarrollosData;
          amenidadesResult = amenidadesData;
          sectoresResult = sectoresData;
          settingsResult = settings;
        }

        // --- FILTRADO GLOBAL POR VISIBILIDAD DE ADMINISTRACIÓN ---
        const modelosData = modelosResult; // Alias para continuar con la lógica existente
        const desarrollosData = desarrollosResult;
        const settings = settingsResult;

        // 0. ENRICHMENT: Hydrate models with parent development data (Localización, etc.)
        const modelsEnriched = CatalogService.enrichModels(modelosData, desarrollosData);

        // 1. Filtrar Modelos (Use enriched data & Quality Rules)
        let filteredModels = CatalogService.applyQualityFilters(modelsEnriched, settings);



        // 2. Filtrar Desarrollos
        // Primero identificamos qué desarrollos tienen modelos visibles (después del paso 1)
        const activeDevIds = new Set();
        filteredModels.forEach(m => {
          const devId = m.idDesarrollo || m.id_desarrollo;
          if (devId) activeDevIds.add(String(devId));
        });

        let filteredDevs = desarrollosData.filter(d => {
          // Regla: Hide No Photos
          if (settings.hideNoPhotosDevs) {
            const hasCover = d.media?.cover || d.imagen || d.multimedia?.portada;
            const hasGallery = (d.media?.gallery?.length > 0) || (d.multimedia?.galeria?.length > 0);
            if (!hasCover && !hasGallery) return false;
          }

          // Regla: Hide Empty Devs (Si está activada, y el desarrollo NO tiene modelos activos)
          if (settings.hideEmptyDevs) {
            if (!activeDevIds.has(String(d.id))) return false;
          }

          return true;
        });

        // 3. Re-scan Modelos to ensure no orphan models (optional, good practice)
        // Si un desarrollo fue ocultado por 'hideNoPhotosDevs', sus modelos deberían ocultarse? 
        // Normalmente sí, porque la UI no podrá navegarlos.
        const activeDevsSet = new Set(filteredDevs.map(d => String(d.id)));
        filteredModels = filteredModels.filter(m => {
          const devId = m.idDesarrollo || m.id_desarrollo;
          // Si no encuentro el desarrollo, es huérfano (o desarrollo oculto).
          // PERO: Si el desarrollo no existe en la BD es diferente a si está oculto.
          // Asumimos que si filtramos devs, filtramos sus modelos.
          if (devId && activeDevsSet.has(String(devId))) return true;
          return false;
        });

        setModelos(filteredModels);
        setDesarrollos(filteredDevs);
        setAmenidades(amenidadesResult);
        setSectores(sectoresResult);

        // console.log(`✅ Catálogo cargado (Filtrado): ${filteredModels.length} modelos, ${filteredDevs.length} desarrollos.`);

      } catch (error) {
        console.error("❌ Error crítico cargando catálogo:", error);
      } finally {
        setLoadingCatalog(false);
      }
    };

    loadCatalogData();
  }, [selectedCity]); // Recargamos si cambia la ciudad

  /* 
   * MEMOIZATION OPTIMIZATION
   * We wrap the context value in useMemo to prevent unnecessary re-renders 
   * of consuming components when the Context parent simply re-renders but data hasn't changed.
   */
  const value = useMemo(() => ({
    modelos,
    desarrollos,
    amenidades,
    sectores,
    loadingCatalog,

    // Buscadores rápidos en memoria
    getModeloById: (id) => modelos.find(m => m.id === id),
    getDesarrolloById: (id) => desarrollos.find(d => d.id === id),
  }), [modelos, desarrollos, amenidades, sectores, loadingCatalog]);

  return (
    <CatalogContext.Provider value={value}>
      {children}
    </CatalogContext.Provider>
  );
};