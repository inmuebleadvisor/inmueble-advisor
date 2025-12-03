// src/context/CatalogContext.jsx
// ÚLTIMA MODIFICACION: 02/12/2025

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  obtenerDatosUnificados, 
  obtenerInventarioDesarrollos, 
  obtenerTopAmenidades 
} from '../services/catalog.service';

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
        const [modelosData, desarrollosData, amenidadesData] = await Promise.all([
          obtenerDatosUnificados(),
          obtenerInventarioDesarrollos(),
          obtenerTopAmenidades()
        ]);

        setModelos(modelosData);
        setDesarrollos(desarrollosData);
        setAmenidades(amenidadesData);
        
        console.log(`✅ Catálogo cargado: ${modelosData.length} modelos, ${desarrollosData.length} desarrollos.`);

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