import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { agregarFavoritoAPI, eliminarFavoritoAPI, obtenerFavoritosAPI } from '../services/favorites.service';

const FavoritesContext = createContext();

export const useFavorites = () => useContext(FavoritesContext);

export const FavoritesProvider = ({ children }) => {
  const { user } = useUser();
  const [favoritosIds, setFavoritosIds] = useState([]); // Solo guardamos IDs

  // 1. Efecto: Cargar favoritos al iniciar o cambiar usuario
  useEffect(() => {
    const cargar = async () => {
      if (user) {
        // Si hay usuario, traemos de Firebase
        const cloudFavs = await obtenerFavoritosAPI(user.uid);
        
        // Lógica de Fusión (Merge): Local + Cloud al loguearse
        const localFavs = JSON.parse(localStorage.getItem('temp_favs') || '[]');
        if (localFavs.length > 0) {
            // Si tenía favoritos anónimos, los subimos a su cuenta
            // (Esta lógica se puede refinar para no saturar, pero es funcional)
            const merged = [...new Set([...cloudFavs, ...localFavs])];
            setFavoritosIds(merged);
            // Limpiamos local y subimos todo (bucle asíncrono o batch idealmente)
            localFavs.forEach(id => agregarFavoritoAPI(user.uid, id));
            localStorage.removeItem('temp_favs');
        } else {
            setFavoritosIds(cloudFavs);
        }
      } else {
        // Si es guest, leemos de localStorage
        const localFavs = JSON.parse(localStorage.getItem('temp_favs') || '[]');
        setFavoritosIds(localFavs);
      }
    };
    cargar();
  }, [user]);

  // 2. Acción: Alternar favorito (Toggle)
  const toggleFavorite = async (modeloId) => {
    const existe = favoritosIds.includes(modeloId);
    
    // Optimistic UI Update: Actualizamos el estado local INMEDIATAMENTE
    // para que la UI se sienta instantánea, luego llamamos a la API.
    let nuevosFavs;
    if (existe) {
      nuevosFavs = favoritosIds.filter(id => id !== modeloId);
    } else {
      nuevosFavs = [...favoritosIds, modeloId];
    }
    setFavoritosIds(nuevosFavs);

    // Persistencia
    if (user) {
      if (existe) await eliminarFavoritoAPI(user.uid, modeloId);
      else await agregarFavoritoAPI(user.uid, modeloId);
    } else {
      localStorage.setItem('temp_favs', JSON.stringify(nuevosFavs));
    }
  };

  const isFavorite = (id) => favoritosIds.includes(id);

  return (
    <FavoritesContext.Provider value={{ favoritosIds, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};