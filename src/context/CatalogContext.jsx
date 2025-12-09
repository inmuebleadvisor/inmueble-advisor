// src/context/CatalogContext.jsx
// ÚLTIMA MODIFICACION: 02/12/2025

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  obtenerDatosUnificados,
  obtenerInventarioDesarrollos,
  obtenerTopAmenidades
} from '../services/catalog.service';
import { getPlatformSettings } from '../services/config.service';

const CatalogContext = createContext();

export const useCatalog = () => {
  return useContext(CatalogContext);
};

export const CatalogProvider = ({ children }) => {
  const [modelos, setModelos] = useState([]);
  const [desarrollos, setDesarrollos] = useState([]);
  const [amenidades, setAmenidades] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  useEffect(() => {
    const loadCatalogData = async () => {
      setLoadingCatalog(true);
      try {
        console.log("🔄 Iniciando carga de catálogo v1.1...");

        // Ejecutamos en paralelo para eficiencia
        const [modelosData, desarrollosData, amenidadesData, settings] = await Promise.all([
          obtenerDatosUnificados(),
          obtenerInventarioDesarrollos(),
          obtenerTopAmenidades(),
          getPlatformSettings()
        ]);

        console.log("Configuración Global cargada:", settings);

        // --- FILTRADO GLOBAL POR VISIBILIDAD DE ADMINISTRACIÓN ---

        // 1. Filtrar Modelos
        let filteredModels = modelosData.filter(m => {
          // Regla: Hide No Price
          if (settings.hideNoPriceModels) {
            const price = typeof m.precioNumerico === 'number' ? m.precioNumerico : 0;
            if (!price || price <= 0) return false;
          }
          // Regla: Hide No Photos
          if (settings.hideNoPhotosModels) {
            const hasImage = m.imagen || m.media?.render;
            const hasPlans = m.media?.plantasArquitectonicas?.length > 0 || m.plantas?.length > 0;
            const hasVirtual = m.media?.recorridoVirtual || m.recorrido360;
            if (!hasImage && !hasPlans && !hasVirtual) return false;
          }
          return true;
        });

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
        setAmenidades(amenidadesData);

        console.log(`✅ Catálogo cargado (Filtrado): ${filteredModels.length} modelos, ${filteredDevs.length} desarrollos.`);

      } catch (error) {
        console.error("❌ Error crítico cargando catálogo:", error);
      } finally {
        setLoadingCatalog(false);
      }
    };

    loadCatalogData();
  }, []);

  const value = {
    modelos,
    desarrollos,
    amenidades,
    loadingCatalog,

    // Buscadores rápidos en memoria
    getModeloById: (id) => modelos.find(m => m.id === id),
    getDesarrolloById: (id) => desarrollos.find(d => d.id === id),
  };

  return (
    <CatalogContext.Provider value={value}>
      {children}
    </CatalogContext.Provider>
  );
};