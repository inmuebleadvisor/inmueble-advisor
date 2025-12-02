// src/context/FavoritesContext.jsx
// ÚLTIMA MODIFICACION: 02/12/2025
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { agregarFavoritoAPI, eliminarFavoritoAPI, obtenerFavoritosAPI } from '../services/favorites.service';

const FavoritesContext = createContext();

export const useFavorites = () => useContext(FavoritesContext);

export const FavoritesProvider = ({ children }) => {
  const { user } = useUser();
  const [favoritosIds, setFavoritosIds] = useState([]); // Array de IDs de modelos

  // 1. EFECTO: Sincronización Estricta (Nube -> App)
  // Se eliminó toda lógica de localStorage. La "Fuente de Verdad" es Firestore.
  useEffect(() => {
    // Si no hay usuario autenticado, el estado debe estar vacío por seguridad y consistencia.
    if (!user) {
      setFavoritosIds([]);
      return;
    }

    // Si hay usuario, recuperamos sus favoritos reales de la BD.
    const cargarFavoritos = async () => {
      try {
        const cloudFavs = await obtenerFavoritosAPI(user.uid);
        // Aseguramos que sea un array para evitar errores de renderizado
        setFavoritosIds(Array.isArray(cloudFavs) ? cloudFavs : []);
      } catch (error) {
        console.error("Error al cargar favoritos del usuario:", error);
        // En caso de error, podríamos optar por no mostrar nada o reintentar
        setFavoritosIds([]);
      }
    };

    cargarFavoritos();
  }, [user]); // Se re-ejecuta automáticamente al cambiar la sesión (login/logout)

  // 2. ACCIÓN: Toggle (Alternar Favorito)
  const toggleFavorite = async (modeloId) => {
    // A. Validación de Seguridad:
    // Aunque la UI (botón) debe manejar el login, el contexto actúa como guardián final.
    if (!user) {
        console.warn("[Favorites] Intento de modificación sin sesión activa.");
        return false; 
    }

    const existe = favoritosIds.includes(modeloId);
    
    // B. Optimistic UI Update: 
    // Actualizamos el estado local INMEDIATAMENTE para respuesta instantánea (0ms latencia percibida).
    const estadoAnterior = [...favoritosIds]; // Backup para rollback
    let nuevosFavs;
    
    if (existe) {
      nuevosFavs = favoritosIds.filter(id => id !== modeloId);
    } else {
      nuevosFavs = [...favoritosIds, modeloId];
    }
    setFavoritosIds(nuevosFavs);

    // C. Persistencia Asíncrona (Background):
    try {
      if (existe) {
        await eliminarFavoritoAPI(user.uid, modeloId);
      } else {
        await agregarFavoritoAPI(user.uid, modeloId);
      }
      return true; // Operación exitosa
    } catch (error) {
      // D. Rollback en caso de error (Consistencia de datos)
      console.error("[Favorites] Error de sincronización, revirtiendo cambio:", error);
      setFavoritosIds(estadoAnterior);
      // Aquí podrías disparar un Toast de error si tuvieras un sistema de notificaciones global
      return false;
    }
  };

  const isFavorite = (id) => favoritosIds.includes(id);

  return (
    <FavoritesContext.Provider value={{ favoritosIds, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};