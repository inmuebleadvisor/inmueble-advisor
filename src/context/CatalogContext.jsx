// src/context/CatalogContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  obtenerDatosUnificados, 
  obtenerInventarioDesarrollos, 
  obtenerTopAmenidades 
} from '../services/catalog.service';

const CatalogContext = createContext();

/**
 * Hook personalizado para un acceso sencillo a los datos del catálogo.
 * @returns {Object} El estado global del catálogo.
 */
export const useCatalog = () => {
  return useContext(CatalogContext);
};

/**
 * Proveedor de Catálogo
 * PORQUÉ: Centralizar la carga evita que componentes como Mapa y Catálogo
 * hagan llamadas repetidas a Firestore, mejorando la velocidad y reduciendo costos.
 */
export const CatalogProvider = ({ children }) => {
  const [modelos, setModelos] = useState([]);
  const [desarrollos, setDesarrollos] = useState([]);
  const [amenidades, setAmenidades] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  useEffect(() => {
    // Función asíncrona para cargar todos los datos en paralelo
    const loadCatalogData = async () => {
      setLoadingCatalog(true);
      try {
        // La capa de servicios maneja el caché, por lo que estas llamadas
        // solo leerán de Firestore una vez y de la memoria del cliente después.
        const [modelosData, desarrollosData, amenidadesData] = await Promise.all([
          obtenerDatosUnificados(),
          obtenerInventarioDesarrollos(),
          obtenerTopAmenidades()
        ]);

        setModelos(modelosData);
        setDesarrollos(desarrollosData);
        setAmenidades(amenidadesData);
        
        console.log("✅ Catálogo cargado y en caché del contexto.");

      } catch (error) {
        console.error("Error al cargar el catálogo inicial:", error);
      } finally {
        setLoadingCatalog(false);
      }
    };

    loadCatalogData();
  }, []);

  // Proporcionamos los datos del catálogo a toda la aplicación
  const value = {
    modelos,
    desarrollos,
    amenidades,
    loadingCatalog,
    
    /**
     * Función utilitaria para obtener un modelo por ID (para rutas de detalle).
     * PORQUÉ: Es mucho más rápido buscar en la memoria (el array 'modelos') que 
     * hacer otra llamada 'getDoc' a Firestore.
     * @param {string} id - ID del modelo a buscar.
     * @returns {Object | undefined} El objeto modelo encontrado.
     */
    getModeloById: (id) => modelos.find(m => m.id === id),
    
    /**
     * Función utilitaria para obtener un desarrollo por ID (útil para la carga del mapa/catálogo).
     * @param {string} id - ID del desarrollo.
     * @returns {Object | undefined} El objeto desarrollo encontrado.
     */
    getDesarrolloById: (id) => desarrollos.find(d => d.id === id),
  };

  return (
    <CatalogContext.Provider value={value}>
      {children}
    </CatalogContext.Provider>
  );
};